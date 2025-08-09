// hooks/useSearchManager.ts - マルチボード対応版

import { useState, useCallback } from 'react';
import { NotesService } from '../db/database';
import type { 
  SearchState, 
  UseSearchManagerReturn,
  CanvasState,
  ScreenSize
} from '../types';

export const useSearchManager = (
  canvasState: CanvasState,
  screenSize: ScreenSize,
  animateCanvasTo: (targetState: CanvasState, duration?: number) => Promise<void>,
  _animateNotesTo: (targetPositions: Map<string, { x: number; y: number }>, duration?: number) => Promise<void>,
  currentBoardId: string | null // 🔧 新規追加：現在のボードID
): UseSearchManagerReturn => {
  // 検索状態管理
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isActive: false,
    currentIndex: 0,
    positions: [],
    originalPositions: new Map(),
    keyword: ''
  });

  // 検索開始前のキャンバス位置を保存
  const [savedCanvasState, setSavedCanvasState] = useState<CanvasState | null>(null);

  // 🔧 修正：現在のボード内で検索実行
  const handleSearch = useCallback(async (keyword: string) => {
    try {
      // 🔄 検索開始時に現在のキャンバス位置を保存
      console.log('🔍 検索開始 - 現在位置を保存:', canvasState);
      setSavedCanvasState({ ...canvasState });

      // 既存の検索状態をリセット
      setSearchState(prev => ({
        ...prev,
        originalPositions: new Map(),
        results: [],
        positions: [],
        keyword
      }));

      if (!currentBoardId) {
        console.warn('⚠️ ボードが選択されていないため検索できません');
        setSearchState(prev => ({
          ...prev,
          isActive: true,
          currentIndex: 0
        }));
        return;
      }

      // 🔧 修正：現在のボード内で検索
      const results = await NotesService.searchNotes(keyword, currentBoardId);
      console.log(`🔍 検索実行: "${keyword}" in ${currentBoardId} → ${results.length}件`);
      
      if (results.length === 0) {
        setSearchState(prev => ({
          ...prev,
          isActive: true,
          currentIndex: 0
        }));
        return;
      }

      // 結果を作成日時順にソート
      const sortedResults = results.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // 🔄 新方式: 付箋は元の位置のまま、その位置を記録
      const currentPositions = sortedResults.map(note => ({
        x: note.x,
        y: note.y
      }));

      setSearchState({
        results: sortedResults,
        isActive: true,
        currentIndex: 0,
        positions: currentPositions, // 実際の付箋位置を使用
        originalPositions: new Map(), // 移動しないので不要
        keyword
      });

      // 🔄 レイアウト変更なし、最初の検索結果にフォーカスのみ
      await focusOnSearchResult(0, currentPositions);

    } catch (error) {
      console.error('❌ 検索エラー:', error);
    }
  }, [canvasState, animateCanvasTo, screenSize, currentBoardId]);

  // 検索結果にフォーカス
  const focusOnSearchResult = useCallback(async (
    index: number, 
    positions: {x: number, y: number}[]
  ) => {
    if (index >= 0 && index < positions.length) {
      const targetPos = positions[index];
      const targetCanvasState = {
        scale: 1.2,
        x: -targetPos.x * 1.2 + screenSize.width / 2,
        y: -targetPos.y * 1.2 + screenSize.height / 2 - 200
      };
      await animateCanvasTo(targetCanvasState, 400);
    }
  }, [animateCanvasTo, screenSize]);

  // 検索クリア（簡略版）
  const handleClearSearch = useCallback(async () => {
    console.log('🔍 検索クリア開始');
    
    // 🔄 付箋移動なし、状態のみクリア
    setSearchState({
      results: [],
      isActive: false,
      currentIndex: 0,
      positions: [],
      originalPositions: new Map(),
      keyword: ''
    });

    // 🔄 キャンバス位置を検索開始前の位置に復帰
    if (savedCanvasState) {
      console.log('🎯 キャンバス位置を復帰:', savedCanvasState);
      await animateCanvasTo(savedCanvasState, 600);
      setSavedCanvasState(null);
    } else {
      console.log('⚠️ 保存された位置がないため、現在位置を維持');
    }

  }, [savedCanvasState, animateCanvasTo]);

  // 前の検索結果
  const handlePrevious = useCallback(() => {
    console.log('🔍 handlePrevious 呼び出し:', {
      currentIndex: searchState.currentIndex,
      canGoPrevious: searchState.currentIndex > 0,
      totalResults: searchState.results.length
    });
    
    if (searchState.currentIndex > 0) {
      const newIndex = searchState.currentIndex - 1;
      console.log('🔍 前の検索結果に移動:', { newIndex });
      
      setSearchState(prev => ({
        ...prev,
        currentIndex: newIndex
      }));
      
      focusOnSearchResult(newIndex, searchState.positions);
    } else {
      console.log('🔍 前の検索結果に移動不可（先頭）');
    }
  }, [searchState.currentIndex, searchState.positions, focusOnSearchResult]);
 
  // 次の検索結果
  const handleNext = useCallback(() => {
    console.log('🔍 handleNext 呼び出し:', {
      currentIndex: searchState.currentIndex,
      totalResults: searchState.results.length,
      canGoNext: searchState.currentIndex < searchState.results.length - 1
    });
    
    if (searchState.currentIndex < searchState.results.length - 1) {
      const newIndex = searchState.currentIndex + 1;
      console.log('🔍 次の検索結果に移動:', { newIndex });
      
      setSearchState(prev => ({
        ...prev,
        currentIndex: newIndex
      }));
      
      focusOnSearchResult(newIndex, searchState.positions);
    } else {
      console.log('🔍 次の検索結果に移動不可（末尾）');
    }
  }, [searchState.currentIndex, searchState.results.length, searchState.positions, focusOnSearchResult]);

  return {
    searchState,
    eventHandlers: {
      onSearch: handleSearch,
      onClearSearch: handleClearSearch,
      onPrevious: handlePrevious,
      onNext: handleNext
    }
  };
};