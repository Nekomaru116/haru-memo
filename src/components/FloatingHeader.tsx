import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Layers, Edit3, Trash2, Eraser, BookmarkX, RefreshCcw, Info, Bell } from 'lucide-react'; // ★SVGアイコンをインポート
import { sanitizeBoardName, /*sanitizeSearchQuery*/} from '../utils/sanitize'

interface FloatingHeaderProps {
  boardName: string;
  onSearch: (keyword: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  searchResultCount: number;
  currentSearchIndex: number;
  onBoardListToggle: () => void;
  onMenuAction: (action: 'rename' | 'showAbout' | 'resetPosition' | 'clearAllNotes' | 'clearAllLines' | 'delete' | 'showReleaseNotes') => void;
  hasUnreadReleaseNotes?: boolean;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  boardName,
  onSearch,
  onClearSearch,
  isSearchActive,
  searchResultCount: _searchResultCount, //未使用
  currentSearchIndex: _currentSearchIndex, //未使用
  onBoardListToggle,
  onMenuAction,
  hasUnreadReleaseNotes = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchField, setShowSearchField] = useState(false);
  const [isClosingSearch, setIsClosingSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [savedSearchKeyword, setSavedSearchKeyword] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 検索フィールド表示時に自動フォーカス
  useEffect(() => {
    if (showSearchField && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchField]);

  // 外部クリックでメニュー・検索を閉じる
  // FloatingHeader.tsx の useEffect部分をデバッグ版に変更

// 外部クリックでメニュー・検索を閉じる
useEffect(() => {
  const handleClickOutside = (e: MouseEvent | TouchEvent) => {
    // タッチイベントとマウスイベント両方に対応
    const target = (e.target as HTMLElement);
    
    console.log('🔍 クリック/タッチ検知:', {
      eventType: e.type,
      tagName: target.tagName,
      className: target.className,
      showSearchField,
      isClosingSearch
    });
    
    if (showMenu && !target.closest('.hamburger-menu')) {
      console.log('📱 ハンバーガーメニューを閉じます');
      setShowMenu(false);
    }
    
    if (showSearchField && !isClosingSearch) {
      const isSearchElement = target.closest('[data-search-area]');
      
      console.log('🔍 検索フィールド処理:', {
        eventType: e.type,
        showSearchField,
        isClosingSearch,
        isSearchElement: !!isSearchElement
      });
      
      if (!isSearchElement) {
        console.log('✅ 検索エリア外クリック/タッチ検知 - フィールドを閉じます');
        handleSearchClose();
      } else {
        console.log('❌ 検索エリア内クリック/タッチ - フィールドは開いたまま');
      }
    }
  };

  console.log('🔄 イベントリスナーを設定:', { showSearchField, isClosingSearch });
  
  // マウスイベントとタッチイベント両方に対応
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
  
  return () => {
    console.log('🗑️ イベントリスナーをクリーンアップ');
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };
}, [showMenu, showSearchField, isClosingSearch]);

  const handleSearchSubmit = () => {
    if (searchKeyword.trim()) {
      onSearch(searchKeyword.trim());
    }
  };

  const handleSearchOpen = () => {
    setIsClosingSearch(false);
    setShowSearchField(true);
    if (savedSearchKeyword) {
      setSearchKeyword(savedSearchKeyword);
    }
  };

  const handleSearchClose = () => {
  console.log('🔍 handleSearchClose 開始:', {
    searchKeyword: searchKeyword.trim(),
    showSearchField,
    isClosingSearch
  });
  
  if (searchKeyword.trim()) {
    setSavedSearchKeyword(searchKeyword);
    console.log('💾 検索文字列を保存:', searchKeyword);
  }
  
  console.log('🧹 検索をクリア');
  onClearSearch();

  console.log('🎬 閉じるアニメーション開始');
  setIsClosingSearch(true);
  
  setTimeout(() => {
    console.log('✅ アニメーション完了 - 状態リセット');
    setShowSearchField(false);
    setIsClosingSearch(false);
    setSearchKeyword('');
  }, 300);
};

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleMenuClick = (action: 'rename' | 'showAbout' | 'resetPosition' | 'clearAllNotes' | 'clearAllLines' |'delete' | 'showReleaseNotes') => {
    onMenuAction(action);
    setShowMenu(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        right: '16px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(57, 57, 57, 0.15)',
        borderRadius: '30px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        overflow: 'visible',
      }}
    >
      {/* 左側 - ハンバーガーメニュー */}
      <div style={{ 
        position: 'relative',
        width: '48px',
        flexShrink: 0,
      }} className="hamburger-menu">
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            boxShadow: showMenu
            ? '0 0px 0px rgba(0, 0, 0, 0.09)'
            : '0 8px 16px rgba(0, 0, 0, 0.09)',
            background: showMenu 
              ? 'rgba(100, 100, 100, 0.26)' 
              : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(5px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {/* ★SVGアイコンに変更 */}
          <Menu size={20} color={showMenu ? '#FFF' : '#333'} />
         
          {/* ハンバーガーメニューの赤点 */}
          {hasUnreadReleaseNotes && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                border: '1px solid white'
              }}
            />
          )}
        </button>
          
