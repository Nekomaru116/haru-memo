// components/WhiteboardSelector.tsx - ボード選択画面（色変更機能付き）

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Plus, Palette, Trash, Edit3 } from 'lucide-react'; // 🔧 追加：Palette
import type { Whiteboard } from '../db/database';
import type { BoardSelectorMode } from '../types';
import { getBoardColorTheme, getAllAvailableColors } from '../utils/boardColors'; // 🔧 修正：getAllAvailableColors
import { sanitizeBoardName } from '../utils/sanitize';

interface WhiteboardSelectorProps {
  isVisible: boolean;
  whiteboards: Whiteboard[];
  currentBoardId: string | null;
  mode: BoardSelectorMode;
  maxDisplay?: number;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name?: string) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onRenameBoard: (boardId: string, newName: string) => Promise<void>;
  onChangeColor: (boardId: string, newColor: string) => Promise<void>; // 🔧 新規追加：色変更
  onSwitchMode: (mode: BoardSelectorMode) => void;
  onClose: () => void;
}

// 🎨 ボードカードコンポーネント
interface WhiteboardCardProps {
  board: Whiteboard;
  index: number;
  isSelected: boolean;
  isExtended: boolean;
  onClick: () => void;
  onLongPress: () => void;
  maxDisplay?: number;
}



const WhiteboardCard: React.FC<WhiteboardCardProps> = ({
  board,
  index,
  //isSelected,
  isExtended,
  onClick,
  onLongPress,
  //maxDisplay = 5,
  //isGlobalTouchBlocked = false

}) => {
  const longPressTimer = useRef<number | null>(null);
  //const [isLongPress, setIsLongPress] = useState(false);
  const isLongPressRef = useRef(false);
  //const [clickState, setClickState] = useState<'idle' | 'clicking' | 'longpress'>('idle');
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null); // 🔧 追加
  //const [isProcessing, setIsProcessing] = useState(false); // 🔧 追加
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseDownTimer = useRef<number | null>(null);
  
  



    // PC用マウス長押し処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // タッチデバイスでは処理しない
    if ('ontouchstart' in window) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ マウスダウン開始:', board.name);
    setIsMouseDown(true);
    
    // 600msで長押し判定（モバイルと同じ）
    mouseDownTimer.current = window.setTimeout(() => {
      console.log('🖱️ マウス長押し発動:', board.name);
      onLongPress();
    }, 600);
  }, [onLongPress, board.name]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
  if ('ontouchstart' in window) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  if (mouseDownTimer.current) {
    clearTimeout(mouseDownTimer.current);
    mouseDownTimer.current = null;
  }
  
  if (isMouseDown) {
    console.log('🖱️ マウスクリック実行:', board.name);
    onClick();
  }
  
  setIsMouseDown(false);
}, [onClick, isMouseDown, board.name]);

