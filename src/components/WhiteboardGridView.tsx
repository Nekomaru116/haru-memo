// components/WhiteboardGridView.tsx - グリッド表示コンポーネント（色変更機能付き）

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Grid, MoreHorizontal, Palette, Plus, Clock, Calendar, Type, X } from 'lucide-react'; // 🔧 修正：List削除
import type { Whiteboard } from '../db/database';
import { getBoardColorTheme, getAllAvailableColors } from '../utils/boardColors'; // 🔧 修正：getAllAvailableColors追加
import { sanitizeBoardName } from '../utils/sanitize';

interface WhiteboardGridViewProps {
  whiteboards: Whiteboard[];
  currentBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name?: string) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onRenameBoard: (boardId: string, newName: string) => Promise<void>;
  onChangeColor: (boardId: string, newColor: string) => Promise<void>; // 🔧 新規追加：色変更
  onBackToStack: () => void;
}

// 🎨 グリッドアイテムコンポーネント
interface GridItemProps {
  board: Whiteboard;
  isSelected: boolean;
  notesCount?: number;
  linesCount?: number;
  onSelect: () => void;
  onContextMenu: () => void;
}

const GridItem: React.FC<GridItemProps> = ({
  board,
  isSelected,
  notesCount = 0,
  linesCount = 0,
  onSelect,
  onContextMenu
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 🎨 ボードの代表色を取得（固有色システム）
  const colors = getBoardColorTheme(board.color || 'gray'); // 🔧 修正：デフォルトをgrayに
  
  // 最終更新時刻の相対表示
  const getRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit'
    });
  }, []);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: isSelected ? '3px solid #2196F3' : '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ヘッダー部分 */}
      <div
        style={{
          height: '80px',
          background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        <h3
          style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            paddingRight: '12px'
          }}
        >
          {sanitizeBoardName(board.name)}
        </h3>
        
        {/* メニューボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          <MoreHorizontal size={16} color="white" />
        </button>

      </div>

      {/* コンテンツ部分 */}
      <div
        style={{
          padding: '16px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        {/* 統計情報 */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#666',
              fontSize: '14px'
            }}
          >
            <span>📝</span>
            <span>{notesCount}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#666',
              fontSize: '14px'
            }}
          >
            <span>🎨</span>
            <span>{linesCount}</span>
          </div>
        </div>

        {/* プレビューエリア（将来の拡張用） */}
        <div
          style={{
            flex: 1,
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60px',
            marginBottom: '12px'
          }}
        >
          <span style={{ color: '#999', fontSize: '12px' }}>
            プレビュー
          </span>
        </div>

        {/* 最終更新時刻 */}
        <div
          style={{
            color: '#999',
            fontSize: '12px',
            textAlign: 'right'
          }}
        >
          {getRelativeTime(board.updatedAt)}
        </div>
      </div>
    </div>
  );
};

