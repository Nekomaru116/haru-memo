// types/index.ts - マルチボード対応拡張版

import type { StickyNote as BaseStickyNote, CanvasLine, Whiteboard } from '../db/database';

// アプリケーション型定義
export type AppMode = 'note' | 'drawing';
export type DrawingTool = 'pen_red' | 'pen_black' | 'eraser';

// 🔧 新規追加：ボード選択画面のモード
export type BoardSelectorMode = 'stack' | 'grid';

// 拡張された付箋型
export interface ExtendedStickyNote extends BaseStickyNote {
  opacity?: number;
  zIndex?: number;
}

// キャンバス状態
export interface CanvasState {
  scale: number;
  x: number;
  y: number;
}

// 画面サイズ
export interface ScreenSize {
  width: number;
  height: number;
}

// 検索状態
export interface SearchState {
  results: BaseStickyNote[];
  isActive: boolean;
  currentIndex: number;
  positions: { x: number; y: number }[];
  originalPositions: Map<string, { x: number; y: number }>;
  keyword: string;
}

// アニメーション状態
export interface AnimationState {
  isAnimating: boolean;
  frameRef: React.MutableRefObject<number | null>;
}

// ピンチズーム状態
export interface PinchState {
  lastCenter: { x: number; y: number } | null;
  lastDist: number;
}

// 描画状態
export interface DrawingState {
  lines: CanvasLine[];
  isDrawing: boolean;
  currentLine: number[];
}

// 🔧 新規追加：ボード選択状態
export interface BoardSelectorState {
  selectedBoardId: string | null;  // 拡張中のボード
  mode: BoardSelectorMode;         // 表示モード
  isVisible: boolean;              // 選択画面の表示状態
}

// 🔧 新規追加：ボード表示データ
export interface BoardDisplayData extends Whiteboard {
  notesCount: number;              // 付箋数
  linesCount: number;              // 描画線数
  previewText?: string;            // プレビューテキスト
  lastActivity: Date;              // 最終活動日時
}

// イベントハンドラー型
export interface CanvasEventHandlers {
  handlePinchStart: (e: any) => void;
  handlePinchMove: (e: any) => void;
  handlePinchEnd: () => void;
  handleDrawStart: (e: any) => void;
  handleDrawMove: (e: any) => void;
  handleDrawEnd: () => Promise<void>;
  handleStageDragEnd: (e: any) => void;
  handleWheel: (e: any) => void;
}

// 付箋操作のイベントハンドラー型
export interface NoteEventHandlers {
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  onBringToFront: (id: string) => void;
  onEditModeChange: (id: string, isEditing: boolean) => void;
}

// 検索操作のイベントハンドラー型
export interface SearchEventHandlers {
  onSearch: (keyword: string) => Promise<void>;
  onClearSearch: () => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
}

// 🔧 新規追加：ボード操作のイベントハンドラー型
export interface BoardEventHandlers {
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name?: string) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onRenameBoard: (boardId: string, newName: string) => Promise<void>;
  onSwitchMode: (mode: BoardSelectorMode) => void;
  onCloseSelector: () => void;
}

// アニメーション関数型
export interface AnimationFunctions {
  animateCanvasTo: (
    targetState: CanvasState,
    duration?: number
  ) => Promise<void>;
  animateNotesTo: (
    targetPositions: Map<string, { x: number; y: number }>,
    duration?: number
  ) => Promise<void>;
  animateToCreatedNote: (note: BaseStickyNote) => Promise<void>;
}

// カスタムフックの戻り値型
export interface UseCanvasOperationsReturn {
  canvasState: CanvasState;
  screenSize: ScreenSize;
  animationState: AnimationState;
  pinchState: PinchState;
  eventHandlers: CanvasEventHandlers;
  animationFunctions: AnimationFunctions;
  resetView: () => void;
  updateCanvasState: (state: CanvasState) => void;
}

export interface UseNotesManagerReturn {
  notes: ExtendedStickyNote[];
  editingNote: BaseStickyNote | null;
  maxZIndex: number;
  isLoading: boolean;
  eventHandlers: NoteEventHandlers;
  handleAddMemo: (text: string) => Promise<void>;
  handleSaveNoteEdit: (id: string, newText: string) => Promise<void>;
  animateNotesTo: (targetPositions: Map<string, { x: number; y: number }>, duration?: number) => Promise<void>;
  clearAllNotes: () => Promise<void>;
}

export interface UseDrawingEngineReturn {
  drawingState: DrawingState;
  selectedTool: DrawingTool;
  setSelectedTool: (tool: DrawingTool) => void;
  drawingEventHandlers: {
    handleDrawStart: (e: any) => void;
    handleDrawMove: (e: any) => void;
    handleDrawEnd: () => Promise<void>;
  };
  clearAllLines: () => Promise<void>;
}

export interface UseSearchManagerReturn {
  searchState: SearchState;
  eventHandlers: SearchEventHandlers;
}

// 🔧 新規追加：ホワイトボード管理フックの戻り値型
export interface UseWhiteboardManagerReturn {
  // 状態
  whiteboards: Whiteboard[];
  currentBoardId: string | null;
  currentBoard: Whiteboard | null;
  isLoading: boolean;
  error: string | null;
  
  // 操作
  createBoard: (name?: string, color?: string) => Promise<string>; // 🔧 修正：color追加
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

// 🔧 新規追加：ボード選択コンポーネントのProps型
export interface WhiteboardSelectorProps {
  isVisible: boolean;
  whiteboards: Whiteboard[];
  currentBoardId: string | null;
  mode: BoardSelectorMode;
  maxDisplay?: number;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name?: string) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onRenameBoard: (boardId: string, newName: string) => Promise<void>;
  onSwitchMode: (mode: BoardSelectorMode) => void;
  onClose: () => void;
}

// 🔧 新規追加：ボードカードコンポーネントのProps型
export interface WhiteboardCardProps {
  board: Whiteboard;
  index: number;
  isSelected: boolean;
  isExtended: boolean;
  notesCount?: number;
  linesCount?: number;
  onClick: () => void;
  onLongPress: () => void;
  maxDisplay?: number;
}