        {/* ハンバーガーメニュードロップダウン */}
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              left: '0',
              minWidth: '200px',
              background: 'rgb(255, 255, 255)',
              //backdropFilter: 'blur(15px)',
              //border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              padding: '8px',
              zIndex: 1000,
            }}
          >
            <button
              onClick={() => handleMenuClick('rename')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: '#333',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 0.37)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Edit3 size={16} />
              ボード名の変更
            </button>
            <button
              onClick={() => handleMenuClick('showReleaseNotes')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: '#333',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 0.37)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={16} />
              お知らせ

            {/* お知らせボタンの赤点 */}
              {hasUnreadReleaseNotes && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    marginLeft: 'auto'
                  }}
                />
              )}

            </button>
            <button
                onClick={() => handleMenuClick('showAbout')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#333',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 0.37)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Info size={16} />
                このアプリについて
            </button>
            <p>
              <hr 
              style={{ 
                borderWidth: '1px 0px 0px 0px',
                borderStyle: 'solid',
                borderColor: 'rgba(0,0,0,0.1)',
                margin: '8px 0' }} />
            </p>
            <button
              onClick={() => handleMenuClick('resetPosition')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: '#333',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 0.37)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <RefreshCcw size={16} />
              位置・拡大リセット
            </button>
            <button
              onClick={() => handleMenuClick('clearAllNotes')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <BookmarkX size={16} />
              全ての付箋を削除
            </button>
            <button
              onClick={() => handleMenuClick('clearAllLines')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Eraser size={16} />
              全ての描画を削除
            </button>
            <button
              onClick={() => handleMenuClick('delete')}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'rgba(220, 38, 38, 0.1)',
                color: 'rgba(220, 38, 38, 0.9)',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.76)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'
                e.currentTarget.style.color = 'rgba(220, 38, 38, 0.9)';
              }}
            >
              <Trash2 size={16} />
              ボードの削除
            </button>
          </div>
        )}
      </div>

      {/* 中央 - ホワイトボード名 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
        margin: '0 12px',
      }}>
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
              maxWidth: '100%',
            }}
          >
            {sanitizeBoardName(boardName)}
          </div>
        )}
      </div>

      {/* 右側 - 検索とボード一覧 */}
      <div 
        data-search-area
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flex: showSearchField ? 1 : 'none'
        }}
      >
        {/* 検索フィールド */}
        {showSearchField && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(131, 131, 131, 0.2)',
              borderRadius: '24px',
              padding: '8px 16px',
              flex: 1,
              minWidth: '0',
              animation: isClosingSearch 
                ? 'slideOutToRight 0.3s ease-in forwards'
                : 'slideInFromRight 0.3s ease-out',
              transformOrigin: 'right center',
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="付箋を検索..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                color: '#333',
                minWidth: '0',
              }}
            />
          </div>
        )}

        {/* 検索ボタン */}
        <button
          onClick={showSearchField ? handleSearchSubmit : handleSearchOpen}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            boxShadow: isSearchActive || showSearchField
            ? '0 0px 0px rgba(0, 0, 0, 0.09)'
            : '0 8px 16px rgba(0, 0, 0, 0.09)',
            background: isSearchActive || showSearchField
              ? 'rgba(75, 140, 245, 0.43)' 
              : 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(5px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            position: showSearchField ? 'absolute' : 'relative',
            right: showSearchField ? '12px' : 'auto',
            zIndex: 1001,
          }}
        >
          {/* ★SVGアイコンに変更 */}
          <Search size={20} color="#333" />
        </button>

        {/* ボード一覧ボタン */}
        {!showSearchField && (
          <button
            onClick={onBoardListToggle}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.09)',
              backdropFilter: 'blur(5px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 0.37)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            {/* ★SVGアイコンに変更 */}
            <Layers size={20} color="#333" />
          </button>
        )}
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
  );
};

export default FloatingHeader;