import Dexie from 'dexie';
import { TUTORIAL_NOTES } from '../utils/tutorialConstants'; // 🔧 新規追加
import { TUTORIAL_LINES } from '../utils/tutorialConstants';
import { sanitizeForDisplay } from '../utils/sanitize.ts';
import { isValidBoardId, isValidColor, isValidNoteText } from '../utils/dataValidator.ts';
import { getRandomAvailableColor } from '../utils/boardColors';

// 付箋の型定義
export interface StickyNote {
  id?: string;          // Dexieでは主キーは?をつける
  text: string;
  x: number;
  y: number;
  zIndex?: number;
  color: string; // 付箋の色を追加（'yellow', 'pink', 'blue', etc.）
  boardId: string; // 🔧 新規追加：所属ボードID
  createdAt: Date;
  updatedAt: Date;
  opacity?: number; // 検索機能用に透明度を追加
}

// ホワイトボードの型定義
export interface Whiteboard {
  id?: string;          // "board_" + timestamp
  name: string;         // ユーザー入力名
  color: string;        // 🔧 新規追加：ボード固有の色（'red', 'blue', 'green', etc.）
  createdAt: Date;
  updatedAt: Date;
  canvasState: {        // ボード固有のキャンバス状態
    scale: number;
    x: number;
    y: number;
  };
  isDefault?: boolean;  // デフォルトボード判定用
}

// キャンバス状態の型定義（既存：後方互換性のため保持）
export interface CanvasState {
    id?: string; //主キー
    scale: number; // ズームレベル
    x: number; // キャンバスの位置
    y: number; // キャンバスの位置
    updatedAt: Date; // 更新日時
}

// 描画線の型定義
export interface CanvasLine {
  id? : string;
  points: number[];     // [x1,y1, x2,y2, ...] Konva形式の座標配列
  color: string;        // '#dc2626' (赤) | '#000000' (黒)
  strokeWidth: number;  // 線の太さ（固定値2を想定）
  tool: 'pen_red' | 'pen_black' | 'eraser'; // 描画ツール種別
  boardId: string;      // 🔧 新規追加：所属ボードID
  createdAt: Date;
  updatedAt: Date;
}

// データベースクラス
export class MemoAppDatabase extends Dexie {
  // テーブル定義
  notes!: Dexie.Table<StickyNote>;
  canvasState!: Dexie.Table<CanvasState>;
  lines!: Dexie.Table<CanvasLine>;
  whiteboards!: Dexie.Table<Whiteboard>; // 🔧 新規追加

  constructor() {
    super('MemoAppDatabase');
    
    // 🔧 データベースのスキーマ定義（バージョン4に更新）
    this.version(4).stores({
      notes: 'id, createdAt, updatedAt, x, y, zIndex, boardId', // boardId追加
      canvasState: 'id, scale, x, y, updatedAt', // 既存（後方互換性のため保持）
      lines: 'id, createdAt, updatedAt, tool, boardId', // boardId追加
      whiteboards: 'id, createdAt, updatedAt, name, color, isDefault' // color追加
    }).upgrade(tx => {
      // 🔧 マイグレーション処理：既存データにデフォルトboardIdを追加
      console.log('🔄 データベースマイグレーション開始（v3→v4）');
      
      return tx.table('notes').toCollection().modify(note => {
        if (!note.boardId) {
          note.boardId = 'board_default';
          console.log('📝 付箋にデフォルトboardIdを設定:', note.id);
        }
      }).then(() => {
        return tx.table('lines').toCollection().modify(line => {
          if (!line.boardId) {
            line.boardId = 'board_default';
            console.log('🎨 描画線にデフォルトboardIdを設定:', line.id);
          }
        });
      }).then(() => {
        // 🔧 新規追加：既存ボードにデフォルト色を設定
        return tx.table('whiteboards').toCollection().modify(board => {
          if (!board.color) {
            board.color = 'blue'; // 既存ボードにはデフォルト色を設定
            console.log('🎨 ボードにデフォルト色を設定:', board.id, board.color);
          }
        });
      });
    });
  }
}

