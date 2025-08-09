import React, { useState, useEffect, useRef } from 'react';
import type { StickyNote } from '../db/database';

interface NoteEditorOverlayProps {
  note: StickyNote;
  canvasState: { scale: number; x: number; y: number };
  onSave: (id: string, text: string) => void;
  onCancel: () => void;
}

// 🔧 修正: 編集時のサイズ計算定数（StickyNote.tsxと完全同期）
const EDITOR_CONFIG = {
  MIN_WIDTH: 150,
  MAX_WIDTH: 450,
  MIN_HEIGHT: 80,
  CHAR_WIDTH: 8,           // 1文字あたりの幅
  LINE_HEIGHT: 16,         // 行の高さ
  FONT_SIZE: 12,           // フォントサイズ
  HORIZONTAL_PADDING: 20,  // 左右の余白（10px × 2）
  VERTICAL_PADDING: 10,    // テキスト上部の余白
  DATE_HEIGHT: 18,         // 日時表示領域の高さ
  BOTTOM_MARGIN: 8         // 日時の下マージン
} as const;

// 🔧 修正: 編集時のサイズ計算関数（保守的アプローチ、表示時と完全同期）
const calculateNoteSize = (text: string) => {
  const lines = text.split('\n');
  
  // 🎯 Step 1: 幅の計算（最長行基準、但し最大幅制限あり）
  const maxLineLength = Math.max(...lines.map((line: string) => line.length));
  const calculatedWidth = maxLineLength * EDITOR_CONFIG.CHAR_WIDTH + EDITOR_CONFIG.HORIZONTAL_PADDING;
  const width = Math.max(
    EDITOR_CONFIG.MIN_WIDTH, 
    Math.min(EDITOR_CONFIG.MAX_WIDTH, calculatedWidth)
  );
  
  // 🎯 Step 2: 折り返しを考慮した表示行数計算（保守的アプローチ）
  const textAreaWidth = width - EDITOR_CONFIG.HORIZONTAL_PADDING; // テキスト描画可能幅

  // 🔧 修正: より保守的な文字数計算（日本語・英語混在を考慮）
  const safeCharsPerLine = Math.max(1, Math.floor(textAreaWidth / (EDITOR_CONFIG.CHAR_WIDTH * 1.5))); // 20%のマージンを追加

  let totalDisplayLines = 0;
  
  for (const line of lines) {
    if (line.length === 0) {
      // 空行
      totalDisplayLines += 1;
    } else {
      // 🔧 修正: より保守的な折り返し行数計算
      const estimatedWrappedLines = Math.max(1, Math.ceil(line.length / safeCharsPerLine));
      
      // 🎯 追加の安全マージン: 長い行はさらに余裕を持つ
      const adjustedLines = line.length > safeCharsPerLine * 2 ? 
        estimatedWrappedLines + 1.5 : estimatedWrappedLines;
      
      totalDisplayLines += adjustedLines;
    }
  }
  
  // 🎯 追加: 最小行数保証（短いテキストでも適切な高さを確保）
  totalDisplayLines = Math.max(totalDisplayLines, 2);
  
  // 🎯 Step 3: テキスト描画に必要な高さを計算（余裕を持った計算）
  const textRenderHeight = totalDisplayLines * EDITOR_CONFIG.LINE_HEIGHT /* + 
                           Math.ceil(totalDisplayLines / 3) * 2; // 3行ごとに2pxの追加マージン */

  // 🎯 Step 4: 付箋全体の高さ = テキスト高さ + 上下マージン + 日時領域
  const totalHeight = 
    EDITOR_CONFIG.VERTICAL_PADDING +      // 上部余白
    textRenderHeight +                          // テキスト描画高さ（余裕を持った計算）
    EDITOR_CONFIG.DATE_HEIGHT +           // 日時領域
    EDITOR_CONFIG.BOTTOM_MARGIN;          // 下部余白

  const height = Math.max(EDITOR_CONFIG.MIN_HEIGHT, totalHeight);

  // 🔍 詳細デバッグ情報
  console.log('📝 編集時サイズ計算（保守的アプローチ）:', {
    text: text.substring(0, 40) + '...',
    originalLines: lines.length,
    maxLineLength,
    textAreaWidth,
    safeCharsPerLine,
    estimatedDisplayLines: totalDisplayLines,
    textRenderHeight,
    totalHeight,
    finalHeight: height,
    width,
    heightIncrease: textRenderHeight - (lines.length * EDITOR_CONFIG.LINE_HEIGHT)
  });
  
  return { 
    width, 
    height,
    textRenderHeight,      // テキスト描画用の高さ
    totalDisplayLines      // 推定表示行数（デバッグ用）
  };
};

