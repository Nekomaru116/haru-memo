// App.tsx (マルチボード対応版) - メインアプリケーションコンポーネント

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import {db} from './db/database.ts'


// Components (統合後のコンポーネントを使用)
import FloatingHeader from './components/FloatingHeader';
import FloatingFooter from './components/FloatingFooter';
import StickyNote from './components/StickyNote'; // 統合版を使用
import SearchNavigation from './components/SearchNavigation';
import NoteEditorOverlay from './components/NoteEditorOverlay';
import AboutDialog from './components/AboutDialog';
import WhiteboardSelector from './components/WhiteboardSelector'; // 🔧 新規追加
import WelcomeDialog from './components/WelcomeDialog.tsx';
import PWAInstallDialog from './components/PWAInstallDialog.tsx';
import TermsDialog from './components/TermsDialog.tsx';
// Custom Hooks
import { useCanvasOperations } from './hooks/useCanvasOperations';
import { useNotesManager } from './hooks/useNotesManager';
import { useDrawingEngine } from './hooks/useDrawingEngine';
import { useSearchManager } from './hooks/useSearchManager';
import { useWhiteboardManager } from './hooks/useWhiteboardManager'; // 🔧 新規追加
import { useUnifiedTouchManager } from './hooks/useUnifiedTouchManager';

// Types
import type { AppMode } from './types';
//import { NotesService } from './db/database';
import WhiteboardGridView from './components/WhiteboardGridView.tsx';
import LicenseNotices from './components/LicenseNotices.tsx';

function App() {
  // アプリケーション状態
  const [appMode, setAppMode] = useState<AppMode>('note');
  const [showBoardSelector, setShowBoardSelector] = useState(false); // 🔧 新規追加
  const [boardSelectorMode, setBoardSelectorMode] = useState<'stack' | 'grid'>('stack'); // 🔧 新規追加
  
  // デバッグモードと「このアプリについて」ダイアログの状態
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPWADialog, setShowPWADialog] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [onShowTermsDialog, setShowTermsDialog] = useState(false);

  // ウェルカムダイアログの状態管理
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(() => {
  // 🔧 修正：welcome_completed フラグがない場合は必ず表示
  const completed = localStorage.getItem('welcome_completed');
  console.log('🔍 ウェルカムダイアログ表示判定:', { completed, shouldShow: !completed });
  return !completed;
});

  // Refs
  const stageRef = useRef<any>(null);

  // 🔧 新規追加：ホワイトボード管理フック
  const whiteboardManager = useWhiteboardManager();

  // カスタムフック群（マルチボード対応）
  const canvasOps = useCanvasOperations(appMode, null, false);
  
  const notesManager = useNotesManager(
    canvasOps.canvasState,
    canvasOps.screenSize,
    canvasOps.animationFunctions.animateCanvasTo,
    whiteboardManager.currentBoardId, // 🔧 修正：currentBoardIdを追加
    (reason: string) => saveCurrentBoardState(reason) // 🔧 新規追加：付箋操作時の保存
  );

  const drawingEngine = useDrawingEngine(
    appMode,
    canvasOps.canvasState,
    notesManager.editingNote,
    false, // searchManager.searchState.isActive - 後で調整
    whiteboardManager.currentBoardId // 🔧 修正：currentBoardIdを追加
  );

  const searchManager = useSearchManager(
    canvasOps.canvasState,
    canvasOps.screenSize,
    canvasOps.animationFunctions.animateCanvasTo,
    notesManager.animateNotesTo,
    whiteboardManager.currentBoardId // 🔧 修正：currentBoardIdを追加
  );

  const unifiedTouch = useUnifiedTouchManager({
    appMode,
    editingNote: notesManager.editingNote,
    isSearchActive: searchManager.searchState.isActive,
    canvasState: canvasOps.canvasState,
    onCanvasStateChange: canvasOps.updateCanvasState,
    drawingHandlers: drawingEngine.drawingEventHandlers,
    onCanvasStateChangeEnd: (reason: string) => saveCurrentBoardState(reason), // 🔧 新規追加：変更完了時の保存
  });

  // ウェルカムダイアログのハンドラー