// データベースインスタンスを作成・エクスポート
export const db = new MemoAppDatabase();

// データベース操作用の関数
export class NotesService {

  static async resetCanvasState(): Promise<void> {
    try {
      await db.canvasState.delete('main');
      console.log('キャンバス状態をリセットしました');
    } catch (error) {
      console.error('キャンバス状態のリセットに失敗:', error);
      throw error;
    }
  }

  // 🔧 修正：指定ボードの付箋を取得
  static async getAllNotes(boardId?: string): Promise<StickyNote[]> {
    try {
      if (boardId) {
        // 特定ボードの付箋のみ取得
        const notes = await db.notes
          .where('boardId')
          .equals(boardId)
          .toArray();
        // 作成日時順にソート
        return notes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else {
        // 全ての付箋を取得（後方互換性）
        return await db.notes.orderBy('createdAt').toArray();
      }
    } catch (error) {
      console.error('付箋の取得に失敗:', error);
      return [];
    }
  }

  // 🔧 修正：ボードIDを必須にして付箋を追加
  static async addNote(note: Omit<StickyNote, 'id'>, boardId: string): Promise<string> {
    try {
      // 入力データの検証
    if (!isValidBoardId(boardId)) {
      throw new Error('無効なボードIDです');
    }
    if (!isValidNoteText(note.text)) {
      throw new Error('無効な付箋テキストです');
    }
    if (!isValidColor(note.color)) {
      console.warn('無効な色指定、デフォルト色を使用:', note.color);
      note.color = 'yellow';
    }
      const id = Date.now().toString(); // IDを生成
      const noteWithId = {
        ...note,
        id,
        boardId, // 明示的にboardIdを設定
        text: sanitizeForDisplay(note.text),
        zIndex: note.zIndex || 1000
      };
      await db.notes.add(noteWithId);
      console.log('付箋を追加しました:', id, 'boardId:', boardId);
      return id;
    } catch (error) {
      console.error('付箋の追加に失敗:', error);
      throw error;
    }
  }

  // 付箋を更新
  static async updateNote(id: string, updates: Partial<StickyNote>): Promise<void> {
    try {
      await db.notes.update(id, { 
        ...updates, 
        updatedAt: new Date() 
      });
      console.log('付箋を更新しました:', id);
    } catch (error) {
      console.error('付箋の更新に失敗:', error);
      throw error;
    }
  }

  // 付箋を削除
  static async deleteNote(id: string): Promise<void> {
    try {
      await db.notes.delete(id);
      console.log('付箋を削除しました:', id);
    } catch (error) {
      console.error('付箋の削除に失敗:', error);
      throw error;
    }
  }

  // 🔧 修正：指定ボードの全付箋を削除
  static async clearAllNotes(boardId?: string): Promise<void> {
    try {
      if (boardId) {
        // 特定ボードの付箋のみ削除
        await db.notes.where('boardId').equals(boardId).delete();
        console.log('指定ボードの全付箋を削除しました:', boardId);
      } else {
        // 全ての付箋を削除（後方互換性）
        await db.notes.clear();
        console.log('全ての付箋を削除しました');
      }
    } catch (error) {
      console.error('付箋削除に失敗:', error);
      throw error;
    }
  }

  // 🔧 修正：指定ボード内でのテキスト検索
  static async searchNotes(keyword: string, boardId?: string): Promise<StickyNote[]> {
    try {
      let query = db.notes.filter(note => 
        note.text.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (boardId) {
        query = query.and(note => note.boardId === boardId);
      }
      
      return await query.toArray();
    } catch (error) {
      console.error('検索に失敗:', error);
      return [];
    }
  }

   // キャンバス状態を保存
  static async saveCanvasState(canvasState: Omit<CanvasState, 'id' | 'updatedAt'>): Promise<void> {
    try {
      const stateWithMeta = {
        id: 'main', // 固定ID
        ...canvasState,
        updatedAt: new Date()
      };
      
      await db.canvasState.put(stateWithMeta);
      console.log('キャンバス状態を保存しました:', stateWithMeta);
    } catch (error) {
      console.error('キャンバス状態の保存に失敗:', error);
      throw error;
    }
  }

  // キャンバス状態を取得
  static async getCanvasState(): Promise<CanvasState | null> {
    try {
      const state = await db.canvasState.get('main');
      if (state) {
        console.log('キャンバス状態を読み込みました:', state);
        return state;
      }
      return null;
    } catch (error) {
      console.error('キャンバス状態の読み込みに失敗:', error);
      return null;
    }
  }

  // 🔧 修正：指定ボードの描画線を取得
  static async getAllLines(boardId?: string): Promise<CanvasLine[]>{
    try {
      if (boardId) {
        // 特定ボードの描画線のみ取得
        const lines = await db.lines
          .where('boardId')
          .equals(boardId)
          .toArray();
        // 作成日時順にソート
        return lines.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else {
        // 全ての描画線を取得（後方互換性）
        return await db.lines.orderBy('createdAt').toArray();
      }
    } catch(error) {
      console.error("線描画の取得に失敗: ", error);
      return[];
    }
  }

  // 🔧 修正：ボードIDを必須にして描画線を追加
  static async addLine(line: Omit<CanvasLine, 'id'>, boardId: string): Promise<string>{
    try {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9); //重複回避
      const lineWithId = {
        ...line, 
        id,
        boardId // 明示的にboardIdを設定
      };
      await db.lines.add(lineWithId);
      console.log("線描画を追加しました: ", id, 'boardId:', boardId);
      return id;
    } catch (error) {
      console.error ("線描画の追加に失敗しました: ", error);
      throw error;
    }
  }

  // 線描画を削除（消しゴム用）
  static async deleteLine(id: string): Promise<void>{
    try {
      await db.lines.delete(id);
      console.log("線描画を削除しました: ", id);
    } catch(error) {
      console.error("線描画の削除に失敗しました: ", id);
      throw error;
    }
  }

  // 🔧 修正：指定ボードの全描画線を削除
  static async clearAllLines(boardId?: string): Promise<void> {
    try {
      if (boardId) {
        // 特定ボードの描画線のみ削除
        await db.lines.where('boardId').equals(boardId).delete();
        console.log("指定ボードの全描画線を削除しました: ", boardId);
      } else {
        // 全ての描画線を削除（後方互換性）
        await db.lines.clear();
        console.log("全ての線描画を削除しました: ");
      }
    } catch(error) {
      console.error("描画線削除に失敗しました", error);
      throw error;
    }
  }

  // 指定された範囲内の線描画を検索（消しゴム用機能）
  static async getLinesInArea(x: number, y: number, radius: number, boardId?: string): Promise<CanvasLine[]> {
    radius = 10;
    try{
      let allLines: CanvasLine[];
      
      if (boardId) {
        allLines = await db.lines.where('boardId').equals(boardId).toArray();
      } else {
        allLines = await db.lines.toArray();
      }
      
      return allLines.filter(line => {
        //各線の座標点が範囲内にあるかチェック
        for(let i = 0; i < line.points.length; i += 2){
          const pointX = line.points[i];
          const pointY = line.points[i + 1];
          const distance = Math.sqrt(Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2));

          if (distance <= radius) {
            return true;
          }
        } 
        return false;
      });
    } catch (error) {
      console.error("範囲内の描画取得に失敗", error);
      return [];
    }
  }
}

// 🔧 新規追加：ホワイトボード操作用の関数
export class WhiteboardService {
  