// 🗂️ メイングリッドビューコンポーネント
const WhiteboardGridView: React.FC<WhiteboardGridViewProps> = ({
  whiteboards,
  currentBoardId,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  onChangeColor, // 🔧 新規追加
  onBackToStack
}) => {
  // ローカル状態
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 🔧 新規追加
  const [isCreating, setIsCreating] = useState(false);
  // 検索UIの状態管理
  const [showSearchField, setShowSearchField] = useState(false);
  const [isClosingSearch, setIsClosingSearch] = useState(false);
  const [savedSearchKeyword, setSavedSearchKeyword] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 🔧 新規追加：利用可能な色の取得
  const availableColors = getAllAvailableColors();
 
  // 🔧 新規追加：検索フィールド表示時に自動フォーカス
  useEffect(() => {
    if (showSearchField && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchField]);

  // 🔧 新規追加：外部クリックで検索を閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = (e.target as HTMLElement);
      
      if (showSearchField && !isClosingSearch) {
        const isSearchElement = target.closest('[data-search-area]');
        if (!isSearchElement) {
          handleSearchClose();
        }
      }

      if (showSortMenu && !target.closest('[data-sort-menu]')) {
        setShowSortMenu(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSearchField, isClosingSearch, showSortMenu]);


    // 🔧 新規追加：ソートアイコン取得
  const getSortIcon = useCallback(() => {
    switch (sortBy) {
      case 'updated': return <Clock size={20} />;
      case 'created': return <Calendar size={20} />;
      case 'name': return <Type size={20} />;
      default: return <Clock size={20} />;
    }
  }, [sortBy]);

  // 🔧 新規追加：次のソート順に切り替え
  const handleSortToggle = useCallback(() => {
    setShowSortMenu(!showSortMenu);
  }, [showSortMenu]);

  // ソート選択処理
  const handleSortSelect = useCallback((sortType: 'updated' | 'created' | 'name') => {
    setSortBy(sortType);
    setShowSortMenu(false);
  }, []);

  //ソート名称取得
  const getSortName = useCallback((sortType: 'updated' | 'created' | 'name') => {
    switch (sortType) {
      case 'updated': return '更新日時順';
      case 'created': return '作成日時順';
      case 'name': return '名前順';
      default: return '更新日時順';
    }
  }, []);

  // 🔍 フィルタリング・ソート済みボード
  const filteredAndSortedBoards = useMemo(() => {
    let filtered = whiteboards;
    
    // 検索フィルタ
    if (searchQuery.trim()) { // 空でない場合のみフィルタリング
      filtered = filtered.filter(board => 
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) // 名前検索
      );
    }
    
    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'name':
          return a.name.localeCompare(b.name, 'ja');
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [whiteboards, searchQuery, sortBy]);

  const handleSearchOpen = useCallback(() => {
    setIsClosingSearch(false);
    setShowSearchField(true);
    if (savedSearchKeyword) {
      setSearchQuery(savedSearchKeyword);
    }
  }, [savedSearchKeyword]);

const handleSearchClose = useCallback(() => {
    if (searchQuery.trim()) {
      setSavedSearchKeyword(searchQuery);
    }
    
    setIsClosingSearch(true);
    
    setTimeout(() => {
      setShowSearchField(false);
      setIsClosingSearch(false);
      setSearchQuery('');
    }, 300);
  }, [searchQuery]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClose();
    }
  }, [handleSearchClose]);

  // レスポンシブなグリッド列数
  const getGridColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 768) return 3;
    if (width >= 480) return 2;
    return 1;
  }, []);

  // 🎮 ボード選択
  const handleSelectBoard = useCallback((boardId: string) => {
    console.log('🎯 グリッドからボード選択:', boardId);
    onSelectBoard(boardId);
  }, [onSelectBoard]);

  // 🎮 新規ボード作成
  const handleCreateBoard = useCallback(async () => {
    setIsCreating(true);
    try {
      const defaultName = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '/');
      
      const name = prompt('新しいホワイトボードの名前を入力してください:', defaultName);
      if (name && name.trim()) {
        await onCreateBoard(name.trim());
        console.log('✅ グリッドから新規ボード作成完了');
      }
    } catch (error) {
      console.error('❌ ボード作成に失敗:', error);
      alert('ボードの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  }, [onCreateBoard]);

  // 🎮 コンテキストメニューアクション
  const handleContextAction = useCallback(async (action: 'rename' | 'changeColor' | 'delete', boardId: string) => {
    if (action === 'changeColor') {
      // 🔧 新規追加：色選択画面を表示
      setShowColorPicker(boardId);
      setShowContextMenu(null);
      return;
    }

    setShowContextMenu(null);
    
    try {
      if (action === 'rename') {
        const board = whiteboards.find(b => b.id === boardId);
        if (board) {
          const newName = prompt('新しい名前を入力してください:', board.name);
          if (newName && newName.trim()) {
            await onRenameBoard(boardId, newName.trim());
            console.log('✅ グリッドからボード名変更完了');
          }
        }
      } else if (action === 'delete') {
        const board = whiteboards.find(b => b.id === boardId);
        if (board && confirm(`「${board.name}」を削除しますか？\n※関連する付箋・描画も全て削除されます。`)) {
          await onDeleteBoard(boardId);
          console.log('✅ グリッドからボード削除完了');
        }
      }
    } catch (error) {
      console.error('❌ 操作に失敗:', error);
      alert('操作に失敗しました');
    }
  }, [whiteboards, onRenameBoard, onDeleteBoard]);

  // 🔧 新規追加：色変更処理
  const handleColorChange = useCallback(async (boardId: string, colorId: string) => {
    try {
      await onChangeColor(boardId, colorId);
      setShowColorPicker(null);
      console.log('✅ グリッドからボード色変更完了:', colorId);
    } catch (error) {
      console.error('❌ ボード色変更に失敗:', error);
      alert('色の変更に失敗しました');
    }
  }, [onChangeColor]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f8f9fa',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* 戻るボタン */}
        <button
          onClick={onBackToStack}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: '50px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>

        {/* タイトル */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 0,
            margin: '0 12px'
          }}
        >
          {!showSearchField && (
            <div
              style={{
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '600',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              全てのボード （{filteredAndSortedBoards.length}件）
            </div>
          )}
        </div>

        {/* 右側コントロール群 */}
                <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}
        >
          {/* 新規作成ボタン */}
          <button
            onClick={handleCreateBoard}
            disabled={isCreating}
            style={{
              width: '48px',
              height: '48px',
              background: 'rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              border: 'none',
              borderRadius: '50%',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isCreating ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.09)',
              backdropFilter: 'blur(5px)'
            }}
            onMouseEnter={(e) => {
              if (!isCreating) e.currentTarget.style.background = 'rgba(34, 197, 94, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* 検索フィールドのアニメーション */}
        <style>{`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(50px) scaleX(0.8);
              width: 0;
            }
            to {
              opacity: 1;
              transform: translateX(0) scaleX(1);
              width: 100%;
            }
          }
          
          @keyframes slideOutToRight {
            from {
              opacity: 1;
              transform: translateX(0) scaleX(1);
              width: 100%;
            }
            to {
              opacity: 0;
              transform: translateX(50px) scaleX(0.8);
              width: 0;
            }
          }
        `}</style>
      </div>

      {/* 🔧 新規追加：検索・ソートコントロール */}
      <div
        data-search-area
        style={{
          position: 'fixed',
          top: '92px', // ヘッダー直下
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          flex: showSearchField ? 1 : 'none'
        }}
      >
        {/* 検索フィールド */}
        {showSearchField && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(131, 131, 131, 0.2)',
              borderRadius: '24px',
              padding: '8px 16px',
              minWidth: '200px',
              animation: isClosingSearch 
                ? 'slideOutToRight 0.3s ease-in forwards'
                : 'slideInFromRight 0.3s ease-out',
              transformOrigin: 'right center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ボードを検索..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: '#333',
                minWidth: '0'
              }}
            />
          </div>
        )}

        {/* 検索ボタン */}
        <button
          onClick={showSearchField ? handleSearchClose : handleSearchOpen}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            boxShadow: (searchQuery.trim() || showSearchField)
              ? '0 0px 0px rgba(0, 0, 0, 0.22)'
              : '0 8px 16px rgba(0, 0, 0, 0.22)',
            background: (searchQuery.trim() || showSearchField)
              ? 'rgba(230, 230, 230, 0.6)' 
              : 'rgba(230, 230, 230, 0.6)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          {(searchQuery.trim() || showSearchField)
            ? <X size={20} color="#333" />
            : <Search size={20} color="#333" />
          }
        </button>

                {/* ソートボタン - 修正 */}
        <div style={{ position: 'relative' }} data-sort-menu>
          <button
            onClick={handleSortToggle}
            title={`現在: ${getSortName(sortBy)}`}
            style={{
              width: '48px',
              height: '48px',
              background: showSortMenu ? 'rgba(230, 230, 230, 0.43)' : 'rgba(230, 230, 230, 0.57)',
              boxShadow: showSortMenu 
                ? '0 0px 0px rgba(0, 0, 0, 0.09)' 
                : '0 8px 16px rgba(0, 0, 0, 0.09)',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            {getSortIcon()}
          </button>

          {/* ソートメニュー */}
          {showSortMenu && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: '0',
                width: '200px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                zIndex: 1002
              }}
            >
              <div style={{ 
                margin: '8px 16px 8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666'
              }}>
                並び順
              </div>
              <p>
                <hr 
                style={{ 
                  borderWidth: '1px 0px 0px 0px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(0,0,0,0.1)',
                  margin: '8px 0' }} />
              </p>
              <button
                onClick={() => handleSortSelect('updated')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: sortBy === 'updated' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: sortBy === 'updated' ? '#2563eb' : '#333'
                }}
              >
                <span><Clock size={20} /></span>
                <span>更新日時順</span>
                {sortBy === 'updated' && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
              
              <button
                onClick={() => handleSortSelect('created')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: sortBy === 'created' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: sortBy === 'created' ? '#2563eb' : '#333'
                }}
              >
                <span><Calendar size={20} /></span>
                <span>作成日時順</span>
                {sortBy === 'created' && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
              
              <button
                onClick={() => handleSortSelect('name')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: sortBy === 'name' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: sortBy === 'name' ? '#2563eb' : '#333'
                }}
              >
                <span><Type size={20} /></span>
                <span>名前順</span>
                {sortBy === 'name' && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto',
          //marginTop: '45px',
        }}
      >
        {filteredAndSortedBoards.length === 0 ? (
          // 空状態
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999'
            }}
          >
            <Grid size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              {searchQuery ? '検索結果がありません' : 'ボードがありません'}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchQuery ? '別のキーワードで検索してみてください' : '新しいボードを作成してみましょう'}
            </p>
          </div>
        ) : (
          // グリッド表示
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
              gap: '24px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}
          >
            {filteredAndSortedBoards.map((board) => (
              <GridItem
                key={board.id}
                board={board}
                isSelected={currentBoardId === board.id}
                notesCount={0} // TODO: 実際の付箋数を取得
                linesCount={0} // TODO: 実際の描画線数を取得
                onSelect={() => handleSelectBoard(board.id!)}
                onContextMenu={() => setShowContextMenu(board.id!)}
              />
            ))}
          </div>
        )}
      </div>

      {/* コンテキストメニュー */}
      {showContextMenu && !showColorPicker && (
        <>
          {/* 背景オーバーレイ */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              zIndex: 2001
            }}
            onClick={() => setShowContextMenu(null)}
          />
          
          {/* メニュー */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              zIndex: 2002,
              minWidth: '160px'
            }}
          >
            <button
              onClick={() => handleContextAction('rename', showContextMenu)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              📝 名前を変更
            </button>
            {/* 🔧 新規追加：色変更ボタン */}
            <button
              onClick={() => handleContextAction('changeColor', showContextMenu)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Palette size={16} />
              色を変更
            </button>
            <button
              onClick={() => handleContextAction('delete', showContextMenu)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#dc2626',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🗑️削除
            </button>
          </div>
        </>
      )}

      {/* 🔧 新規追加：色選択パネル */}
      {showColorPicker && (
                <div
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255, 255, 255, 0.52)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1.5px solid rgba(255, 255, 255, 0.64)',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    zIndex: 2003,
                    minWidth: '280px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ 
                    marginBottom: '16px', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Palette size={20} />
                    ボード色を選択
                  </div>
                  
                  {/* 色グリッド */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '12px',
                      marginBottom: '20px'
                    }}
                  >
                    {availableColors.map((color) => {
                      const currentBoard = whiteboards.find(b => b.id === showColorPicker);
                      const isSelected = currentBoard?.color === color.id;
                      
                      return (
                        <button
                          key={color.id}
                          onClick={() => handleColorChange(showColorPicker, color.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 8px',
                            border: isSelected ? `0px solid ${color.border}` : '0px solid #e5e7eb',
                            borderRadius: '12px',
                            background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          /*
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(243, 244, 246, 0.5)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                            */
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: color.bg,
                              border: `3px solid ${color.border}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              color: 'white',
                              fontWeight: 'bold',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {isSelected && '✓'}
                          </div>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            fontWeight: isSelected ? 'bold' : 'normal'
                          }}>
                            {/*{color.name} 色名は省略*/} 
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* キャンセルボタン */}
                  <button
                    onClick={() => setShowColorPicker(null)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #a3a3a3ff',
                      borderRadius: '30px',
                      background: 'transparent',
                      color: 'rgba(85, 90, 101, 0.9)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    キャンセル
                  </button>
                </div>
              )}
    </div>
  );
};

export default WhiteboardGridView;