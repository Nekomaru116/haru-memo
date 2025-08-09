// hooks/useCanvasOperations.ts - キャンバス操作専用フック

import { useState, useEffect, useRef, useCallback } from 'react';
import { NotesService } from '../db/database';
import type { 
  CanvasState, 
  ScreenSize, 
  //AnimationState, 
  //PinchState,
  UseCanvasOperationsReturn,
  AppMode,
  ExtendedStickyNote
} from '../types';

export const useCanvasOperations = (
  appMode: AppMode,
  editingNote: ExtendedStickyNote | null,
  _isSearchActive: boolean
): UseCanvasOperationsReturn => {
  // 状態管理
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    x: 0,
    y: 0
  });

  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // アニメーション管理
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // ピンチズーム管理
  const [lastCenter, setLastCenter] = useState<{x: number, y: number} | null>(null);
  const [lastDist, setLastDist] = useState(0);

  // 画面サイズ変更の監視
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // キャンバス状態の永続化（改良版）
  useEffect(() => {
    const loadCanvasState = async () => {
      try {
        const savedCanvasState = await NotesService.getCanvasState();
        if (savedCanvasState) {
          console.log('保存されたキャンバス状態を復元:', savedCanvasState);
          setCanvasState({
            scale: savedCanvasState.scale,
            x: savedCanvasState.x,
            y: savedCanvasState.y
          });
        } else {
          console.log('保存されたキャンバス状態が見つかりません - デフォルト状態を使用');
        }
      } catch (error) {
        console.error('キャンバス状態の読み込みに失敗:', error);
      }
    };
    loadCanvasState();
  }, []);

  // キャンバス状態の保存（デバウンス付き）
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await NotesService.saveCanvasState(canvasState);
        console.log('キャンバス状態を保存:', canvasState);
      } catch (error) {
        console.error('キャンバス状態の保存に失敗:', error);
      }
    }, 500); // 500ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [canvasState]);

  // アニメーション関数
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animateCanvasTo = useCallback((
    targetState: CanvasState,
    duration: number = 400
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (isAnimating && animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setIsAnimating(true);
      const startState = { ...canvasState };
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        const currentScale = startState.scale + (targetState.scale - startState.scale) * easedProgress;
        const currentX = startState.x + (targetState.x - startState.x) * easedProgress;
        const currentY = startState.y + (targetState.y - startState.y) * easedProgress;

        setCanvasState({
          scale: currentScale,
          x: currentX,
          y: currentY
        });

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          animationFrameRef.current = null;
          resolve();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [canvasState, isAnimating]);

  const animateNotesTo = useCallback((
    _targetPositions: Map<string, { x: number; y: number }>,
    _duration: number = 600
  ): Promise<void> => {
    return new Promise((resolve) => {
      // この関数は useNotesManager で実装されるため、ここでは空実装
      // 依存関係を避けるため、この関数は後で統合時に調整
      console.warn('animateNotesTo は useNotesManager で実装される予定');
      resolve();
    });
  }, []);

  const animateToCreatedNote = useCallback(async (note: ExtendedStickyNote): Promise<void> => {
    const targetCanvasState = {
      scale: Math.max(canvasState.scale, 1.0),
      x: -note.x * Math.max(canvasState.scale, 1.0) + screenSize.width / 2,
      y: -note.y * Math.max(canvasState.scale, 1.0) + screenSize.height / 2 - 60,
    };
    
    await animateCanvasTo(targetCanvasState, 600);
  }, [canvasState, screenSize, animateCanvasTo]);

  // ユーティリティ関数
  const getDistance = (p1: any, p2: any) => 
    Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  const getCenter = (p1: any, p2: any) => 
    ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

  // イベントハンドラー
  const handlePinchStart = useCallback((e: any) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      setLastCenter(getCenter(p1, p2));
      setLastDist(getDistance(p1, p2));
    }
  }, []);

  const handlePinchMove = useCallback((e: any) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;
    if (touches.length === 2 && lastCenter && lastDist > 0) {
      const p1 = { x: touches[0].clientX, y: touches[0].clientY };
      const p2 = { x: touches[1].clientX, y: touches[1].clientY };
      const newCenter = getCenter(p1, p2);
      const newDist = getDistance(p1, p2);
      
      const scaleChange = newDist / lastDist;
      const newScale = Math.max(0.1, Math.min(3, canvasState.scale * scaleChange));
      
      const mousePointTo = {
        x: (lastCenter.x - canvasState.x) / canvasState.scale,
        y: (lastCenter.y - canvasState.y) / canvasState.scale,
      };
      
      const newPos = {
        x: lastCenter.x - mousePointTo.x * newScale,
        y: lastCenter.y - mousePointTo.y * newScale,
      };
      
      setCanvasState({ scale: newScale, x: newPos.x, y: newPos.y });
      setLastCenter(newCenter);
      setLastDist(newDist);
    }
  }, [lastCenter, lastDist, canvasState]);

  const handlePinchEnd = useCallback(() => {
    setLastCenter(null);
    setLastDist(0);
  }, []);

  const handleStageDragEnd = useCallback((e: any) => {
    if (editingNote || appMode === 'drawing') return;
    setCanvasState({ ...canvasState, x: e.target.x(), y: e.target.y() });
  }, [editingNote, appMode, canvasState]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(3, newScale));
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    setCanvasState({ scale: clampedScale, x: newPos.x, y: newPos.y });
  }, []);

  const resetView = useCallback(() => {
    animateCanvasTo({ scale: 1, x: 0, y: 0 });
  }, [animateCanvasTo]);

  // 外部からの状態更新を受け入れる関数
  const updateCanvasState = useCallback((newState: CanvasState) => {
    setCanvasState(newState);
  }, []);

  // ダミーの描画ハンドラー（描画フックで実装）
  const handleDrawStart = useCallback((_e: any) => {
    console.warn('handleDrawStart は useDrawingEngine で実装される予定');
  }, []);

  const handleDrawMove = useCallback((_e: any) => {
    console.warn('handleDrawMove は useDrawingEngine で実装される予定');
  }, []);

  const handleDrawEnd = useCallback(async () => {
    console.warn('handleDrawEnd は useDrawingEngine で実装される予定');
  }, []);

  return {
    canvasState,
    screenSize,
    animationState: {
      isAnimating,
      frameRef: animationFrameRef
    },
    pinchState: {
      lastCenter,
      lastDist
    },
    eventHandlers: {
      handlePinchStart,
      handlePinchMove,
      handlePinchEnd,
      handleDrawStart,
      handleDrawMove,
      handleDrawEnd,
      handleStageDragEnd,
      handleWheel
    },
    animationFunctions: {
      animateCanvasTo,
      animateNotesTo,
      animateToCreatedNote
    },
    resetView,
    updateCanvasState
  };
};