  // 全ボードを取得（更新日時順）
  static async getAllWhiteboards(): Promise<Whiteboard[]> {
    try {
      return await db.whiteboards
        .orderBy('updatedAt')
        .reverse() // 最新順
        .toArray();
    } catch (error) {
      console.error('ボード一覧の取得に失敗:', error);
      return [];
    }
  }

  // ボードを取得
  static async getWhiteboard(boardId: string): Promise<Whiteboard | null> {
    try {
      const board = await db.whiteboards.get(boardId);
      return board || null;
    } catch (error) {
      console.error('ボードの取得に失敗:', error);
      return null;
    }
  }

  // ボードを作成
  static async createWhiteboard(name: string, color?: string): Promise<string> {
    try {
      const id = 'board_' + Date.now().toString();
      
      // 🔧 修正：色が指定されなかった場合の処理
      let boardColor = color;
      if (!boardColor) {
        // 使用済み色を取得して重複を避ける
        const existingBoards = await this.getAllWhiteboards();
        const usedColors = existingBoards.map(board => board.color || 'blue');
        
        // ランダムな未使用色を選択
        //const { getRandomAvailableColor } = await import('../utils/boardColors.ts');
        boardColor = getRandomAvailableColor(usedColors);
      }
      
      const newBoard: Whiteboard = {
        id,
        name,
        color: boardColor, // 🔧 新規追加：色を設定
        createdAt: new Date(),
        updatedAt: new Date(),
        canvasState: {
          scale: 1.0,
          x: 0,
          y: 0
        }
      };
      
      await db.whiteboards.add(newBoard);
      console.log('新規ボードを作成しました:', id, name, 'color:', boardColor);
      return id;
    } catch (error) {
      console.error('ボード作成に失敗:', error);
      throw error;
    }
  }