/*
  const handleMouseLeave = useCallback(() => {
    // マウスが要素から離れた場合はタイマーをクリア
    if (mouseDownTimer.current) {
      clearTimeout(mouseDownTimer.current);
      mouseDownTimer.current = null;
    }
    setIsMouseDown(false);
  }, []);
*/
// useEffect でクリーンアップ
useEffect(() => {
  return () => {
    if (mouseDownTimer.current) {
      clearTimeout(mouseDownTimer.current);
    }
  };
}, []);




  // 🎨 ボードの色を取得（固有色システム）
  const colors = getBoardColorTheme(board.color || 'gray'); // 🔧 修正：デフォルトをgrayに
  
  // 🎨 位置計算（プロトタイプ通り）
  const getCardStyle = () => {
    const baseOffset = 60; // 基本のオフセット
    const baseY = baseOffset -( index * 60 ); // 40, -20, -80, -140, -200
    const extendedY = baseY - 20;     // -20, -80, -140, -200, -260
    let zIndex = 105 - index;         // 通常時: 105, 104, 103, 102, 101
    if (isExtended) {
      zIndex = 110; // 🔧 選択時は最前面（他のカードより高い値）
    }
    
    const currentY = isExtended ? extendedY : baseY;
    const scale = isExtended ? 1.1 : 1.0;
    
    return {
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      width: `${getResponsiveCardSize().width}px`,
      height: `${getResponsiveCardSize().height}px`,
      transform: `translate(-50%, -50%) translateY(${currentY}px) scale(${scale})`,
      zIndex,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      userSelect: 'none' as const,

      filter: isExtended ? 'brightness(1.05)' : 'brightness(1)',
    };
  };

  // レスポンシブ対応
  const getResponsiveCardSize = useCallback(() => {
    const viewportWidth = window.innerWidth;

    if (viewportWidth <= 480 ) {
      return {width: Math.min(320, viewportWidth - 40), height: 220}; // スマホ
    } else if (viewportWidth <= 768) {
      return { width: Math.min(400, viewportWidth - 40), height: 280 }; // タブレット
    } else if (viewportWidth <= 1024) {
      return { width: 450, height: 320 }; // 小型PC
    } else {
      return { width: 500, height: 350 }; // PC
    }
  }, []);

  // レスポンシブスタイル
  const getResponsiveStyles = useCallback(() => {
    const { width } = getResponsiveCardSize();
    const isSmall = width <= 320;
    const isMedium = width <= 400;

    return {
      titleFontSize: isSmall ? '15px' : isMedium ? '15px' : '17px',
      padding: isSmall ? '12px 16px' : '16px 20px',
      contentPadding: isSmall ? '16px' : '20px',
      hintFontSize: isSmall ? '12px' : '12px'
    };
  }, [getResponsiveCardSize]);

  // カードの状態管理
   const [/*cardSize*/, setCardSize] = useState(getResponsiveCardSize());
   const [responsiveStyles, setResponsiveStyles] = useState(getResponsiveStyles());

  // リサイズ対応
  useEffect(() => {
    const handleSize = () => {
      setCardSize(getResponsiveCardSize());
      setResponsiveStyles(getResponsiveStyles());
    };
  window.addEventListener('resize', handleSize);
  }, [getResponsiveCardSize, getResponsiveStyles]);



  // タッチ・マウスイベント処理
  /*
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 🔧 追加：イベントの伝播を停止
    
    if (isProcessing) return; // 🔧 追加：処理中は無視
    
    setIsProcessing(true); // 🔧 追加：処理開始フラグ
    setIsLongPress(false);
    setTouchStartTime(Date.now()); // 🔧 追加：タッチ開始時刻を記録
    
    console.log('📱 タッチ開始:', board.name);
    
    // 長押し判定開始
    longPressTimer.current = window.setTimeout(() => {
      console.log('📱 長押し判定:', board.name);
      setIsLongPress(true);
      onLongPress();
      // 触覚フィードバック
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  }, [onLongPress, board.name, isProcessing]);

  // 🔧 修正後（タッチ終了の確実な処理）
  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    const touchDuration = touchStartTime ? Date.now() - touchStartTime : 0;
    console.log('📱 タッチ終了:', board.name, 'duration:', touchDuration, 'isLongPress:', isLongPress);
    
    // 🔧 修正：長押しでない && タッチ時間が十分短い場合のみクリック処理
    if (isLongPress) {
      console.log('📱 通常クリック実行:', board.name);
      // 少し遅延してクリック処理（モバイルの誤動作防止）
      setTimeout(() => {
        onClick();
      }, 50);
    }else if (touchDuration< 500 ) {
      console.log('📱 タッチクリック実行 - onClick呼び出し前:', board.name); // 🔧 追加
      console.log('📱 onClick関数:', typeof onClick, onClick); // 🔧 追加：onClick関数の確認
      onClick();
      console.log('📱 タッチクリック実行 - onClick呼び出し後:', board.name); // 🔧 追加
     }else {
      console.log('📱 クリック処理スキップ:', board.name, 'reason:', isLongPress ? '長押し' : '長時間タッチ');
    }
    
    // 🔧 状態リセット（遅延実行）
    setTimeout(() => {
      setIsLongPress(false);
      setTouchStartTime(null);
      setIsProcessing(false);
    }, 100);
  }, [onClick, isLongPress, touchStartTime, board.name]);

  const handlePointerLeave = useCallback(() => {
    console.log('📱 タッチ離脱:', board.name);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // 🔧 状態を完全にリセット
    setTimeout(() => {
      setIsLongPress(false);
      setTouchStartTime(null);
      setIsProcessing(false);
    }, 50);
  }, [board.name]);
  */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  console.log('📱 タッチ開始:', board.name);
  //setIsLongPress(false);
  isLongPressRef.current = false;
  setTouchStartTime(Date.now());
  
  longPressTimer.current = window.setTimeout(() => {
    console.log('📱 長押し発動:', board.name);
    //setIsLongPress(true);
    isLongPressRef.current = true; //refの値を更新
    onLongPress();
    if (navigator.vibrate) navigator.vibrate(50);
  }, 600);
}, [onLongPress, board.name]);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // 1. まずタイマーが作動中であれば、それをクリアします
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  const touchDuration = touchStartTime ? Date.now() - touchStartTime : 0;

  // 2. 【重要】「長押しフラグがfalse」かつ「タッチ時間が500ms未満」という
  //    両方の条件を満たす場合のみ、クリック処理を実行します。
  //    長押しが成功した場合、isLongPressRef.current は true なので、このブロックは実行されません。
  if (!isLongPressRef.current && touchDuration < 500) {
    onClick();
  }
  
  // 3. 最後に、次の操作のために状態をリセットします
  setTouchStartTime(null);

}, [onClick, touchStartTime]); // 依存配列も整理します
/*
const handleTouchEnd = useCallback((e: React.TouchEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
  
  const touchDuration = touchStartTime ? Date.now() - touchStartTime : 0;
  console.log('📱 タッチ終了:', board.name, 'duration:', touchDuration, 'longPress:', longPressTimer.current);
  
  if (/*isLongPress*//* longPressTimer.current) {
    console.log('📱 長押し終了 - onClick呼び出しなし:', board.name);
    longPressTimer.current = null;
    // 🗑️ 削除：グローバルタッチブロック条件
  } /* else if (touchDuration < 500) {
    console.log('📱 タッチクリック実行:', board.name);
    onClick();
  } else {
    console.log('📱 タッチクリックスキップ（時間超過）:', board.name, touchDuration);
  } */

  //setIsLongPress(false);
  /*
  if (!isLongPressRef.current && touchDuration < 500){
    onClick();
  }
  setTouchStartTime(null);
}, [onClick, /*isLongPress,*//* touchStartTime, board.name]); 
*/


  return (
    <div
  data-card-area
  className="card-container"
  style={{...getCardStyle(), touchAction: 'manipulation'}}
  onTouchStart={(e) => {
    e.stopPropagation(); // 🔧 追加：イベント伝播を停止
    handleTouchStart(e);
  }}
  onTouchEnd={(e) => {
    e.stopPropagation(); // 🔧 追加：イベント伝播を停止
    handleTouchEnd(e);
  }}
  
  onMouseDown={(e) => {
    e.stopPropagation(); // 🔧 追加：イベント伝播を停止
    handleMouseDown(e);
  }}
  onMouseUp={(e) => {
    e.stopPropagation(); // 🔧 追加：イベント伝播を停止
    handleMouseUp(e);
  }}
  /*
  onClick={(e) => {
    e.stopPropagation(); // 🔧 追加：クリックイベントの伝播を停止
    if(!('ontouchstart' in window)){
      onClick();
    }
  }}*/
>
      {/* カード背景 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 1)',
          borderRadius: '16px',
          boxShadow: isExtended 
            ? '0 20px 60px rgba(0, 0, 0, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          //border: isSelected ? `3px solid ${colors.bg}` : '0px solid rgba(0, 0, 0, 0)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* ヘッダー領域（70px） */}
        <div
          style={{
            height: '40px',
            padding: responsiveStyles.padding,
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`,
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3
            style={{
              textAlign: 'center',
              color: 'white',
              fontSize: responsiveStyles.titleFontSize,
              fontWeight: 'normal',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {sanitizeBoardName(board.name)}
          </h3>
          
        </div>

        {/* コンテンツ領域 */}
        <div
          style={{
            padding: responsiveStyles.contentPadding,
            height: 'calc(100% - 70px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* ボード情報 */}
          <div>
            <div
              style={{
                color: 'rgba(104, 104, 104, 0.9)',
                fontSize: '14px',
                marginBottom: '8px'
              }}
            >
              最終更新: {board.updatedAt.toLocaleDateString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            {/* TODO: 付箋・描画数の表示 */}
            <div
              style={{
                color: 'rgba(79, 79, 79, 0.8)',
                fontSize: '13px'
              }}
            >
              📝 付箋 • 🎨 描画
            </div>
          </div>

          {/* 操作ヒント */}
          <div
            style={{
              color: 'rgba(111, 111, 111, 1)',
              fontSize: responsiveStyles.hintFontSize,
              textAlign: 'center'
            }}
          >
            {isExtended ? (
              <>
              再度クリックで開く
              </>
            ) : (
              <>クリックで選択<br />or<br />長押しでメニュー</>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// 🗂️ メインセレクターコンポーネント
const WhiteboardSelector: React.FC<WhiteboardSelectorProps> = ({
  isVisible,
  whiteboards,
  currentBoardId,
  //mode,
  maxDisplay = 5,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  onChangeColor, // 🔧 新規追加
  onSwitchMode,
  onClose
}) => {
  // ローカル状態
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null); // 🔧 新規追加
  const [isCreating, setIsCreating] = useState(false);
  const [menuInteractionBlocked, /*setMenuInteractionBlocked*/] = useState(false); // メニュー操作ブロック
  const [isClickBlocked, setIsClickBlocked] = useState(false);

  //const originalSetShowContextMenu = setShowContextMenu;
/*
  const trackedSetShowContextMenu = useCallback((value: string | null) => {
  console.log('🔍 setShowContextMenu 呼び出し:', {
    新しい値: value,
    現在の値: showContextMenu,
    スタックトレース: new Error().stack
  });
  originalSetShowContextMenu(value);
}, [showContextMenu]);
*/
  // 🔧 新規追加：利用可能な色の取得
  const availableColors = getAllAvailableColors();

  // 表示用ボード（最新順、最大5件）
  const displayBoards = whiteboards.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, whiteboards.length - maxDisplay);

  // 🎮 2段階クリック処理
  const handleCardClick = useCallback((boardId: string) => {
    console.log('🎮 handleCardClick 呼び出し元スタック:', new Error().stack); // 🔧 追加
    // クリックがブロックされている場合は、何もせずに処理を終了
    if (isClickBlocked) {
      console.log('🚫 クリックがブロックされているため、処理を無視しました。');
      return;
    }

    console.log('🎮 handleCardClick 関数開始:', boardId); // 🔧 追加
    
    console.log('🎮 カードクリック詳細:', {
    clickedBoardId: boardId,
    currentSelectedBoardId: selectedBoardId,
    isSecondClick: selectedBoardId === boardId,
    menuBlocked: menuInteractionBlocked, // デバッグ用
    action: selectedBoardId === boardId ? 'ボードを開く' : '選択状態にする'
  });
  
    
    if (selectedBoardId === boardId) {
      // 2回目クリック → ボードを開く
      console.log('🎯 ボードを開く:', boardId);
      onSelectBoard(boardId);
    } else {
      // 1回目クリック → 拡張状態
      console.log('📋 ボード選択:', boardId);
      setSelectedBoardId(boardId);
      // 軽い触覚フィードバック
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [selectedBoardId, onSelectBoard, menuInteractionBlocked, isClickBlocked]);

  const createCardClickHandler = useCallback((boardId: string) => {
  return () => {
    console.log('📱 WhiteboardCard onClick 実行開始:', boardId);
    handleCardClick(boardId);
    console.log('📱 WhiteboardCard onClick 実行完了:', boardId);
  };
}, [handleCardClick]);

  // 🎮 長押しメニュー
  const handleCardLongPress = useCallback((boardId: string) => {
    console.log('🎮 長押し:', boardId);
    setShowContextMenu(boardId);
    console.log('🚫 グローバルタッチブロック開始');
    
    // 長押し直後の誤クリックを防ぐため、0.5秒間クリックをブロックする
    setIsClickBlocked(true);
    setTimeout(() => {
      setIsClickBlocked(false);
    }, 500); // 500ms = 0.5秒
  }, []);

useEffect(() => {
  // メニューが表示されていない場合は何もしない
  if (!showContextMenu) return;
  
  const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
    const target = e.target as Element;
    
    console.log('🔍 外部クリック検知:', {
      target: target.tagName,
      className: target.className,
      isMenuArea: !!target.closest('.context-menu-container'),
      menuVisible: showContextMenu
    });
    
    // メニュー内のクリックでない場合はメニューを閉じる
    if (!target.closest('.context-menu-container')) {
      console.log('✅ メニュー外クリック - メニューを閉じる');
      setShowContextMenu(null);
    } else {
      console.log('❌ メニュー内クリック - メニューを維持');
    }
  };
  
  // 🔧 重要：200ms遅延でリスナー追加
  console.log('🎬 メニュー表示検知 - 200ms後に監視開始予約');
  const timer = setTimeout(() => {
    console.log('🎧 200ms経過 - 外部クリック監視開始');
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('touchstart', handleOutsideClick, true);
  }, 200);
  
  // クリーンアップ
  return () => {
    console.log('🧹 外部クリックリスナー削除');
    clearTimeout(timer);
    document.removeEventListener('mousedown', handleOutsideClick, true);
    document.removeEventListener('touchstart', handleOutsideClick, true);
  };
}, [showContextMenu]); // showContextMenuの変化のみ監視

// ✅ 追加：ボード選択解除用の外部クリック検知
useEffect(() => {
  // selectedBoardId がない場合は何もしない
  if (!selectedBoardId) return;
  
  const handleBoardOutsideClick = (e: MouseEvent | TouchEvent) => {
    const target = e.target as Element;
    
    console.log('🔍 ボード外クリック検知:', {
      target: target.tagName,
      selectedBoard: selectedBoardId,
      isCardArea: !!target.closest('[data-card-area]'),
      isMenuArea: !!target.closest('.context-menu-container'),
      isColorPicker: !!target.closest('.color-picker-container')
    });
    
    // カード、メニュー、色選択パネル以外をクリックした場合
    const isRelevantArea = target.closest('[data-card-area]') || 
                          target.closest('.card-container') ||
                          target.closest('.context-menu-container') ||
                          target.closest('.color-picker-container');
    
    if (!isRelevantArea && !showContextMenu && !showColorPicker) {
      console.log('✅ ボード外クリック - 選択解除:', selectedBoardId);
      setSelectedBoardId(null);
    } else {
      console.log('❌ 関連エリア内クリック - 選択維持');
    }
  };
  
  // 即座にリスナー追加（遅延不要）
  console.log('🎧 ボード選択解除監視開始');
  document.addEventListener('mousedown', handleBoardOutsideClick, true);
  document.addEventListener('touchstart', handleBoardOutsideClick, true);
  
  return () => {
    console.log('🧹 ボード選択解除監視終了');
    document.removeEventListener('mousedown', handleBoardOutsideClick, true);
    document.removeEventListener('touchstart', handleBoardOutsideClick, true);
  };
}, [selectedBoardId, showContextMenu, showColorPicker]);

/*
  // 🎮 外部クリックでリセット
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (isGlobalTouchBlocked) {
    console.log('🚫 グローバルタッチブロック中のため背景クリック無効（handleBackgroundClick）');
    return;
  }
    console.log('🎮 背景クリック（グローバル監視に委譲）');
}, [selectedBoardId, isGlobalTouchBlocked]);
*/

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
        console.log('✅ 新規ボード作成完了');
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
      console.log('🔍 メニューを閉じる理由: handleContextAction - changeColor'); // 🔧 追加
      setShowContextMenu(null);
      return;
    }
    console.log('🔍 メニューを閉じる理由: handleContextAction - ' + action); // 🔧 追加
    setShowContextMenu(null);
    
    try {
      if (action === 'rename') {
        const board = whiteboards.find(b => b.id === boardId);
        if (board) {
          const newName = prompt('新しい名前を入力してください:', board.name);
          if (newName && newName.trim()) {
            await onRenameBoard(boardId, newName.trim());
            console.log('✅ ボード名変更完了');
          }
        }
      } else if (action === 'delete') {
        const board = whiteboards.find(b => b.id === boardId);
        if (board && confirm(`「${board.name}」を削除しますか？\n※関連する付箋・描画も全て削除されます。`)) {
          await onDeleteBoard(boardId);
          console.log('✅ ボード削除完了');
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
      console.log('✅ ボード色変更完了:', colorId);
    } catch (error) {
      console.error('❌ ボード色変更に失敗:', error);
      alert('色の変更に失敗しました');
    }
  }, [onChangeColor]);

  if (!isVisible) return null;

  // 🔧 削除：グリッドモードの処理を削除（App.tsxで直接処理）

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.83)',
          backdropFilter: 'blur(10px)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}
        //onClick={handleBackgroundClick}
        //onTouchEnd={handleBackgroundClick} // 🔧 追加：タッチイベントにも対応
      >
        {/* ヘッダー */}
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h1
            style={{
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.51)',
              backdropFilter: 'blur(10px)',
              padding: '8px 16px',
              borderRadius: '20px',
              alignSelf: 'center',
              color: 'rgba(70, 70, 70, 0.9)',
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0
            }}
          >
            ボード選択
          </h1>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(205, 205, 205, 1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'}
          >
            <X size={20} color="#333" />
          </button>
        </div>

        {/* メインエリア */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            marginTop: '80px',
            marginBottom: '100px'
          }}
        >
  {/* 🔧 追加：背景クリック用の透明エリア 削除*/}
  
  {/* ボードカード表示エリア */}
  <div
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      zIndex: 2, // 🔧 背景より上
    }}
  >
            {/* ボードカード群 */}
           {displayBoards.map((board, index) => {
              const cardClickHandler = createCardClickHandler(board.id!);
                      
              return (
                <WhiteboardCard
                  key={board.id}
                  board={board}
                  index={index}
                  isSelected={currentBoardId === board.id}
                  isExtended={selectedBoardId === board.id}
                  onClick={cardClickHandler} // 🔧 修正：安定した関数を渡す
                  onLongPress={() => handleCardLongPress(board.id!)}
                  maxDisplay={maxDisplay}
                />
              );
            })}

            {/* オーバーフロー表示 */}
            {hiddenCount > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '90%',
                  transform: 'translate(-50%, -50%)', // 下に配置
                  zIndex: 100,
                  background: 'rgba(195, 195, 195, 1)',
                  borderRadius: '50px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onSwitchMode('grid')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96, 96, 96, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(195, 195, 195, 1)'}
              >
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                  ＋ {hiddenCount} 件
                </span>
              </div>
            )}
          </div>
        </div>

        {/* フッター - 作成ボタン */}
        <div
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2001
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCreateBoard}
            disabled={isCreating}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: '50%',
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
              transition: 'all 0.3s ease',
              opacity: isCreating ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isCreating) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(34, 197, 94, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.4)';
            }}
          >
            <Plus size={28} color="white" />
          </button>
        </div>

        {/* コンテキストメニュー */}
{/* ✅ 大幅簡素化：背景オーバーレイを削除 */}
{showContextMenu && (
  <div
    className="context-menu-container"
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      borderRadius: '12px',
      padding: '8px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: 2002,
      width: '240px'
    }}
    // 🗑️ 削除：複雑なクリック処理は不要
  >
    <h3 style={{ 
      margin: '0px 16px',
      textAlign: 'left',
      fontSize: '16px',
      fontWeight: 'light',
      color: 'rgba(87, 87, 87, 0.8)',
    }}>
      メニュー
    </h3>
    <hr style={{ 
      borderWidth: '1px 0px 0px 0px',
      borderStyle: 'solid',
      borderColor: 'rgba(0,0,0,0.1)',
      margin: '8px 0' 
    }} />
    
    {/* ✅ 修正：シンプルなボタン（グローバルタッチブロック条件削除） */}
    <button
      onClick={() => {
        console.log('🔧 メニューボタンクリック: rename');
        handleContextAction('rename', showContextMenu);
      }}
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
      <Edit3 size={16} />
      名前を変更
    </button>
    
    <button
      onClick={() => {
        console.log('🔧 メニューボタンクリック: changeColor');
        handleContextAction('changeColor', showContextMenu);
      }}
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
    
    <hr style={{ 
      borderWidth: '1px 0px 0px 0px',
      borderStyle: 'solid',
      borderColor: 'rgba(0,0,0,0.1)',
      margin: '8px 0' 
    }} />
    
    <button
      onClick={() => {
        console.log('🔧 メニューボタンクリック: delete');
        handleContextAction('delete', showContextMenu);
      }}
      style={{
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        background: 'rgba(220, 38, 38, 0.1)',
        color: 'rgba(220, 38, 38, 0.9)',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'background 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
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
      <Trash size={16} />
      削除
    </button>
  </div>
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
    </>
  );
};

export default WhiteboardSelector;