const handleWelcomeAccept = useCallback(() => {
  localStorage.setItem('welcome_completed', 'true');
  localStorage.setItem('should_create_tutorial', 'true');
  setShowWelcomeDialog(false);

    setTimeout(() => {
    const isPWAInstalled = window.matchMedia('(sisplay-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (!isPWAInstalled && !localStorage.getItem('pwa_dialog_dismissed')){
      setShowPWADialog(true);
    }
  }, 500);

},[setShowWelcomeDialog])

// PWAダイアログ用ハンドラー
const handlePWADialogClose = useCallback(() => {
  setShowPWADialog(false);
  localStorage.setItem('pwa_dialog_dismissed', 'true');
}, []);

const handlePWADialogSkip = useCallback(() => {
  setShowPWADialog(false);
  localStorage.setItem('pwa_dialog_dismissed', 'true');
}, []);

const handleShowTerms = useCallback(() =>{
  setShowTermsDialog(true);
}, []);


//エレガントリロード
// 🔧 修正：エレガントな初期化完了監視
useEffect(() => {
  if (!whiteboardManager.isLoading && 
      whiteboardManager.currentBoardId && 
      !showWelcomeDialog) {
    
    const shouldCreateTutorial = localStorage.getItem('should_create_tutorial') === 'true';
    console.log('🔍 チュートリアル作成チェック:', {
      isLoading: whiteboardManager.isLoading,
      currentBoardId: whiteboardManager.currentBoardId,
      showWelcomeDialog,
      shouldCreateTutorial
    });
    
    if (shouldCreateTutorial) {
      console.log('🎯 チュートリアル作成フラグ検出 - データリフレッシュ開始');
      localStorage.removeItem('should_create_tutorial');
      
      // データリフレッシュをトリガー
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tutorial-data-refresh', {
          detail: { boardId: whiteboardManager.currentBoardId }
        }));
      }, 100);
    }
  }
}, [whiteboardManager.isLoading, whiteboardManager.currentBoardId, showWelcomeDialog]);

  const handleWelcomeDecline = useCallback(() => {
    if (confirm("アプリを終了しますか？")) {
      window.close(); //PWAの場合
    }
  },[])

  // localStorageを削除してリロード（デバッグ用）
  const resetWelcomeDialog = useCallback(() => {
    if (confirm("⚠️⚠️初期化しますか？⚠️⚠️付箋・描いた線・ボードはすべて【永久】に消滅します。復元はできません！！")){
      localStorage.clear();
      localStorage.clear();
      db.delete().then(() => {
        window.location.reload()
      })
      
      alert('初回起動の状態に戻しました。ページをリロードします');
      window.location.reload();
    }
  }, []);

  // 🔧 新規追加：ボード切り替え処理
  const handleBoardSwitch = useCallback(async (boardId: string) => {
    try {
      console.log('🔄 ボード切り替え開始:', boardId);
      
      // ボード切り替え実行
      await whiteboardManager.switchToBoard(boardId);
      
      // キャンバス状態を復元
      const board = whiteboardManager.getBoardById(boardId);
      if (board?.canvasState) {
        console.log('🎯 キャンバス状態復元:', board.canvasState);
        canvasOps.updateCanvasState(board.canvasState);
      }
      
      // ボード選択画面を閉じる
      setShowBoardSelector(false);
      
      console.log('✅ ボード切り替え完了:', boardId, board?.name);
      
    } catch (error) {
      console.error('❌ ボード切り替えに失敗:', error);
      alert('ボードの切り替えに失敗しました');
    }
  }, [whiteboardManager, canvasOps]);

  // 🔧 修正：キャンバス状態の保存（変更時のみ）
  const saveCurrentBoardState = useCallback(async (reason?: string) => {
    if (whiteboardManager.currentBoardId) {
      try {
        await whiteboardManager.updateBoard(whiteboardManager.currentBoardId, {
          canvasState: canvasOps.canvasState
        });
        if (reason && import.meta.env.DEV) {
          console.log(`💾 キャンバス状態保存: ${reason}`);
        }
      } catch (error) {
        console.error('❌ キャンバス状態の保存に失敗:', error);
      }
    }
  }, [whiteboardManager, canvasOps.canvasState]);

  // 🔧 削除：常時監視のuseEffectを削除
  // React.useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     saveCurrentBoardState();
  //   }, 3000);
  //   return () => clearTimeout(timeoutId);
  // }, [canvasOps.canvasState, saveCurrentBoardState]);

  // ユーティリティ関数
  const clearAllData = useCallback(async () => {
    if (confirm('現在のボードのすべての付箋と描画を削除しますか？')) {
      try {
        await Promise.all([
          notesManager.clearAllNotes(),
          drawingEngine.clearAllLines()
        ]);
        alert('現在のボードのすべてのデータを削除しました');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました');
      }
    }
  }, [notesManager, drawingEngine]);

  // キャンバス状態リセット（デバッグ用）
  /*
  const resetCanvasState = useCallback(async () => {
    if (confirm('キャンバス位置をリセットしますか？')) {
      try {
        await NotesService.resetCanvasState();
        canvasOps.resetView();
        alert('キャンバス状態をリセットしました');
      } catch (error) {
        console.error('リセットエラー:', error);
        alert('リセットに失敗しました');
      }
    }
  }, [canvasOps]);
  */
  // ヘッダーメニューアクション
  const handleMenuAction = useCallback((action: 'list' | 'create' | 'rename' | 'showAbout' | 'resetPosition' | 'clearAllNotes' | 'clearAllLines' | 'delete') => {
    console.log('メニューアクション:', action);
    switch (action) {
      case 'list':
        console.log('ホワイトボード一覧を開く');
        // TODO: ボード一覧の実装
        break;
      case 'create':
        // 🔧 修正：新規ボード作成
        const newBoardName = prompt('新しいホワイトボードの名前を入力してください:');
        if (newBoardName && newBoardName.trim()) {
          whiteboardManager.createBoard(newBoardName.trim())
            .then((boardId) => {
              console.log('✅ 新規ボード作成・切り替え完了:', boardId);
            })
            .catch((error) => {
              console.error('❌ 新規ボード作成に失敗:', error);
              alert('ボードの作成に失敗しました');
            });
        }
        break;
      case 'rename':
        // 🔧 修正：現在のボード名変更
        if (whiteboardManager.currentBoard) {
          const newName = prompt('新しい名前を入力してください:', whiteboardManager.currentBoard.name);
          if (newName && newName.trim()) {
            whiteboardManager.updateBoard(whiteboardManager.currentBoardId!, { name: newName.trim() })
              .then(() => {
                console.log('✅ ボード名変更完了:', newName);
              })
              .catch((error) => {
                console.error('❌ ボード名変更に失敗:', error);
                alert('名前の変更に失敗しました');
              });
          }
        }
        break;
        
      case 'showAbout':
        setShowAboutDialog(true);
        break;

      case 'resetPosition':
        canvasOps.resetView();
        break;
      
      case 'delete':
        // 🔧 修正：現在のボード削除
        if (whiteboardManager.currentBoard) {
          if (confirm(`「${whiteboardManager.currentBoard.name}」を削除しますか？\n※関連する付箋・描画も全て削除されます。`)) {
            whiteboardManager.deleteBoard(whiteboardManager.currentBoardId!)
              .then(() => {
                console.log('✅ ボード削除完了');
              })
              .catch((error) => {
                console.error('❌ ボード削除に失敗:', error);
                alert(error.message || 'ボードの削除に失敗しました');
              });
          }
        }
        break;
      case 'clearAllNotes':
        if (confirm('現在のボードのすべての付箋を削除しますか？')) {
          notesManager.clearAllNotes();
          console.log('すべての付箋を削除しました');
        }
        break;
      case 'clearAllLines':
        if (confirm('現在のボードのすべての描画線を削除しますか？')) {
          drawingEngine.clearAllLines();
          console.log('すべての描画線を削除しました');
        }
        break;
    }
  }, [whiteboardManager, canvasOps, notesManager, drawingEngine]);
  // 新規追加：ライセンス表示ハンドラー
  const handleShowLicenses = useCallback(() => {
    setShowAboutDialog(false); // AboutDialogを閉じる
    setShowLicenseDialog(true); // ライセンスダイアログを開く
  }, []);

  const handleShowPWAInstall = useCallback(() =>{
    setShowAboutDialog(false);
    setShowPWADialog(true);
  }, [])


  // 🔧 修正：ボード選択画面表示
  const handleBoardListToggle = useCallback(() => {
    console.log('🗂️ ボード選択画面を開く');
    setShowBoardSelector(true);
  }, []);

  // デバッグモード切り替え処理
  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newState = !prev;
      console.log('🔍 デバッグモード:', newState ? 'ON' : 'OFF');
      return newState;
    });
  }, []);
  
  // 格子の描画
  const renderGrid = useCallback(() => {
    if (searchManager.searchState.isActive) return null;

    const gridSize = 50;
    const gridLines: React.ReactElement[] = [];
    const viewLeft = -canvasOps.canvasState.x / canvasOps.canvasState.scale;
    const viewTop = -canvasOps.canvasState.y / canvasOps.canvasState.scale;
    const viewRight = viewLeft + canvasOps.screenSize.width / canvasOps.canvasState.scale;
    const viewBottom = viewTop + canvasOps.screenSize.height / canvasOps.canvasState.scale;
    
    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const endX = Math.ceil(viewRight / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;
    const endY = Math.ceil(viewBottom / gridSize) * gridSize;
    
    // 垂直線
    for (let x = startX; x <= endX; x += gridSize) {
      gridLines.push(
        <Line 
          key={`v-${x}`} 
          points={[x, startY, x, endY]} 
          stroke="#deddddff" 
          strokeWidth={0.5} 
          opacity={0.3} 
          listening={false} 
        />
      );
    }
    
    // 水平線
    for (let y = startY; y <= endY; y += gridSize) {
      gridLines.push(
        <Line 
          key={`h-${y}`} 
          points={[startX, y, endX, y]} 
          stroke="#deddddff" 
          strokeWidth={0.5} 
          opacity={0.3} 
          listening={false} 
        />
      );
    }
    
    return gridLines;
  }, [
    canvasOps.canvasState, 
    canvasOps.screenSize, 
    searchManager.searchState.isActive
  ]);

  // 描画線の描画
  const renderDrawingLines = useCallback(() => {
    return (
      <>
        {/* 描画済みの線 */}
        {drawingEngine.drawingState.lines.map((line) => (
          <Line
            key={line.id}
            points={line.points}
            stroke={line.color}
            strokeWidth={line.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            listening={false}
            perfectDrawEnabled={false} // パフォーマンス最適化
          />
        ))}
        
        {/* 描画中の線 */}
        {drawingEngine.drawingState.isDrawing && drawingEngine.drawingState.currentLine.length > 2 && (
          <>
            {drawingEngine.selectedTool !== 'eraser' ? (
              <Line
                points={drawingEngine.drawingState.currentLine}
                stroke={drawingEngine.selectedTool === 'pen_red' ? '#dc2626' : '#000000'}
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                listening={false}
                opacity={0.8}
                perfectDrawEnabled={false} // パフォーマンス最適化
              />
            ) : (
              <Line
                points={drawingEngine.drawingState.currentLine}
                stroke="#ff0000"
                strokeWidth={15}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                listening={false}
                opacity={0.3}
                perfectDrawEnabled={false} // パフォーマンス最適化
              />
            )}
          </>
        )}
      </>
    );
  }, [drawingEngine.drawingState, drawingEngine.selectedTool]);

  // 検索線の描画
  const renderSearchLine = useCallback(() => {
    if (!searchManager.searchState.isActive || searchManager.searchState.results.length <= 1) {
      return null;
    }
    
    return (
      <Line 
        points={searchManager.searchState.positions.flatMap(pos => [pos.x, pos.y + 10])} 
        stroke="#c1c1c1ff" 
        strokeWidth={1.2} 
        opacity={0.7} 
        listening={false}
        perfectDrawEnabled={false} // パフォーマンス最適化
      />
    );
  }, [searchManager.searchState]);

  // 付箋の描画（統合版StickyNoteを使用）
  const renderNotes = useCallback(() => {
    return notesManager.notes
      .sort((a, b) => (a.zIndex || 1000) - (b.zIndex || 1000))
      .map((note) => {
        const isSearchResult = searchManager.searchState.results.some(r => r.id === note.id);
        const isCurrentResult = searchManager.searchState.isActive && 
          searchManager.searchState.results[searchManager.searchState.currentIndex]?.id === note.id;
        
        return (
          <StickyNote
            key={note.id}
            note={{
              ...note,
              opacity: searchManager.searchState.isActive && !isSearchResult ? 0.15 : 1
            }}
            onDrag={searchManager.searchState.isActive || appMode === 'drawing' ? () => {} : notesManager.eventHandlers.onDrag}
            onDelete={notesManager.eventHandlers.onDelete}
            onColorChange={notesManager.eventHandlers.onColorChange}
            onBringToFront={notesManager.eventHandlers.onBringToFront}
            isHighlighted={isCurrentResult}
            isEditMode={notesManager.editingNote?.id === note.id}
            onEditModeChange={notesManager.eventHandlers.onEditModeChange}
            // パフォーマンス設定
            enableShadow={false} // 高速化のためShadow無効
            enableOptimization={true} // 最適化有効
          />
        );
      });
  }, [
    notesManager.notes,
    notesManager.editingNote,
    notesManager.eventHandlers,
    searchManager.searchState,
    appMode
  ]);

  // ローディング表示
  if (notesManager.isLoading || whiteboardManager.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100vw', 
        height: '100vh',
        fontSize: '18px',
        color: '#666',
        background: '#f8f9fa'
      }}>
        読み込み中...
      </div>
    );
  }

  // エラー表示
  if (whiteboardManager.error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100vw', 
        height: '100vh',
        fontSize: '18px',
        color: '#dc2626',
        background: '#f8f9fa'
      }}>
        <div>エラーが発生しました</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>{whiteboardManager.error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '16px', 
            padding: '8px 16px', 
            background: '#2563eb', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          再読み込み
        </button>
      </div>
    );
  }

