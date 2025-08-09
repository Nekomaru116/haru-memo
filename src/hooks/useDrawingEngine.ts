// hooks/useDrawingEngine.ts - マルチボード対応版

import { useState, useEffect, useCallback } from 'react';
import { NotesService } from '../db/database';
import type { CanvasLine } from '../db/database';
import type {
  DrawingTool, 
  UseDrawingEngineReturn,
  CanvasState,
  AppMode
} from '../types';

export const useDrawingEngine = (
  appMode: AppMode,
  canvasState: CanvasState,
  editingNote: any,
  isSearchActive: boolean,
  currentBoardId: string | null // 🔧 新規追加：現在のボードID
): UseDrawingEngineReturn => {
  // 状態管理
  const [lines, setLines] = useState<CanvasLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pen_red');

  // 🔧 修正：ボード切り替え時にデータを読み込み
  useEffect(() => {
    const loadLines = async () => {
      try {
        if (currentBoardId) {
          console.log('🎨 描画線読み込み開始:', currentBoardId);
          const loadedLines = await NotesService.getAllLines(currentBoardId);
          setLines(loadedLines);
          console.log('✅ 描画線読み込み完了:', loadedLines.length, '本');
        } else {
          // ボードが選択されていない場合は空にする
          setLines([]);
        }
      } catch (error) {
        console.error('❌ 描画線の読み込みに失敗:', error);
        setLines([]);
      }
    };
    
    loadLines();
  }, [currentBoardId]); // currentBoardId変更時に再読み込み

  // 描画開始
  const handleDrawStart = useCallback((e: any) => {
    // 描画モードでなければ何もしない
    if (appMode !== 'drawing') return;
    // 編集中や検索中は描画しない
    if (editingNote || isSearchActive) return;
    // ボードが選択されていない場合は描画しない
    if (!currentBoardId) {
      console.warn('⚠️ ボードが選択されていないため描画を開始できません');
      return;
    }
    
    // タッチイベントの場合、マルチタッチは描画しない（ピンチズーム優先）
    if (e.evt.touches && e.evt.touches.length > 1) return;

    setIsDrawing(true);
    
    // Konvaステージの座標を取得
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    // キャンバスの変換を考慮した実際の座標を計算
    const realX = (pointer.x - canvasState.x) / canvasState.scale;
    const realY = (pointer.y - canvasState.y) / canvasState.scale;
    
    // 新しい線の開始点を設定
    setCurrentLine([realX, realY]);
    
    console.log('✏️ 描画開始:', { x: realX, y: realY, tool: selectedTool, boardId: currentBoardId });
  }, [appMode, editingNote, isSearchActive, canvasState, selectedTool, currentBoardId]);

  // 描画中（マウスムーブ・タッチムーブ）
  const handleDrawMove = useCallback((e: any) => {
    // 描画中でない場合は何もしない
    if (!isDrawing || appMode !== 'drawing') return;
    // ボードが選択されていない場合は何もしない
    if (!currentBoardId) return;
    
    // タッチイベントの場合、マルチタッチは描画しない
    if (e.evt.touches && e.evt.touches.length > 1) {
      // マルチタッチが検出されたら描画を中断
      setIsDrawing(false);
      setCurrentLine([]);
      return;
    }
    
    // タッチイベントのデフォルト動作を防ぐ（スクロール防止）
    if (e.evt.touches) {
      e.evt.preventDefault();
    }
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    // キャンバスの変換を考慮した実際の座標を計算
    const realX = (pointer.x - canvasState.x) / canvasState.scale;
    const realY = (pointer.y - canvasState.y) / canvasState.scale;
    
    // 現在の線に新しい座標を追加
    setCurrentLine(prevLine => [...prevLine, realX, realY]);
  }, [isDrawing, appMode, canvasState, currentBoardId]);

  // 描画終了（マウスアップ・タッチエンド）
  const handleDrawEnd = useCallback(async () => {
    if (!isDrawing || appMode !== 'drawing') return;
    // ボードが選択されていない場合は何もしない
    if (!currentBoardId) {
      setIsDrawing(false);
      setCurrentLine([]);
      return;
    }
    
    setIsDrawing(false);
    
    // 線が短すぎる場合は保存しない（誤タップ防止）
    if (currentLine.length < 4) {
      setCurrentLine([]);
      return;
    }
    
    // 消しゴムモードの場合は描画線を保存せず、消しゴム処理を実行
    if (selectedTool === 'eraser') {
      await handleEraseAtPosition();
      setCurrentLine([]);
      return;
    }
    
    try {
      // ペンモードの場合のみ描画線をデータベースに保存
      const newLine = {
        points: currentLine,
        color: selectedTool === 'pen_red' ? '#dc2626' : '#000000',
        strokeWidth: 2,
        tool: selectedTool,
        boardId: currentBoardId, // 🔧 修正：boardIdを追加
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 🔧 修正：boardIdを明示的に渡す
      const lineId = await NotesService.addLine(newLine, currentBoardId);
      const lineWithId = { ...newLine, id: lineId };
      
      setLines(prevLines => [...prevLines, lineWithId]);
      
      console.log('✅ 描画線を保存しました:', lineId, 'boardId:', currentBoardId);
      
    } catch (error) {
      console.error('❌ 描画線の保存に失敗:', error);
    } finally {
      setCurrentLine([]);
    }
  }, [isDrawing, appMode, currentLine, selectedTool, currentBoardId]);

  // 消しゴム処理：指定位置周辺の線を削除
  const handleEraseAtPosition = useCallback(async () => {
    if (currentLine.length < 2 || !currentBoardId) return;
    
    try {
      // 消しゴムの軌跡上のすべての点をチェック
      const erasedLineIds = new Set<string>();
      
      for (let i = 0; i < currentLine.length; i += 2) {
        const x = currentLine[i];
        const y = currentLine[i + 1];
        
        // 指定位置から半径15ピクセル以内の線を検索
        // 🔧 修正：boardIdを明示的に渡す
        const nearbyLines = await NotesService.getLinesInArea(x, y, 15, currentBoardId);
        
        // 見つかった線をマークする
        nearbyLines.forEach(line => {
          if (line.id) {
            erasedLineIds.add(line.id);
          }
        });
      }
      
      // マークされた線を削除
      for (const lineId of erasedLineIds) {
        await NotesService.deleteLine(lineId);
      }
      
      // 状態から削除された線を除去
      setLines(prevLines => 
        prevLines.filter(line => !erasedLineIds.has(line.id!))
      );
      
      if (erasedLineIds.size > 0) {
        console.log(`🧹 ${erasedLineIds.size}本の線を消去しました (ボード: ${currentBoardId})`);
      }
      
    } catch (error) {
      console.error('❌ 消しゴム処理に失敗:', error);
    }
  }, [currentLine, currentBoardId]);

  // 🔧 修正：指定ボードの全描画線削除
  const clearAllLines = useCallback(async () => {
    try {
      if (currentBoardId) {
        await NotesService.clearAllLines(currentBoardId);
        setLines([]);
        console.log('✅ 現在のボードの全描画線を削除しました:', currentBoardId);
      } else {
        console.warn('⚠️ ボードが選択されていないため削除できません');
      }
    } catch (error) {
      console.error('❌ 描画線削除に失敗:', error);
    }
  }, [currentBoardId]);

  return {
    drawingState: {
      lines,
      isDrawing,
      currentLine
    },
    selectedTool,
    setSelectedTool,
    drawingEventHandlers: {
      handleDrawStart,
      handleDrawMove,
      handleDrawEnd
    },
    clearAllLines
  };
};