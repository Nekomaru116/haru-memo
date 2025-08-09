// hooks/useNotesManager.ts - マルチボード対応版

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { NotesService } from '../db/database';
import type { StickyNote } from '../db/database';
import type { 
  ExtendedStickyNote, 
  UseNotesManagerReturn,
  CanvasState,
  ScreenSize
} from '../types';
import {WhiteboardService} from '../db/database.ts'

export const useNotesManager = (
  canvasState: CanvasState,
  screenSize: ScreenSize,
  animateCanvasTo: (targetState: CanvasState, duration?: number) => Promise<void>,
  currentBoardId: string | null, 
  onBoardStateChange?: (reason: string) => void // 🔧 新規追加：ボード状態変更通知
): UseNotesManagerReturn => {
  // 状態管理
  const [notes, setNotes] = useState<ExtendedStickyNote[]>([]);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(1000);
  const [isLoading, setIsLoading] = useState(true);
  
  // アニメーション管理
  const animationFrameRef = useRef<number | null>(null);

  
// 🔧 新規追加：チュートリアルデータリフレッシュ用のuseEffect
useEffect(() => {
  const handleTutorialDataRefresh = async (event: Event) => {
    // 型ガードを使用
    if (event.type !== 'tutorial-data-refresh') return;
    
    const customEvent = event as CustomEvent<{ boardId: string }>;
    const { boardId } = customEvent.detail;
    
    console.log('🔄 チュートリアルデータリフレッシュ要求:', boardId);
    
    if (boardId === currentBoardId && currentBoardId) { // 🔧 null チェック追加
      try {
        console.log('📝 付箋データを再読み込み中...');
        
        const loadedNotes = await NotesService.getAllNotes(currentBoardId);
        const notesWithColor = loadedNotes.map(note => ({
          ...note,
          color: note.color || 'yellow'
        }));
        
        setNotes(notesWithColor);
        
        const currentMaxZ = Math.max(...notesWithColor.map(n => n.zIndex || 1000), 1000);
        setMaxZIndex(currentMaxZ);
        
        console.log(`✅ チュートリアルデータリフレッシュ完了: ${notesWithColor.length}件の付箋を表示`);
        
        if (onBoardStateChange) {
          onBoardStateChange('チュートリアル表示');
        }
        
      } catch (error) {
        console.error('❌ チュートリアルデータリフレッシュに失敗:', error);
      }
    }
  };
  
  window.addEventListener('tutorial-data-refresh', handleTutorialDataRefresh);
  
  return () => {
    window.removeEventListener('tutorial-data-refresh', handleTutorialDataRefresh);
  };
}, [currentBoardId, onBoardStateChange]);


  // 🔧 修正：ボード切り替え時にデータを読み込み
  useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      if (currentBoardId) { // 🔧 修正：null チェックを追加
        console.log('📝 付箋データ読み込み開始:', currentBoardId);
        const loadedNotes = await NotesService.getAllNotes(currentBoardId);
        const notesWithColor = loadedNotes.map(note => ({
          ...note,
          color: note.color || 'yellow'
        }));
        
        setNotes(notesWithColor);

        const currentMaxZ = Math.max(...notesWithColor.map(n => n.zIndex || 1000), 1000);
        setMaxZIndex(currentMaxZ);

        console.log(`✅ 付箋データ読み込み完了: ${notesWithColor.length}件 (ボード: ${currentBoardId})`);
      } else {
        // ボードが選択されていない場合は空にする
        setNotes([]);
        setMaxZIndex(1000);
        console.log('📝 ボード未選択のため付箋をクリア');
      }

    } catch (error) {
      console.error('❌ 付箋データの読み込みに失敗:', error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadData();
}, [currentBoardId]);

  // ソート済み付箋（メモ化で最適化）
  const sortedNotes = useMemo(() => {
    return notes.sort((a, b) => (a.zIndex || 1000) - (b.zIndex || 1000));
  }, [notes]);

  // アニメーション関数
  const easeInOutCubic = useCallback((t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }, []);

  const animateNotesTo = useCallback((
    targetPositions: Map<string, { x: number; y: number }>,
    duration: number = 600
  ): Promise<void> => {
    return new Promise((resolve) => {
      const startPositions = new Map<string, { x: number; y: number }>();
      notes.forEach(note => {
        if (note.id && targetPositions.has(note.id)) {
          startPositions.set(note.id, { x: note.x, y: note.y });
        }
      });

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        setNotes(prevNotes =>
          prevNotes.map(note => {
            if (!note.id || !targetPositions.has(note.id)) {
              return note;
            }

            const startPos = startPositions.get(note.id)!;
            const targetPos = targetPositions.get(note.id)!;
            const currentX = startPos.x + (targetPos.x - startPos.x) * easedProgress;
            const currentY = startPos.y + (targetPos.y - startPos.y) * easedProgress;
            return { ...note, x: currentX, y: currentY };
          })
        );

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    });
  }, [notes, easeInOutCubic]);

  const animateToCreatedNote = useCallback(async (note: StickyNote): Promise<void> => {
    const targetCanvasState = {
      scale: Math.max(canvasState.scale, 1.0),
      x: -note.x * Math.max(canvasState.scale, 1.0) + screenSize.width / 2,
      y: -note.y * Math.max(canvasState.scale, 1.0) + screenSize.height / 2 - 60,
    };
    
    await animateCanvasTo(targetCanvasState, 600);
  }, [canvasState, screenSize, animateCanvasTo]);

  // 🔧 修正：付箋追加時にboardIdを必須化
  const handleAddMemo = useCallback(async (text: string) => {
    if (!currentBoardId) {
      console.warn('⚠️ ボードが選択されていないため付箋を作成できません');
      return;
    }

    try {
      const centerX = (-canvasState.x + screenSize.width / 2) / canvasState.scale;
      const centerY = (-canvasState.y + screenSize.height / 2) / canvasState.scale;
      
      const randomOffsetX = (Math.random() - 0.5) * 200;
      const randomOffsetY = (Math.random() - 0.5) * 200;
      const initialX = centerX + randomOffsetX;
      const initialY = centerY + randomOffsetY;
      
      const newZIndex = maxZIndex + 1;
      setMaxZIndex(newZIndex);
      
      const newNote = {
        text,
        x: initialX,
        y: initialY,
        zIndex: newZIndex,
        color: 'yellow',
        boardId: currentBoardId, // 🔧 修正：boardIdを追加
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 🔧 修正：boardIdを明示的に渡す
      const id = await NotesService.addNote(newNote, currentBoardId);
      const noteWithId = { ...newNote, id, boardId: currentBoardId };
      
      setNotes(prevNotes => [...prevNotes, noteWithId]);
      await animateToCreatedNote(noteWithId);
      
      // 🔧 新規追加：付箋作成時の保存通知
      if (onBoardStateChange) {
        onBoardStateChange('付箋作成');
      }
      
      console.log('✅ 付箋を作成しました:', id, 'boardId:', currentBoardId);
      
    } catch (error) {
      console.error('❌ 付箋の追加に失敗:', error);
    }
  }, [canvasState, screenSize, maxZIndex, animateToCreatedNote, currentBoardId]);

  const updateNotePosition = useCallback(async (id: string, x: number, y: number) => {
    try {
      await NotesService.updateNote(id, { x, y });
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, x, y, updatedAt: new Date() } : note
        )
      );
    } catch (error) {
      console.error('❌ 付箋の位置更新に失敗:', error);
    }
  }, []);

  const updateNoteColor = useCallback(async (id: string, color: string) => {
    try {
      await NotesService.updateNote(id, { color });
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, color, updatedAt: new Date() } : note
        )
      );
    } catch (error) {
      console.error('❌ 付箋の色更新に失敗:', error);
    }
  }, []);

  const handleSaveNoteEdit = useCallback(async (id: string, newText: string) => {
    try {
      await NotesService.updateNote(id, { text: newText, updatedAt: new Date() });
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, text: newText, updatedAt: new Date() } : note
        )
      );
      setEditingNote(null);
    } catch (error) {
      console.error("❌ 付箋のテキスト更新に失敗", error);
    }
  }, []);

  const handleBringToFront = useCallback(async (id: string) => {
    try {
      const newZIndex = maxZIndex + 1;
      setMaxZIndex(newZIndex);
      await NotesService.updateNote(id, { zIndex: newZIndex });
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, zIndex: newZIndex, updatedAt: new Date() } : note
        )
      );
    } catch(error) {
      console.error("❌ 付箋のzIndex更新に失敗", error);
    }
  }, [maxZIndex]);

  const handleEditModeChange = useCallback(async (id: string, isEditing: boolean) => {
    if (isEditing) {
      const noteToEdit = notes.find(n => n.id === id);
      if (noteToEdit) {
        const minZoomForEdit = 1.0;
        
        if (canvasState.scale < minZoomForEdit) {
          const targetCanvasState = {
            scale: minZoomForEdit,
            x: -noteToEdit.x * minZoomForEdit + screenSize.width / 2,
            y: -noteToEdit.y * minZoomForEdit + screenSize.height / 2 - 100,
          };
          
          await animateCanvasTo(targetCanvasState, 300);
        }
        
        setEditingNote(noteToEdit);
      }
    } else {
      setEditingNote(null);
    }
  }, [notes, canvasState, screenSize, animateCanvasTo]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await NotesService.deleteNote(id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      console.log('✅ 付箋を削除しました:', id);
      if(currentBoardId){
        const tutorialCompleted = await WhiteboardService.checkTutorialCompletion(currentBoardId);
        if (tutorialCompleted) {
          window.dispatchEvent(new CustomEvent('tutorial-completed')); //PWA促進に使用予定
        }
      }

    } catch (error) {
      console.error('❌ 付箋の削除に失敗:', error);
    }
  }, [currentBoardId]);

  // 🔧 修正：現在のボードの全付箋削除
  const clearAllNotes = useCallback(async () => {
    try {
      if (currentBoardId) {
        await NotesService.clearAllNotes(currentBoardId);
        setNotes([]);
        console.log('✅ 現在のボードの全付箋を削除しました:', currentBoardId);

        //チュートリアル完了チェック
        const tutorialCompleted = await WhiteboardService.checkTutorialCompletion(currentBoardId);
        if (tutorialCompleted) {
          window.dispatchEvent(new CustomEvent('tutorial-completed'));
        }
      } else {
        console.warn('⚠️ ボードが選択されていないため削除できません');
      }
    } catch (error) {
      console.error('❌ 全付箋削除に失敗:', error);
    }
  }, [currentBoardId]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    notes: sortedNotes,
    editingNote,
    maxZIndex,
    isLoading,
    eventHandlers: {
      onDrag: updateNotePosition,
      onDelete: deleteNote,
      onColorChange: updateNoteColor,
      onBringToFront: handleBringToFront,
      onEditModeChange: handleEditModeChange
    },
    handleAddMemo,
    handleSaveNoteEdit,
    animateNotesTo,
    clearAllNotes
  };
};