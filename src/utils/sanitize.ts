// utils/sanitize.ts - セキュリティ対策：XSS防止のためのサニタイゼーション関数

/**
 * 基本的なHTMLエスケープ処理
 * @param text エスケープ対象のテキスト
 * @returns エスケープされたテキスト
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * 表示用テキストのサニタイズ（改行保持・実用性重視）
 * @param text 表示対象のテキスト
 * @returns サニタイズされたテキスト
 */
export const sanitizeForDisplay = (text: string): string => {
  if (typeof text !== 'string') {
    console.warn('⚠️ sanitizeForDisplay: 非文字列データを受信:', typeof text);
    return '';
  }
  
  // 最大文字数制限（DoS攻撃防止）
  if (text.length > 10000) {
    console.warn('⚠️ テキストが最大文字数を超過:', text.length);
    text = text.substring(0, 10000) + '...';
  }
  
  // 危険なタグとスクリプトのみ無効化（通常の記号は保持）
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, '[スクリプトタグが除去されました]')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '[iframeタグが除去されました]')
    .replace(/<object[^>]*>.*?<\/object>/gi, '[objectタグが除去されました]')
    .replace(/<embed[^>]*>/gi, '[embedタグが除去されました]')
    .replace(/javascript:/gi, 'blocked:')
    .replace(/on\w+\s*=/gi, 'blocked=') // onclick, onload等
    .replace(/\0/g, ''); // ヌル文字のみ除去
};

/**
 * ボード名用サニタイズ（実用性重視）
 * @param name 名前文字列
 * @returns サニタイズされた名前
 */
export const sanitizeBoardName = (name: string): string => {
  if (typeof name !== 'string') {
    console.warn('⚠️ sanitizeBoardName: 非文字列データを受信:', typeof name);
    return 'Untitled Board';
  }
  
  // 長さ制限
  if (name.length > 100) {
    name = name.substring(0, 100);
  }
  
  // 危険なパターンのみ除去（XSS攻撃を想定）
  name = name
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // scriptタグ
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // iframeタグ
    .replace(/javascript:/gi, '') // javascriptプロトコル
    .replace(/on\w+\s*=/gi, '') // イベントハンドラー
    .replace(/\0/g, ''); // ヌル文字
  
  // 空文字列の場合はデフォルト名
  if (!name.trim()) {
    return 'Untitled Board';
  }
  
  return name.trim();
};

/**
 * 検索クエリのサニタイズ
 * @param query 検索クエリ
 * @returns サニタイズされたクエリ
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== 'string') {
    return '';
  }
  
  // 検索クエリの長さ制限
  if (query.length > 200) {
    query = query.substring(0, 200);
  }
  
  // 特殊文字のエスケープ（ただし検索に影響しない程度）
  return sanitizeText(query.trim());
};