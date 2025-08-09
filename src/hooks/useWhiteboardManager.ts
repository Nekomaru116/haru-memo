// hooks/useWhiteboardManager.ts - ホワイトボード管理フック

import { useState, useEffect, useCallback } from 'react';
import { getDefaultBoardColor } from '../utils/boardColors';
import { WhiteboardService, type Whiteboard } from '../db/database';

export interface UseWhiteboardManagerReturn {
  // 状態
  whiteboards: Whiteboard[];
  currentBoardId: string | null;
  currentBoard: Whiteboard | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作
  createBoard: (name?: string) => Promise<string>;
  switchToBoard: (boardId: string) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Omit<Whiteboard, 'id'>>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  refreshBoards: () => Promise<void>;
  
  // ユーティリティ
  getBoardById: (boardId: string) => Whiteboard | undefined;
  getTotalBoardCount: () => number;
  getVisibleBoards: (maxDisplay?: number) => Whiteboard[];
  getHiddenBoardCount: (maxDisplay?: number) => number;
}

export const useWhiteboardManager = (): UseWhiteboardManagerReturn => {
  // 状態管理
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 現在のボード取得（メモ化）
  const currentBoard = whiteboards.find(board => board.id === currentBoardId) || null;

  // 初期化処理
  useEffect(() => {
  const initializeBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const boards = await WhiteboardService.getAllWhiteboards();
      
      if (boards.length === 0) {
        console.log('📋 ボードが存在しないため、デフォルトボードを作成');
        
        // 🔧 修正：初回起動時は必ずチュートリアルフラグを設定
        const isFirstTime = !localStorage.getItem('welcome_completed');
        if (isFirstTime) {
          console.log('🎯 初回起動検出 - チュートリアルフラグを設定');
          localStorage.setItem('should_create_tutorial', 'true');
        }
        
        const defaultBoardId = await WhiteboardService.createDefaultBoard();
        
        const updatedBoards = await WhiteboardService.getAllWhiteboards();
        setWhiteboards(updatedBoards);
        setCurrentBoardId(defaultBoardId);
        
        console.log('✅ デフォルトボード作成完了:', defaultBoardId);
      } else {
        // 既存ボードがある場合のチュートリアル処理
        const shouldCreateTutorial = localStorage.getItem('should_create_tutorial') === 'true';
        
        if (shouldCreateTutorial && boards[0]?.id) {
          console.log('🎯 既存ボードにチュートリアル付箋を作成予定');
          await WhiteboardService.createTutorialNotes(boards[0].id);
        }
        
        setWhiteboards(boards);
        setCurrentBoardId(boards[0].id!);
        
        console.log('✅ 既存ボード読み込み完了:', boards.length, '件');
        console.log('🎯 アクティブボード:', boards[0].id, boards[0].name);
      }
      
    } catch (err) {
      console.error('❌ ボード初期化に失敗:', err);
      setError('ボードの初期化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  initializeBoards();
}, []);

  // ボード一覧の更新
  const refreshBoards = useCallback(async () => {
    try {
      setError(null);
      const boards = await WhiteboardService.getAllWhiteboards();
      setWhiteboards(boards);
      console.log('🔄 ボード一覧を更新しました:', boards.length, '件');
    } catch (err) {
      console.error('❌ ボード一覧更新に失敗:', err);
      setError('ボード一覧の更新に失敗しました');
    }
  }, []);

  // 新規ボード作成
  const createBoard = useCallback(async (name?: string, color?: string): Promise<string> => {
    try {
      setError(null);
      
      // デフォルト名生成
      const boardName = name || new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '/');
      
      console.log('📋 新規ボード作成開始:', boardName, 'color:', color);
      
    let boardColor = color;
    if (!boardColor) {
      boardColor = getDefaultBoardColor(); // 🔧 修正：デフォルト色（グレー）を使用
    }

      // ボード作成（色指定対応）
      const newBoardId = await WhiteboardService.createWhiteboard(boardName, boardColor);

      // ボード一覧を更新
      await refreshBoards();
      
      // 新規ボードをアクティブに設定
      setCurrentBoardId(newBoardId);
      
      console.log('✅ 新規ボード作成完了:', newBoardId, boardName);
      return newBoardId;
      
    } catch (err) {
      console.error('❌ ボード作成に失敗:', err);
      setError('ボードの作成に失敗しました');
      throw err;
    }
  }, [refreshBoards]);

  // ボード切り替え
  const switchToBoard = useCallback(async (boardId: string): Promise<void> => {
    try {
      setError(null);
      
      console.log('🔄 ボード切り替え開始:', boardId);
      
      // ボードの存在確認
      const targetBoard = await WhiteboardService.getWhiteboard(boardId);
      if (!targetBoard) {
        throw new Error(`ボードが見つかりません: ${boardId}`);
      }
      
      // アクティブボードを変更
      setCurrentBoardId(boardId);
      
      // ボードの最終更新日時を更新（使用順序のため）
      await WhiteboardService.updateWhiteboard(boardId, {});
      
      // ボード一覧を更新（順序変更を反映）
      await refreshBoards();
      
      console.log('✅ ボード切り替え完了:', boardId, targetBoard.name);
      
    } catch (err) {
      console.error('❌ ボード切り替えに失敗:', err);
      setError('ボードの切り替えに失敗しました');
      throw err;
    }
  }, [refreshBoards]);

  // ボード更新
  const updateBoard = useCallback(async (
    boardId: string, 
    updates: Partial<Omit<Whiteboard, 'id'>>
  ): Promise<void> => {
    try {
      setError(null);
      
      // console.log('📝 ボード更新開始:', boardId, updates); // ← ログ削除
      
      await WhiteboardService.updateWhiteboard(boardId, updates);
      
      // ローカル状態も更新
      setWhiteboards(prev => 
        prev.map(board => 
          board.id === boardId 
            ? { ...board, ...updates, updatedAt: new Date() }
            : board
        )
      );
      
      // console.log('✅ ボード更新完了:', boardId); // ← ログ削除
      
    } catch (err) {
      console.error('❌ ボード更新に失敗:', err);
      setError('ボードの更新に失敗しました');
      throw err;
    }
  }, []);

  // ボード削除
  const deleteBoard = useCallback(async (boardId: string): Promise<void> => {
    try {
      setError(null);
      
      console.log('🗑️ ボード削除開始:', boardId);
      
      // 最後のボードの削除を防止
      if (whiteboards.length <= 1) {
        throw new Error('最後のボードは削除できません');
      }
      
      // 削除対象ボードの情報を保存
      const targetBoard = whiteboards.find(board => board.id === boardId);
      const isCurrentBoard = currentBoardId === boardId;
      
      // ボードとその関連データを削除
      await WhiteboardService.deleteWhiteboard(boardId);
      
      // アクティブボードが削除された場合の処理
      if (isCurrentBoard) {
        const remainingBoards = whiteboards.filter(board => board.id !== boardId);
        if (remainingBoards.length > 0) {
          // 最新のボードに切り替え
          setCurrentBoardId(remainingBoards[0].id!);
          console.log('🎯 削除により自動切り替え:', remainingBoards[0].id, remainingBoards[0].name);
        }
      }
      
      // ボード一覧を更新
      await refreshBoards();
      
      console.log('✅ ボード削除完了:', boardId, targetBoard?.name);
      
    } catch (err) {
      console.error('❌ ボード削除に失敗:', err);
      setError(err instanceof Error ? err.message : 'ボードの削除に失敗しました');
      throw err;
    }
  }, [whiteboards, currentBoardId, refreshBoards]);

  // ユーティリティ関数
  const getBoardById = useCallback((boardId: string): Whiteboard | undefined => {
    return whiteboards.find(board => board.id === boardId);
  }, [whiteboards]);

  const getTotalBoardCount = useCallback((): number => {
    return whiteboards.length;
  }, [whiteboards]);

  const getVisibleBoards = useCallback((maxDisplay: number = 5): Whiteboard[] => {
    return whiteboards.slice(0, maxDisplay);
  }, [whiteboards]);

  const getHiddenBoardCount = useCallback((maxDisplay: number = 5): number => {
    return Math.max(0, whiteboards.length - maxDisplay);
  }, [whiteboards]);

  return {
    // 状態
    whiteboards,
    currentBoardId,
    currentBoard,
    isLoading,
    error,
    
    // 操作
    createBoard,
    switchToBoard,
    updateBoard,
    deleteBoard,
    refreshBoards,
    
    // ユーティリティ
    getBoardById,
    getTotalBoardCount,
    getVisibleBoards,
    getHiddenBoardCount
  };
};