  // ボードを更新
  static async updateWhiteboard(boardId: string, updates: Partial<Omit<Whiteboard, 'id'>>): Promise<void> {
    try {
      await db.whiteboards.update(boardId, {
        ...updates,
        updatedAt: new Date()
      });
      // console.log('ボードを更新しました:', boardId); // ← ログ削除
    } catch (error) {
      console.error('ボード更新に失敗:', error);
      throw error;
    }
  }

  // ボードを削除（関連データも削除）
  static async deleteWhiteboard(boardId: string): Promise<void> {
    try {
      // 1. 関連する付箋と描画線を削除
      await Promise.all([
        db.notes.where('boardId').equals(boardId).delete(),
        db.lines.where('boardId').equals(boardId).delete()
      ]);
      
      // 2. ボード自体を削除
      await db.whiteboards.delete(boardId);
      
      console.log('ボードとその関連データを削除しました:', boardId);
    } catch (error) {
      console.error('ボード削除に失敗:', error);
      throw error;
    }
  }

  // 🔧 修正：デフォルトボード作成（チュートリアル機能付き）
  static async createDefaultBoard(): Promise<string> {
    const defaultName = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).replace(/\//g, '/');
    
    const boardId = await this.createWhiteboard(defaultName, 'gray');
    
    // 🔧 新規追加：チュートリアル付箋作成フラグをチェック
    const shouldCreateTutorial = localStorage.getItem('should_create_tutorial') === 'true';
    console.log('🔍 チュートリアル作成フラグ:', shouldCreateTutorial); // デバッグ用
    
    if (shouldCreateTutorial) {
      console.log('🎯 チュートリアル付箋を作成します');
      await this.createTutorialNotes(boardId);
      localStorage.removeItem('should_create_tutorial'); // フラグをクリア
      console.log('✅ チュートリアル作成フラグをクリア');
    }
    
    return boardId;
  }

