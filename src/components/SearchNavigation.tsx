import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SearchNavigationProps {
  isVisible: boolean;
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

const SearchNavigation: React.FC<SearchNavigationProps> = ({
  isVisible,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
  onClose
}) => {
  console.log('SearchNavigation render:', { 
    isVisible, 
    currentIndex, 
    totalCount,
    renderCondition: isVisible && totalCount > 0 
  });
  
  if (!isVisible || totalCount === 0) {
    console.log('SearchNavigation: 非表示条件に該当', { isVisible, totalCount });
    return null;
  }

  console.log('SearchNavigation: レンダリング実行中');

  // 🔍 詳細なイベントハンドラー（デバッグ版）
  const handlePrevious = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🔍 前ボタン処理開始:', {
      eventType: e.type,
      currentIndex,
      canGoPrevious: currentIndex > 0
    });
    
    e.stopPropagation();
    e.preventDefault();
    
    if (currentIndex > 0) {
      console.log('🔍 前の付箋に移動実行');
      onPrevious();
    } else {
      console.log('🔍 前の付箋に移動不可（先頭）');
    }
  };

  const handleNext = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🔍 次ボタン処理開始:', {
      eventType: e.type,
      currentIndex,
      totalCount,
      canGoNext: currentIndex < totalCount - 1
    });
    
    e.stopPropagation();
    e.preventDefault();
    
    if (currentIndex < totalCount - 1) {
      console.log('🔍 次の付箋に移動実行');
      onNext();
    } else {
      console.log('🔍 次の付箋に移動不可（末尾）');
    }
  };

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('🔍 閉じるボタン処理開始:', {
      eventType: e.type
    });
    
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🔍 検索終了実行');
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent, buttonName: string) => {
    console.log(`🔍 ${buttonName}ボタン：タッチ開始`);
    e.stopPropagation();
  };

  return (
    <div 
      data-search-navigation // 🔧 追加：識別用のdata属性
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(15px)',
        borderRadius: '16px',
        padding: '16px 20px',
        color: 'white',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: '280px',
        // 🔍 タッチイベント伝播を完全に阻止
        touchAction: 'manipulation'
      }}
      onMouseDown={(e) => {
        console.log('🔍 SearchNavigation コンテナ：マウスダウン');
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        console.log('🔍 SearchNavigation コンテナ：タッチ開始');
        e.stopPropagation();
      }}
      onClick={(e) => {
        console.log('🔍 SearchNavigation コンテナ：クリック');
        e.stopPropagation();
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        {/* 前の付箋ボタン */}
        <button
          onClick={handlePrevious}
          onTouchStart={(e) => handleTouchStart(e, '前')}
          disabled={currentIndex === 0}
          style={{
            padding: '12px',
            backgroundColor: currentIndex === 0 ? '#666' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            touchAction: 'manipulation'
          }}
          title="前の付箋"
        >
          <ChevronLeft size={20} />
        </button>

        {/* 現在位置表示 */}
        <div 
          style={{
            textAlign: 'center',
            minWidth: '120px',
            padding: '0 16px'
          }}
        >
          <div 
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}
          >
            {currentIndex + 1} / {totalCount}
          </div>
          <div 
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginTop: '2px'
            }}
          >
            検索結果
          </div>
        </div>

        {/* 次の付箋ボタン */}
        <button
          onClick={handleNext}
          onTouchStart={(e) => handleTouchStart(e, '次')}
          disabled={currentIndex === totalCount - 1}
          style={{
            padding: '12px',
            backgroundColor: currentIndex === totalCount - 1 ? '#666' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: currentIndex === totalCount - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            touchAction: 'manipulation'
          }}
          title="次の付箋"
        >
          <ChevronRight size={20} />
        </button>

        {/* 検索終了ボタン */}
        <button
          onClick={handleClose}
          onTouchStart={(e) => handleTouchStart(e, '終了')}
          style={{
            marginLeft: '8px',
            padding: '10px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            touchAction: 'manipulation'
          }}
          title="検索を終了"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default SearchNavigation;