// 🔧 修正後（条件分岐で適切に振り分け）
if (showBoardSelector) {
  if (boardSelectorMode === 'grid') {
    // グリッドモード：WhiteboardGridViewを直接呼び出し
    return (
      <WhiteboardGridView
        whiteboards={whiteboardManager.whiteboards}
        currentBoardId={whiteboardManager.currentBoardId}
        onSelectBoard={handleBoardSwitch}
        onCreateBoard={async (name) => {
          await whiteboardManager.createBoard(name);
          setShowBoardSelector(false);
        }}
        onDeleteBoard={async (boardId) => {
          await whiteboardManager.deleteBoard(boardId);
        }}
        onRenameBoard={async (boardId, newName) => {
          await whiteboardManager.updateBoard(boardId, { name: newName });
        }}
        onChangeColor={async (boardId, newColor) => {
          await whiteboardManager.updateBoard(boardId, { color: newColor });
        }}
        onBackToStack={() => setBoardSelectorMode('stack')}
      />
    );
  } else {
    // スタックモード：WhiteboardSelectorを呼び出し
    return (
      <WhiteboardSelector
        isVisible={showBoardSelector}
        whiteboards={whiteboardManager.whiteboards}
        currentBoardId={whiteboardManager.currentBoardId}
        mode={boardSelectorMode}
        maxDisplay={5}
        onSelectBoard={handleBoardSwitch}
        onCreateBoard={async (name) => {
          await whiteboardManager.createBoard(name);
          setShowBoardSelector(false);
        }}
        onDeleteBoard={async (boardId) => {
          await whiteboardManager.deleteBoard(boardId);
        }}
        onRenameBoard={async (boardId, newName) => {
          await whiteboardManager.updateBoard(boardId, { name: newName });
        }}
        onChangeColor={async (boardId, newColor) => {
          await whiteboardManager.updateBoard(boardId, { color: newColor });
        }}
        onSwitchMode={setBoardSelectorMode}
        onClose={() => {
          setShowBoardSelector(false);
          setBoardSelectorMode('stack');
        }}
      />
    );
  }
}

  return (
    <div style={{ 
      width: '100vw', 
      height: `100vh`, 
      overflow: 'hidden', 
      position: 'fixed', 
      top: 0,
      left: 0,
      background: '#f8f9fa'
    }}>
    {/*ウェルカムダイアログ */}
    <WelcomeDialog
      isOpen = {showWelcomeDialog}
      onAccept= {handleWelcomeAccept}
      onDecline={handleWelcomeDecline}
      onShowTerms={handleShowTerms}
    />
    {/*利用規約ダイアログ */}
    <TermsDialog
      isOpen={onShowTermsDialog}
      onClose={() => setShowTermsDialog(false)}
    />
    {/* PWAインストールダイアログ */}
    <PWAInstallDialog
      isOpen={showPWADialog}
      onClose={handlePWADialogClose}
      onSkip={handlePWADialogSkip}
    />
      {/* フローティングヘッダー */}
    {!showWelcomeDialog && (
      <>
      <FloatingHeader
        boardName={whiteboardManager.currentBoard?.name || 'ホワイトボード'}
        onSearch={searchManager.eventHandlers.onSearch}
        onClearSearch={searchManager.eventHandlers.onClearSearch}
        isSearchActive={searchManager.searchState.isActive}
        searchResultCount={searchManager.searchState.results.length}
        currentSearchIndex={searchManager.searchState.currentIndex}
        onBoardListToggle={handleBoardListToggle}
        onMenuAction={handleMenuAction}
      />

      {/* フローティングフッター */}
      <FloatingFooter
        onAddMemo={notesManager.handleAddMemo}
        mode={appMode}
        onModeChange={setAppMode}
        selectedTool={drawingEngine.selectedTool}
        onToolChange={drawingEngine.setSelectedTool}
        keyboardHeight={0}
        isInputFocused={false}
      />
      
      {/* フルスクリーンキャンバス */}
      <div className="canvas-container" style={{ 
        width: '100%', 
        height: '100%', 
        background: '#fcfbe4ff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Stage
          ref={stageRef}
          width={canvasOps.screenSize.width}
          height={canvasOps.screenSize.height}
          draggable={false}
          onTouchStart={unifiedTouch.handlers.onTouchStart}
          onTouchMove={unifiedTouch.handlers.onTouchMove}
          onTouchEnd={unifiedTouch.handlers.onTouchEnd}
          onMouseDown={unifiedTouch.handlers.onMouseDown}
          onMouseMove={unifiedTouch.handlers.onMouseMove}
          onMouseUp={unifiedTouch.handlers.onMouseUp}
          onWheel={unifiedTouch.handlers.onWheel}
          scaleX={canvasOps.canvasState.scale}
          scaleY={canvasOps.canvasState.scale}
          x={canvasOps.canvasState.x}
          y={canvasOps.canvasState.y}
          perfectDrawEnabled={false}
          listening={true}
        >
          <Layer
            perfectDrawEnabled={false}
            listening={true}
            clearBeforeDraw={true}
          >
            {/* 格子 */}
            {renderGrid()}
            
            {/* 描画線 */}
            {renderDrawingLines()}
            
            {/* 検索線 */}
            {renderSearchLine()}
            
            {/* 付箋 */}
            {renderNotes()}
          </Layer>
        </Stage>
      </div>

      {/* 編集用オーバーレイ */}
      {notesManager.editingNote && (
        <NoteEditorOverlay
          note={notesManager.editingNote}
          canvasState={canvasOps.canvasState}
          onSave={notesManager.handleSaveNoteEdit}
          onCancel={() => notesManager.eventHandlers.onEditModeChange(notesManager.editingNote!.id!, false)}
        />
      )}

      {/* 検索ナビゲーション */}
      <SearchNavigation
        isVisible={searchManager.searchState.isActive}
        currentIndex={searchManager.searchState.currentIndex}
        totalCount={searchManager.searchState.results.length}
        onPrevious={searchManager.eventHandlers.onPrevious}
        onNext={searchManager.eventHandlers.onNext}
        onClose={searchManager.eventHandlers.onClearSearch}
      />

      {/* このアプリについてダイアログ */}
      <AboutDialog
            isOpen={showAboutDialog}
            onClose={() => setShowAboutDialog(false)}
            onToggleDebugMode={toggleDebugMode}
            
            /*onShowLicenses={function (): void {
              throw new Error('Function not implemented.');
            }}*/
            onShowLicenses={handleShowLicenses}
            onShowPWAInstall = {handleShowPWAInstall}
            onShowTerms= {handleShowTerms}
            />

      <LicenseNotices
        isOpen={showLicenseDialog}
        onClose={() => setShowLicenseDialog(false)}
      />
      
      {/* 統合デバッグパネル（条件表示） */}
      {isDebugMode && ( 
        <div style={{ 
        position: 'fixed', 
        bottom: '250px',
        left: '20px', 
        background: 'rgba(255,255,255,0.95)', 
        padding: '12px', 
        borderRadius: '12px', 
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '350px',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          v1.0 DEBUG MODE
        </div>
        <div style={{ marginBottom: '4px' }}>
          付箋: {notesManager.notes.length}件 | 線: {drawingEngine.drawingState.lines.length}本 | 倍率: {Math.round(canvasOps.canvasState.scale * 100)}%
        </div>
        <div style={{ marginBottom: '4px' }}>
          ボード: {whiteboardManager.currentBoard?.name || '未選択'} (全{whiteboardManager.whiteboards.length}件)
        </div>
        <div style={{ marginBottom: '4px' }}>
          モード: {appMode} | ツール: {drawingEngine.selectedTool} | 編集中: {notesManager.editingNote ? 'あり' : 'なし'}
        </div>
        <div style={{ marginBottom: '4px' }}>
          タッチモード: {unifiedTouch.touchMode} | タッチ数: {unifiedTouch.touchPoints.length}
        </div>
        <div style={{ marginBottom: '8px' }}>
          検索: {searchManager.searchState.isActive ? `${searchManager.searchState.results.length}件` : 'なし'}
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={canvasOps.resetView} 
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #007bff', 
              borderRadius: '6px', 
              background: '#007bff', 
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            中央に戻る
          </button>
          <button 
            onClick={clearAllData} 
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #dc3545', 
              borderRadius: '6px', 
              backgroundColor: '#dc3545', 
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            全削除
          </button>
          <button 
            onClick={() => setShowBoardSelector(true)} 
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #28a745', 
              borderRadius: '6px', 
              backgroundColor: '#28a745', 
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ボード選択
          </button>
          <button 
            onClick={toggleDebugMode} 
            style={{ 
              padding: '6px 12px', 
              border: '1px solid #6c757d', 
              borderRadius: '6px', 
              backgroundColor: '#6c757d', 
              color: 'white',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            DEBUG OFF
          </button>
          <button
            onClick={resetWelcomeDialog}
            style={{ 
              padding: '6px 12px', 
              border: '3px solid #000000ff', 
              borderRadius: '6px', 
              backgroundColor: '#fffb00ff', 
              color: 'black',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            初期化
          </button>
        </div>
      </div>
      )}
      </>
    )}
    </div>
  );
}

export default App;