  // 🔧 新規追加：チュートリアル付箋作成メソッド
  static async createTutorialNotes(boardId: string): Promise<void> {
  try {
    console.log('📝 チュートリアル付箋作成開始:', boardId);
    console.log('📝 作成予定付箋数:', TUTORIAL_NOTES.length);
    console.log('作成予定描画線数：', TUTORIAL_LINES.length)
    
    for (let i = 0; i < TUTORIAL_NOTES.length; i++) {
      const tutorialNote = TUTORIAL_NOTES[i];
      
      const noteData = {
        text: tutorialNote.text,
        x: tutorialNote.x,
        y: tutorialNote.y,
        color: tutorialNote.color,
        boardId,
        createdAt: new Date(),
        updatedAt: new Date(),
        zIndex: 1000
      };
      
      // 🔧 修正：より確実なID生成（インデックス + ランダム値を追加）
      const uniqueId = `${tutorialNote.id}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 🔧 修正：ID重複チェック
      const existingNote = await db.notes.get(uniqueId);
      if (existingNote) {
        console.log('⚠️ ID重複をスキップ:', uniqueId);
        continue;
      }
      
      await NotesService.addNote(noteData, boardId);
      
      console.log('✅ チュートリアル付箋作成:', uniqueId, tutorialNote.text.substring(0, 20));
      
      // 🔧 新規追加：少し待機（ID重複を防ぐ）
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 🎯 新規追加：描画線作成
    for (let i = 0; i < TUTORIAL_LINES.length; i++) {
      const tutorialLine = TUTORIAL_LINES[i];
      
      const lineData = {
        points: tutorialLine.points,
        color: tutorialLine.color,
        strokeWidth: tutorialLine.strokeWidth,
        tool: tutorialLine.tool,
        boardId, // 🔧 動的なboardIdを設定
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const uniqueId = `${tutorialLine.id}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      
      await NotesService.addLine(lineData, boardId);
      
      console.log('✅ チュートリアル描画線作成:', uniqueId, tutorialLine.description);
      
      await new Promise(resolve => setTimeout(resolve, 5));
    }


    console.log('🎉 チュートリアル付箋作成完了');
    
  } catch (error) {
    console.error('❌ チュートリアル付箋作成に失敗:', error);
    throw error;
  }
}

  // デフォルトボードの確認・作成
  static async ensureDefaultBoard(): Promise<string> {
    try {
      // 既存のデフォルトボードを確認
      const allBoards = await db.whiteboards.toArray();
      const existingDefault = allBoards.find(board => board.isDefault === true);
      
      if (existingDefault?.id) {
        return existingDefault.id;
      }
      
      // デフォルトボードが無い場合は作成
      const boardId = await this.createDefaultBoard();
      
      // デフォルトフラグを設定
      await this.updateWhiteboard(boardId, { isDefault: true });
      
      return boardId;
    } catch (error) {
      console.error('デフォルトボードの確保に失敗:', error);
      throw error;
    }
  }

  // ボード切り替え用のデータを一括取得
  static async getBoardData(boardId: string): Promise<{
    board: Whiteboard;
    notes: StickyNote[];
    lines: CanvasLine[];
  } | null> {
    try {
      const [board, notes, lines] = await Promise.all([
        db.whiteboards.get(boardId),
        db.notes.where('boardId').equals(boardId).toArray(),
        db.lines.where('boardId').equals(boardId).toArray()
      ]);
      
      if (!board) {
        return null;
      }
      
      return { board, notes, lines };
    } catch (error) {
      console.error('ボードデータの取得に失敗:', error);
      return null;
    }
  }

  // 🔧 新規追加：チュートリアル完了チェック
  static async checkTutorialCompletion(boardId: string): Promise<boolean> {
    try {
      const notes = await NotesService.getAllNotes(boardId);
      const existingNoteIds = notes.map(note => note.id || '');
      
      // チュートリアル付箋がすべて削除されているかチェック
      const TUTORIAL_NOTE_IDS = TUTORIAL_NOTES.map(note => note.id);
      const hasTutorialNotes = TUTORIAL_NOTE_IDS.some(tutorialId => 
        existingNoteIds.some(existingId => existingId.includes(tutorialId))
      );
      
      if (!hasTutorialNotes && !localStorage.getItem('tutorial_completed')) {
        console.log('🎉 チュートリアル完了を検出');
        localStorage.setItem('tutorial_completed', 'true');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ チュートリアル完了チェックに失敗:', error);
      return false;
    }
  }
}