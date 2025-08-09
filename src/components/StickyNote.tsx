// components/StickyNote.tsx - 表示安定化版付箋コンポーネント

import React, { useState, useRef, useMemo, useCallback, memo, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type { StickyNote as StickyNoteType } from '../db/database';
//import {isValidNoteText} from '../utils/dataValidator.ts';
import { sanitizeForDisplay } from '../utils/sanitize';

// 付箋の色定義（定数化でメモリ効率化）
const STICKY_COLORS = {
  yellow: { bg: '#FFE066', border: '#E6CC00' },
  pink: { bg: '#ffcbe5ff', border: '#e797c9ff' },
  orange: { bg: '#FFD9B3', border: '#FFC466' },
  blue: { bg: '#abbbefff', border: '#7c9be4ff' },
  green: { bg: '#b6ffd3ff', border: '#63d08fff' },
  purple: { bg: '#ddbbffff', border: '#ae84c8ff' },
  gray: { bg: '#f2f1f1ff', border: '#ccccccff' }
} as const;

// 🔧 修正: 付箋サイズ計算の定数（精密化）
const STICKY_NOTE_CONFIG = {
  MIN_WIDTH: 150,
  MAX_WIDTH: 300,
  MIN_HEIGHT: 80,
  CHAR_WIDTH: 8,           // 1文字あたりの幅
  LINE_HEIGHT: 16,         // Konva Text の lineHeight 設定値と一致
  FONT_SIZE: 12,           // フォントサイズ
  HORIZONTAL_PADDING: 20,  // 左右の余白（10px × 2）
  VERTICAL_PADDING: 10,    // テキスト上部の余白
  DATE_HEIGHT: 18,         // 日時表示領域の高さ
  BOTTOM_MARGIN: 8         // 日時の下マージン
} as const;

interface ExtendedStickyNote extends StickyNoteType {
  opacity?: number;
}

interface StickyNoteProps {
  note: ExtendedStickyNote;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onBringToFront: (id: string) => void;
  isHighlighted?: boolean;
  isEditMode: boolean;
  onEditModeChange: (id: string, isEditing: boolean) => void;
  // パフォーマンス設定（オプション）
  enableShadow?: boolean;
  enableOptimization?: boolean;
}

// 🔧 大幅修正: より保守的で確実な付箋サイズ計算関数
const calculateNoteSize = (text: string) => {
  const lines = text.split('\n');
  
  // 🎯 Step 1: 幅の計算（最長行基準、但し最大幅制限あり）
  const maxLineLength = Math.max(...lines.map((line: string) => line.length));
  const calculatedWidth = maxLineLength * STICKY_NOTE_CONFIG.CHAR_WIDTH + STICKY_NOTE_CONFIG.HORIZONTAL_PADDING;
  const width = Math.max(
    STICKY_NOTE_CONFIG.MIN_WIDTH, 
    Math.min(STICKY_NOTE_CONFIG.MAX_WIDTH, calculatedWidth)
  );
  
  // 🎯 Step 2: 折り返しを考慮した表示行数計算（保守的アプローチ）
  const textAreaWidth = width - STICKY_NOTE_CONFIG.HORIZONTAL_PADDING; // テキスト描画可能幅
  
  // 🔧 修正: より保守的な文字数計算（日本語・英語混在を考慮）
  const safeCharsPerLine = Math.max(1, Math.floor(textAreaWidth / (STICKY_NOTE_CONFIG.CHAR_WIDTH * 1.5))); // 20%のマージンを追加
  
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
  const textRenderHeight = totalDisplayLines * STICKY_NOTE_CONFIG.LINE_HEIGHT + 
                           Math.ceil(totalDisplayLines / 3) * 2; // 3行ごとに2pxの追加マージン

  // 🎯 Step 4: 付箋全体の高さ = テキスト高さ + 上下マージン + 日時領域
  const totalHeight = 
    STICKY_NOTE_CONFIG.VERTICAL_PADDING +      // 上部余白
    textRenderHeight +                          // テキスト描画高さ（余裕を持った計算）
    STICKY_NOTE_CONFIG.DATE_HEIGHT +           // 日時領域
    STICKY_NOTE_CONFIG.BOTTOM_MARGIN;          // 下部余白
  
  const height = Math.max(STICKY_NOTE_CONFIG.MIN_HEIGHT, totalHeight);
  
  // 🔍 詳細デバッグ情報
  console.log('📏 付箋サイズ計算（保守的アプローチ）:', {
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
    heightIncrease: textRenderHeight - (lines.length * STICKY_NOTE_CONFIG.LINE_HEIGHT)
  });
  
  return { 
    noteWidth: width, 
    noteHeight: height,
    textRenderHeight,      // テキスト描画用の高さ
    textStartY: STICKY_NOTE_CONFIG.VERTICAL_PADDING,  // テキスト開始Y座標
    dateY: height - STICKY_NOTE_CONFIG.DATE_HEIGHT,   // 日時のY座標
    totalDisplayLines      // 推定表示行数（デバッグ用）
  };
};

const StickyNote: React.FC<StickyNoteProps> = memo(({ 
  note, 
  onDrag, 
  onDelete, 
  onColorChange, 
  onBringToFront,
  isHighlighted, 
  isEditMode, 
  onEditModeChange,
  enableShadow = false,
  enableOptimization = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const longPressTimer = useRef<number | null>(null);
  const isDragging = useRef(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);
  
  // 🔧 新規追加: ドラッグ無効化の状態管理
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const dragResetTimer = useRef<number | null>(null);

  // メモ化された値
  const currentColor = useMemo(() => 
    STICKY_COLORS[note.color as keyof typeof STICKY_COLORS] || STICKY_COLORS.yellow,
    [note.color]
  );
  
  const opacity = note.opacity !== undefined ? note.opacity : 1.0;

  // 🔧 修正: 精密なサイズ計算（メモ化）
  const { 
    noteWidth, 
    noteHeight, 
    textRenderHeight,
    textStartY,
    dateY,
    totalDisplayLines: _totalDisplayLines, // 未使用
  } = useMemo(() => calculateNoteSize(note.text), [note.text]);

  // 日時フォーマット（メモ化）
  const formattedDate = useMemo(() => 
    note.createdAt.toLocaleDateString('ja-JP', { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    [note.createdAt]
  );

  // 🔧 新規追加: ドラッグ無効化の安全なリセット関数
  const resetDragState = useCallback(() => {
    console.log('🔧 ドラッグ状態をリセット:', note.id);
    
    // 既存タイマーをクリア
    if (dragResetTimer.current) {
      clearTimeout(dragResetTimer.current);
      dragResetTimer.current = null;
    }
    
    // 少し遅延してドラッグを再有効化
    dragResetTimer.current = window.setTimeout(() => {
      setIsDragDisabled(false);
      isDragging.current = false;
      console.log('✅ ドラッグ再有効化完了:', note.id);
    }, 300); // 300ms後に再有効化
  }, [note.id]);

  // 🔧 大幅修正: クリック処理（ドラッグ状態の適切な管理）
  const handleClick = useCallback((e: any) => {
    console.log('🖱️ クリック処理開始:', { 
      clickCount: clickCount.current + 1, 
      isDragging: isDragging.current,
      noteId: note.id 
    });

    // イベントの伝播を停止
    e.cancelBubble = true;
    e.evt?.stopPropagation?.();
    e.evt?.preventDefault?.();

    // ドラッグ中の場合はクリック処理をスキップ
    if (isDragging.current) {
      console.log('⚠️ ドラッグ中のためクリック処理をスキップ');
      return;
    }

    clickCount.current += 1;

    if (clickCount.current === 1) {
      // 🎯 シングルクリック処理
      console.log('👆 シングルクリック');
      
      // ドラッグを無効化
      setIsDragDisabled(true);
      
      clickTimer.current = window.setTimeout(() => {
        if (clickCount.current === 1) {
          console.log('🎯 シングルクリック');
          clickCount.current = 0;
          resetDragState(); // ドラッグ状態をリセット
        }
        
      }, 300); // 300ms後にシングルクリックとして処理
      
    } else if (clickCount.current === 2) {
      // 🎯 ダブルクリック処理
      console.log('👆👆 ダブルクリック処理');
      
      // シングルクリックタイマーをクリア
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
        clickTimer.current = null;
      }
      
      clickCount.current = 0;
      
      // ドラッグを無効化
      setIsDragDisabled(true);
      
      // メニューを閉じる
      setShowMenu(false);
      setShowColorPicker(false);
      
      if (e.evt.shiftKey) {
        console.log('📝 Shift+ダブルクリック: 編集モード');
        onEditModeChange(note.id!, true);
      } else {
        console.log('🎯 ダブルクリック: 前面に移動');
        onBringToFront(note.id!);
      }
      
      // ドラッグ状態をリセット
      resetDragState();
    }
  }, [note.id, onEditModeChange, onBringToFront, resetDragState]);
  
  // 🔧 修正: ドラッグ開始処理（より厳密な制御）
  const handleDragStart = useCallback((e: any) => {
    console.log('🚀 ドラッグ開始:', note.id);
    
    // イベントの伝播を停止
    e.cancelBubble = true;
    e.evt?.stopPropagation?.();
    e.evt?.preventDefault?.();

    // ドラッグが無効化されている場合は処理しない
    if (isDragDisabled) {
      console.log('🚫 ドラッグが無効化されているため開始を阻止');
      e.target.stopDrag(); // Konvaのドラッグを強制停止
      return;
    }

    isDragging.current = true;
    
    // タイマーとメニューをクリア
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickCount.current = 0;
    
    setShowMenu(false);
    setShowColorPicker(false);
    
    console.log('✅ ドラッグ開始完了');
  }, [isDragDisabled, note.id]);

  // 🔧 修正: ドラッグ終了処理（状態の確実なリセット）
  const handleDragEnd = useCallback((e: any) => {
    console.log('🏁 ドラッグ終了:', note.id);
    
    e.cancelBubble = true;
    
    // 位置を更新
    onDrag(note.id!, e.target.x(), e.target.y());
    
    // ドラッグ状態を確実にリセット
    setTimeout(() => { 
      isDragging.current = false;
      console.log('✅ ドラッグ状態リセット完了');
    }, 100);
  }, [note.id, onDrag]);

  const handleRightClick = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation?.();
    e.evt?.preventDefault?.();

    if (isDragging.current) return;
    setShowMenu(true);
  }, []);

  const handlePointerDown = useCallback((e: any) => {
    e.cancelBubble = true;
    e.evt?.stopPropagation?.();
    e.evt?.preventDefault?.();

    if (isDragging.current) return;
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        setShowMenu(true);
      }
    }, 600);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleDelete = useCallback((e: any) => {
    e.cancelBubble = true;
    if (confirm(`「${note.text.slice(0, 20)}...」を削除しますか？`)) {
      onDelete(note.id!);
    }
    setShowMenu(false);
  }, [note.id, note.text, onDelete]);
  
  const handleShowColorPicker = useCallback((e: any) => {
    e.cancelBubble = true;
    setShowColorPicker(true);
    setShowMenu(false);
  }, []);
  
  const handleColorChange = useCallback((colorKey: string, e: any) => {
    e.cancelBubble = true;
    onColorChange(note.id!, colorKey);
    setShowColorPicker(false);
  }, [note.id, onColorChange]);
  
  const handleCancelMenu = useCallback((e: any) => {
    e.cancelBubble = true;
    setShowMenu(false);
    setShowColorPicker(false);
  }, []);

  const handleEditClick = useCallback(() => {
    onEditModeChange(note.id!, true);
    setShowMenu(false);
  }, [note.id, onEditModeChange]);

  // 🔧 新規追加: クリーンアップ処理
  useEffect(() => {
    return () => {
      // コンポーネントアンマウント時にタイマーをクリア
      if (clickTimer.current) clearTimeout(clickTimer.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (dragResetTimer.current) clearTimeout(dragResetTimer.current);
    };
  }, []);

  return (
    <Group
      x={note.x}
      y={note.y}
      opacity={opacity}
      draggable={!isEditMode && !isDragDisabled} // 🔧 修正: ドラッグ無効化状態を考慮
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onContextMenu={handleRightClick}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onClick={handleClick}
      onTap={handleClick}
      perfectDrawEnabled={!enableOptimization}
      transformsEnabled={enableOptimization ? "position" : "all"}
      listening={true}
    >
      {/* 🔧 背景（精密サイズ） */}
      <Rect
        width={noteWidth}
        height={noteHeight}
        fill={currentColor.bg} 
        stroke={isEditMode ? "#2196F3" : currentColor.border}
        strokeWidth={isHighlighted ? 3 : (isEditMode ? 3 : 1)}
        cornerRadius={6}
        shadowColor={enableShadow ? "rgba(0,0,0,0.2)" : "transparent"}
        shadowBlur={enableShadow ? (isEditMode ? 8 : 4) : 0}
        shadowOffset={enableShadow ? { x: 2, y: 2 } : { x: 0, y: 0 }}
        perfectDrawEnabled={!enableOptimization}
      />
      
      {/* 🔧 修正: テキスト（折り返し対応） */}
      <Text

        text={sanitizeForDisplay(note.text)}
        x={10} 
        y={textStartY}
        width={noteWidth - 20} 
        height={textRenderHeight}
        fontSize={STICKY_NOTE_CONFIG.FONT_SIZE} 
        fontFamily="Arial" 
        fill="#333"
        lineHeight={STICKY_NOTE_CONFIG.LINE_HEIGHT / STICKY_NOTE_CONFIG.FONT_SIZE} // KonvaのlineHeight比率
        verticalAlign="top"
        wrap="word" // 🎯 重要: 単語単位での折り返しを有効化
        listening={false}
        perfectDrawEnabled={!enableOptimization}
        transformsEnabled={enableOptimization ? "position" : "all"}
      />
      
      {/* 🔧 修正: 日時（精密な配置） */}
      <Text
        text={formattedDate}
        x={10} 
        y={dateY}
        fontSize={8} 
        fontFamily="Arial" 
        fill="#666"
        listening={false}
        perfectDrawEnabled={!enableOptimization}
        transformsEnabled={enableOptimization ? "position" : "all"}
      />

      {/* メニュー背景 */}
      {(showMenu || showColorPicker) && (
        <Rect 
          x={-1000} y={-1000} width={3000} height={3000} 
          fill="transparent" 
          onTap={handleCancelMenu} 
          onClick={handleCancelMenu}
        />
      )}

      {/* メニューボタン */}
      {showMenu && (
        <Group>
          {/* Delete */}
          <Rect x={0} y={-30} width={50} height={24} fill="#FF4444" cornerRadius={12} onTap={handleDelete} onClick={handleDelete} />
          <Text text="削除" x={0} y={-30} width={50} height={24} fill="white" align="center" verticalAlign="middle" fontSize={12} onTap={handleDelete} onClick={handleDelete} />
          {/* Color */}
          <Rect x={60} y={-30} width={50} height={24} fill={currentColor.bg} stroke={currentColor.border} cornerRadius={12} onTap={handleShowColorPicker} onClick={handleShowColorPicker} />
          <Text text="色変更" x={60} y={-30} width={50} height={24} fill="#333" align="center" verticalAlign="middle" fontSize={12} onTap={handleShowColorPicker} onClick={handleShowColorPicker} />
          {/* Edit */}
          <Rect x={120} y={-30} width={50} height={24} fill="#2196F3" cornerRadius={12} onTap={handleEditClick} onClick={handleEditClick} />
          <Text text="編集" x={120} y={-30} width={50} height={24} fill="white" align="center" verticalAlign="middle" fontSize={12} onTap={handleEditClick} onClick={handleEditClick} />
        </Group>
      )}

      {/* 色選択 */}
      {showColorPicker && (
        <Group x={noteWidth - 60} y={-80} >
          {Object.entries(STICKY_COLORS).map(([colorKey, colorData], index) => (
            <Rect
              key={colorKey}
              x={(index % 3) * 25}
              y={Math.floor(index / 3) * 25}
              width={22} height={22}
              fill={colorData.bg} stroke={colorData.border}
              strokeWidth={note.color === colorKey ? 3 : 1}
              cornerRadius={4}
              onTap={(e) => handleColorChange(colorKey, e)}
              onClick={(e) => handleColorChange(colorKey, e)}
            />
          ))}
        </Group>
      )}
    </Group>
  );
});

StickyNote.displayName = 'StickyNote';

export default StickyNote;