// utils/dataValidator.ts - データ検証によるセキュリティ強化

/**
 * ボードIDの妥当性検証
 * @param id 検証対象のID
 * @returns 妥当なボードIDかどうか
 */
export const isValidBoardId = (id: unknown): id is string => {
  return typeof id === 'string' && 
         id.length > 0 && 
         id.length <= 50 && 
         /^board_\d+$/.test(id);
};

/**
 * 付箋テキストの妥当性検証
 * @param text 検証対象のテキスト
 * @returns 妥当な付箋テキストかどうか
 */
export const isValidNoteText = (text: unknown): text is string => {
  return typeof text === 'string' && 
         text.length <= 10000; // 最大文字数制限
};

/**
 * ボード名の妥当性検証（実用性重視）
 * @param name 検証対象の名前
 * @returns 妥当なボード名かどうか
 */
export const isValidBoardName = (name: unknown): name is string => {
  if (typeof name !== 'string') {
    return false;
  }
  
  return name.length >= 1 && 
         name.length <= 100 && 
         !/\0/.test(name) && // ヌル文字のみチェック
         !/<script[^>]*>/i.test(name) && // scriptタグのみチェック
         !/javascript:/i.test(name); // javascriptプロトコルのみチェック
};

/**
 * 色指定の妥当性検証
 * @param color 検証対象の色
 * @returns 妥当な色指定かどうか
 */
export const isValidColor = (color: unknown): color is string => {
  if (typeof color !== 'string') {
    return false;
  }
  
  // 許可された色のみ
  const allowedColors = [
    'yellow', 'pink', 'orange', 'blue', 'green', 'purple', 'gray',
    'red', 'cyan', 'lime', 'indigo', 'teal', 'rose'
  ];
  
  return allowedColors.includes(color);
};

/**
 * 座標値の妥当性検証
 * @param coord 検証対象の座標
 * @returns 妥当な座標かどうか
 */
export const isValidCoordinate = (coord: unknown): coord is number => {
  return typeof coord === 'number' && 
         isFinite(coord) && 
         coord >= -100000 && 
         coord <= 100000; // 極端な値を制限
};

/**
 * zIndexの妥当性検証
 * @param zIndex 検証対象のzIndex
 * @returns 妥当なzIndexかどうか
 */
export const isValidZIndex = (zIndex: unknown): zIndex is number => {
  return typeof zIndex === 'number' && 
         Number.isInteger(zIndex) && 
         zIndex >= 0 && 
         zIndex <= 9999;
};

/**
 * キャンバス状態の妥当性検証
 * @param canvasState 検証対象のキャンバス状態
 * @returns 妥当なキャンバス状態かどうか
 */
export const isValidCanvasState = (canvasState: any): boolean => {
  if (!canvasState || typeof canvasState !== 'object') {
    return false;
  }
  
  return isValidCoordinate(canvasState.x) &&
         isValidCoordinate(canvasState.y) &&
         typeof canvasState.scale === 'number' &&
         canvasState.scale >= 0.1 &&
         canvasState.scale <= 10;
};

/**
 * 描画ポイントの妥当性検証
 * @param points 検証対象のポイント配列
 * @returns 妥当なポイント配列かどうか
 */
export const isValidDrawingPoints = (points: unknown): points is number[] => {
  if (!Array.isArray(points)) {
    return false;
  }
  
  // 点数制限（DoS攻撃防止）
  if (points.length > 10000) {
    return false;
  }
  
  return points.every(point => isValidCoordinate(point));
};

/**
 * 検索クエリの妥当性検証
 * @param query 検証対象のクエリ
 * @returns 妥当な検索クエリかどうか
 */
export const isValidSearchQuery = (query: unknown): query is string => {
  return typeof query === 'string' && 
         query.length <= 200;
};