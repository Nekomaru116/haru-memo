// hooks/useUnifiedTouchManager.ts - 変更検知版
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AppMode, CanvasState } from '../types';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

type TouchMode = 'none' | 'panning' | 'pinching' | 'drawing';

interface UnifiedTouchManagerProps {
  appMode: AppMode;
  editingNote: any;
  isSearchActive: boolean;
  canvasState: CanvasState;
  onCanvasStateChange: (state: CanvasState) => void;
  drawingHandlers: {
    handleDrawStart: (e: any) => void;
    handleDrawMove: (e: any) => void;
    handleDrawEnd: () => Promise<void>;
  };
  onCanvasStateChangeEnd?: (reason: string) => void; // 🔧 新規追加：変更完了時のコールバック
}

export const useUnifiedTouchManager = ({
  appMode,
  editingNote,
  isSearchActive,
  canvasState,
  onCanvasStateChange,
  drawingHandlers,
  onCanvasStateChangeEnd
}: UnifiedTouchManagerProps) => {
  // タッチ状態管理
  const [touchMode, setTouchMode] = useState<TouchMode>('none');
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([]);
  
  // ピンチズーム用の状態
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [initialCenter, setInitialCenter] = useState({ x: 0, y: 0 });
  const [initialCanvasState, setInitialCanvasState] = useState<CanvasState>(canvasState);
  
  // パン用の状態
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // 🔧 新規追加：変更検知用
  const [hasCanvasChanged, setHasCanvasChanged] = useState(false);
  const initialCanvasRef = useRef<CanvasState>(canvasState);
  
  // フレームレート制御
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef(0);

  // ユーティリティ関数
  const getTouchPoints = (e: any): TouchPoint[] => {
    const touches = e.evt.touches || [];
    return Array.from(touches).map((touch: any, index) => ({
      id: touch.identifier || index,
      x: touch.clientX,
      y: touch.clientY
    }));
  };

  const getDistance = (p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: TouchPoint, p2: TouchPoint): { x: number; y: number } => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  };

  // 🔧 新規追加：キャンバス状態の変更検知
  const checkCanvasChange = useCallback((newState: CanvasState) => {
    const initial = initialCanvasRef.current;
    const changed = (
      Math.abs(newState.x - initial.x) > 1 ||
      Math.abs(newState.y - initial.y) > 1 ||
      Math.abs(newState.scale - initial.scale) > 0.01
    );
    
    if (changed && !hasCanvasChanged) {
      setHasCanvasChanged(true);
    }
  }, [hasCanvasChanged]);

  // フレームレート制御付きの状態更新
  const updateCanvasStateThrottled = useCallback((newState: CanvasState) => {
    const now = performance.now();
    if (now - lastUpdateTime.current < 16) { // 60fps制限
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        onCanvasStateChange(newState);
        checkCanvasChange(newState);
        lastUpdateTime.current = performance.now();
      });
    } else {
      onCanvasStateChange(newState);
      checkCanvasChange(newState);
      lastUpdateTime.current = now;
    }
  }, [onCanvasStateChange, checkCanvasChange]);

  // タッチ開始
  const handleTouchStart = useCallback((e: any) => {
    // 付箋などのKonvaオブジェクト上のタッチかチェック
    const target = e.target;
    const stage = e.target.getStage();
    if (target !== stage ) {
        return;
    }
     // FloatingHeaderでの処理を優先させる
  const htmlTarget = e.evt?.target as HTMLElement;
  if (htmlTarget && htmlTarget.closest && htmlTarget.closest('[data-search-area]')) {
    return;
  }
  
    e.evt.preventDefault();
    
    const points = getTouchPoints(e);
    setTouchPoints(points);

    // 🔧 新規追加：操作開始時の初期状態を記録
    initialCanvasRef.current = { ...canvasState };
    setHasCanvasChanged(false);

    /*
    // 編集中や検索中は何もしない
    if (editingNote || isSearchActive) {
      setTouchMode('none');
      return;
    }
      */
    if (points.length === 1) {
      // 単体タッチ
      if (appMode === 'drawing') {
        setTouchMode('drawing');
        drawingHandlers.handleDrawStart(e);
      } else if (appMode === 'note') {
        setTouchMode('panning');
        setLastPanPoint({ x: points[0].x, y: points[0].y });
      }
    } else if (points.length === 2 && appMode === 'note') {
      // 描画モードからの切り替えがあった場合はまず描画を終了
      if (touchMode === 'drawing') {
        drawingHandlers.handleDrawEnd();
      }
      
      // ピンチズーム開始
      setTouchMode('pinching');
      
      const distance = getDistance(points[0], points[1]);
      const center = getCenter(points[0], points[1]);
      
      setInitialDistance(distance);
      setInitialScale(canvasState.scale);
      setInitialCenter(center);
      setInitialCanvasState({ ...canvasState });
    }
  }, [appMode, editingNote, isSearchActive, canvasState, drawingHandlers, touchMode]);

  // タッチ移動
  const handleTouchMove = useCallback((e: any) => {
    // アクティブなタッチモードがない場合はStageチェック
    if (touchMode === 'none' ) {
        const target = e.target;
        const stage = e.target.getStage();
        if (target !== stage) {
            return;
        }
    }

    e.evt.preventDefault();
    
    const points = getTouchPoints(e);
    setTouchPoints(points);

    if (touchMode === 'drawing' && points.length === 1) {
      // 描画継続
      drawingHandlers.handleDrawMove(e);
      
    } else if (touchMode === 'panning' && points.length === 1) {
      // パン操作
      const currentPoint = points[0];
      const deltaX = currentPoint.x - lastPanPoint.x;
      const deltaY = currentPoint.y - lastPanPoint.y;
      
      const newState = {
        ...canvasState,
        x: canvasState.x + deltaX,
        y: canvasState.y + deltaY
      };
      
      updateCanvasStateThrottled(newState);
      setLastPanPoint({ x: currentPoint.x, y: currentPoint.y });
      
    } else if (touchMode === 'pinching' && points.length === 2) {
      // ピンチズーム
      const currentDistance = getDistance(points[0], points[1]);
      const currentCenter = getCenter(points[0], points[1]);
      
      if (initialDistance > 0) {
        // スケール計算
        const scaleChange = currentDistance / initialDistance;
        let newScale = initialScale * scaleChange;
        
        // スケール制限
        newScale = Math.max(0.1, Math.min(3, newScale));
        
        // ズーム中心点の計算
        const mousePointTo = {
          x: (initialCenter.x - initialCanvasState.x) / initialCanvasState.scale,
          y: (initialCenter.y - initialCanvasState.y) / initialCanvasState.scale,
        };
        
        const newPos = {
          x: currentCenter.x - mousePointTo.x * newScale,
          y: currentCenter.y - mousePointTo.y * newScale,
        };
        
        const newState = {
          scale: newScale,
          x: newPos.x,
          y: newPos.y
        };
        
        updateCanvasStateThrottled(newState);
      }
      
    } else if (points.length > 2) {
      // 3点以上のタッチは無視（誤操作防止）
      setTouchMode('none');
    } else if (touchMode === 'pinching' && points.length === 1) {
      // ピンチ中に1点になった場合の処理
      if (appMode === 'note') {
        setTouchMode('panning');
        setLastPanPoint({ x: points[0].x, y: points[0].y });
      }
    }
  }, [touchMode, canvasState, initialDistance, initialScale, initialCenter, initialCanvasState, lastPanPoint, drawingHandlers, updateCanvasStateThrottled, appMode]);

  // タッチ終了
  const handleTouchEnd = useCallback(async (e: any) => {
    e.evt.preventDefault();
    
    const points = getTouchPoints(e);
    setTouchPoints(points);

    if (touchMode === 'drawing' && points.length === 0) {
      // 描画終了
      await drawingHandlers.handleDrawEnd();
      setTouchMode('none');
      
    } else if (touchMode === 'pinching' && points.length < 2) {
      // ピンチズーム終了
      setTouchMode('none');
      setInitialDistance(0);
      
      // 🔧 新規追加：ピンチズーム終了時の保存
      if (hasCanvasChanged && onCanvasStateChangeEnd) {
        onCanvasStateChangeEnd('ピンチズーム');
      }
      
      // 1点残っている場合はパンモードに移行
      if (points.length === 1 && appMode === 'note') {
        setTouchMode('panning');
        setLastPanPoint({ x: points[0].x, y: points[0].y });
      }
      
    } else if (touchMode === 'panning' && points.length === 0) {
      // パン終了
      setTouchMode('none');
      
      // 🔧 新規追加：パン終了時の保存
      if (hasCanvasChanged && onCanvasStateChangeEnd) {
        onCanvasStateChangeEnd('パン操作');
      }
    }
    
    // 🔧 新規追加：操作完了時のリセット
    if (points.length === 0) {
      setHasCanvasChanged(false);
    }
  }, [touchMode, appMode, drawingHandlers, hasCanvasChanged, onCanvasStateChangeEnd]);

  // マウスイベント（PC用のフォールバック）
  const handleMouseDown = useCallback((e: any) => {
    if ('ontouchstart' in window) return; // タッチデバイスでは無視
    
    if (editingNote || isSearchActive) return;
    
    // 🔧 新規追加：マウス操作開始時の初期状態を記録
    initialCanvasRef.current = { ...canvasState };
    setHasCanvasChanged(false);
    
    if (appMode === 'drawing') {
      setTouchMode('drawing');
      drawingHandlers.handleDrawStart(e);
    } else if (appMode === 'note') {
      setTouchMode('panning');
      const pointer = e.target.getStage().getPointerPosition();
      setLastPanPoint({ x: pointer.x, y: pointer.y });
    }
  }, [appMode, editingNote, isSearchActive, drawingHandlers, canvasState]);

  const handleMouseMove = useCallback((e: any) => {
    if ('ontouchstart' in window) return;
    
    if (touchMode === 'drawing') {
      drawingHandlers.handleDrawMove(e);
    } else if (touchMode === 'panning') {
      const pointer = e.target.getStage().getPointerPosition();
      const deltaX = pointer.x - lastPanPoint.x;
      const deltaY = pointer.y - lastPanPoint.y;
      
      const newState = {
        ...canvasState,
        x: canvasState.x + deltaX,
        y: canvasState.y + deltaY
      };
      
      updateCanvasStateThrottled(newState);
      setLastPanPoint({ x: pointer.x, y: pointer.y });
    }
  }, [touchMode, canvasState, lastPanPoint, drawingHandlers, updateCanvasStateThrottled]);

  const handleMouseUp = useCallback(async (_e: any) => {
    if ('ontouchstart' in window) return;
    
    if (touchMode === 'drawing') {
      await drawingHandlers.handleDrawEnd();
    } else if (touchMode === 'panning') {
      // 🔧 新規追加：マウスパン終了時の保存
      if (hasCanvasChanged && onCanvasStateChangeEnd) {
        onCanvasStateChangeEnd('マウスパン');
      }
    }
    
    setTouchMode('none');
    setHasCanvasChanged(false);
  }, [touchMode, drawingHandlers, hasCanvasChanged, onCanvasStateChangeEnd]);

  // ホイールズーム（PC用）
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    if (editingNote || isSearchActive) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    // 🔧 新規追加：ホイール操作開始時の初期状態を記録
    if (!hasCanvasChanged) {
      initialCanvasRef.current = { ...canvasState };
      setHasCanvasChanged(true);
    }
    
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
    
    updateCanvasStateThrottled({ scale: clampedScale, x: newPos.x, y: newPos.y });
    
    // 🔧 新規追加：ホイール操作完了後の保存（デバウンス）
    setTimeout(() => {
      if (hasCanvasChanged && onCanvasStateChangeEnd) {
        onCanvasStateChangeEnd('ホイールズーム');
        setHasCanvasChanged(false);
      }
    }, 300);
  }, [editingNote, isSearchActive, updateCanvasStateThrottled, hasCanvasChanged, onCanvasStateChangeEnd, canvasState]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  return {
    touchMode,
    touchPoints,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onWheel: handleWheel
    }
  };
};