const NoteEditorOverlay: React.FC<NoteEditorOverlayProps> = ({ 
    note, canvasState, onSave, onCancel
}) => {
  const [editText, setEditText] = useState(note.text);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editorPosition, setEditorPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- 精密な座標変換計算（キーボード対応版） ---
  const calculatePrecisePosition = () => {
    const stageElement = document.querySelector('.canvas-container');
    const stageRect = stageElement?.getBoundingClientRect();
    
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportTop = window.visualViewport?.offsetTop || 0;
    
    const screenX = (note.x * canvasState.scale) + canvasState.x + (stageRect?.left || 0);
    const screenY = (note.y * canvasState.scale) + canvasState.y + (stageRect?.top || 0) + viewportTop;
    
    console.log('📝 編集位置計算:', {
      notePosition: { x: note.x, y: note.y },
      canvasState,
      stageRect: stageRect ? { left: stageRect.left, top: stageRect.top } : null,
      viewport: {
        height: viewportHeight,
        offsetTop: viewportTop,
        innerHeight: window.innerHeight
      },
      calculatedPosition: { x: screenX, y: screenY }
    });
    
    return {
      x: screenX,
      y: screenY
    };
  };

  const updatePosition = () => {
    const newPosition = calculatePrecisePosition();
    setEditorPosition(newPosition);
  };

  useEffect(() => {
    updatePosition();
  }, [note.x, note.y, canvasState.scale, canvasState.x, canvasState.y]);

  useEffect(() => {
    const handleViewportChange = () => {
      console.log('📝 Viewport変化検知 - 位置を再計算');
      updatePosition();
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    window.addEventListener('resize', handleViewportChange);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      updatePosition();
    }, 50);
  }, [editText]);

  useEffect(() => {
    setTimeout(() => { 
      textareaRef.current?.focus(); 
      updatePosition();
    }, 100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        setShowSaveDialog(true);
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editText !== note.text) {
          setShowSaveDialog(true);
        } else {
          handleCancel();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editText, note.text]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      
      console.log('📝 編集オーバーレイ外部クリック検知:', {
        eventType: e.type,
        tagName: target.tagName,
        textareaContains: textareaRef.current?.contains(target)
      });
      
      if (textareaRef.current && !textareaRef.current.contains(target)) {
        console.log('📝 テキストエリア外クリック - 保存ダイアログ表示');
        if (editText !== note.text) {
          setShowSaveDialog(true);
        } else {
          onCancel();
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [editText, note.text, onCancel]);

  const handleSave = () => { 
    onSave(note.id!, editText); 
  };
  
  const handleCancel = () => { 
    onCancel(); 
  };

  const handleSaveAndClose = () => {
    setShowSaveDialog(false);
    handleSave();
  };

  const handleDiscardAndClose = () => {
    setShowSaveDialog(false);
    handleCancel();
  };

  const handleCancelDialog = () => {
    setShowSaveDialog(false);
    updatePosition();
  };
  
  // 🔧 修正: 編集時サイズ計算（折り返し対応、表示時と完全同期）
  const { width: noteWidth, height: noteHeight, totalDisplayLines } = calculateNoteSize(editText);
  
  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${editorPosition.x}px`,
    top: `${editorPosition.y}px`,
    width: `${noteWidth * canvasState.scale}px`,
    height: `${noteHeight * canvasState.scale}px`,
    zIndex: 10001,
  };

  // 🔧 修正: テキストエリアスタイル（折り返し対応）
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: '2px solid #2196F3',
    borderRadius: '6px',
    padding: '10px',
    fontSize: `${12 * canvasState.scale}px`,
    fontFamily: 'Arial, sans-serif',
    lineHeight: `${16 * canvasState.scale}px`, // 🎯 Konvaと同じ行高を設定
    resize: 'none',
    outline: 'none',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    overflow: 'auto', // 自然なスクロール
    boxSizing: 'border-box',
    wordWrap: 'break-word', // 🎯 追加: 長い単語の折り返し
    whiteSpace: 'pre-wrap'  // 🎯 追加: 改行とスペースを保持しつつ折り返し
  };

  return (
    <>
      {/* 🔧 修正: 編集用テキストエリア（安定した表示） */}
      <div style={wrapperStyle}>
        {/* 🔧 デバッグ情報表示（開発時のみ表示） */}
        {import.meta.env.DEV  && (
          <div
            style={{
              position: 'absolute',
              top: '-45px',
              left: '0',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            📏 表示行数: {totalDisplayLines} | サイズ: {noteWidth}×{noteHeight}
          </div>
        )}
        
        <textarea 
          ref={textareaRef} 
          value={editText} 
          onChange={(e) => setEditText(e.target.value)} 
          style={textareaStyle}
          placeholder="付箋の内容を編集..."
        />
      </div>

      {/* 保存確認ダイアログ */}
      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
              変更を保存しますか？
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#666' }}>
              編集した内容が失われます。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleSaveAndClose}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                保存
              </button>
              <button
                onClick={handleDiscardAndClose}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                破棄
              </button>
              <button
                onClick={handleCancelDialog}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteEditorOverlay;