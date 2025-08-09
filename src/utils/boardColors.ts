// utils/boardColors.ts - ボードカラーシステム（グレー追加版）

export interface BoardColorTheme {
  id: string;
  name: string;
  bg: string;      // 背景色
  border: string;  // ボーダー色
  emoji: string;   // 絵文字アイコン
}

// 🎨 利用可能なボードカラーテーマ（グレーを追加）
export const BOARD_COLOR_THEMES: BoardColorTheme[] = [
  { id: 'gray', name: 'グレー', bg: '#a1a1a1ff', border: '#5e5e5eff', emoji: '⚫' }, // 🔧 新規追加：グレーを先頭に
  { id: 'red', name: '赤', bg: '#ef4444', border: '#dc2626', emoji: '🔴' },
  { id: 'blue', name: '青', bg: '#3b82f6', border: '#2563eb', emoji: '🔵' },
  { id: 'green', name: '緑', bg: '#10b981', border: '#059669', emoji: '🟢' },
  { id: 'orange', name: 'オレンジ', bg: '#f59e0b', border: '#d97706', emoji: '🟠' },
  { id: 'purple', name: '紫', bg: '#8b5cf6', border: '#7c3aed', emoji: '🟣' },
  { id: 'pink', name: 'ピンク', bg: '#ec4899', border: '#db2777', emoji: '🩷' },
  { id: 'cyan', name: 'シアン', bg: '#06b6d4', border: '#0891b2', emoji: '🔵' },
  { id: 'lime', name: 'ライム', bg: '#84cc16', border: '#65a30d', emoji: '🟢' },
  { id: 'yellow', name: '黄', bg: '#eab308', border: '#ca8a04', emoji: '🟡' },
  { id: 'indigo', name: 'インディゴ', bg: '#6366f1', border: '#4f46e5', emoji: '🔵' },
  { id: 'teal', name: 'ティール', bg: '#14b8a6', border: '#0d9488', emoji: '🔷' },
  { id: 'rose', name: 'ローズ', bg: '#f43f5e', border: '#e11d48', emoji: '🌹' }
];

// 🎨 カラーIDからテーマを取得
export const getBoardColorTheme = (colorId: string): BoardColorTheme => {
  return BOARD_COLOR_THEMES.find(theme => theme.id === colorId) || BOARD_COLOR_THEMES[0]; // 🔧 修正：デフォルトはグレー
};

// 🎨 使用済み色を除外して利用可能な色を取得（重複許可により削除）
// export const getAvailableColors = (usedColors: string[]): BoardColorTheme[] => {
//   return BOARD_COLOR_THEMES.filter(theme => !usedColors.includes(theme.id));
// };

// 🎨 全色を利用可能として返す（重複許可）
export const getAllAvailableColors = (): BoardColorTheme[] => {
  return BOARD_COLOR_THEMES;
};

// 🔧 修正：新規ボード作成時はデフォルトでグレーを返す
export const getDefaultBoardColor = (): string => {
  return 'gray';
};

// 🔧 既存関数は互換性のため残すが、重複を許可するよう修正
export const getRandomAvailableColor = (_usedColors: string[]): string => {
  // 重複を許可するため、全色からランダム選択
  return BOARD_COLOR_THEMES[Math.floor(Math.random() * BOARD_COLOR_THEMES.length)].id;
};

// 🎨 ボード名から色をハッシュ生成（重複許可により簡略化）
export const getColorFromBoardName = (boardName: string, _usedColors: string[]): string => {
  let hash = 0;
  for (let i = 0; i < boardName.length; i++) {
    const char = boardName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  return BOARD_COLOR_THEMES[Math.abs(hash) % BOARD_COLOR_THEMES.length].id;
};

// 🎨 色の人気度による推奨色（重複許可により全色を推奨）
export const getRecommendedColors = (_usedColors: string[]): BoardColorTheme[] => {
  const recommendedOrder = ['gray', 'blue', 'green', 'red', 'orange', 'purple', 'pink', 'cyan', 'yellow']; // グレーを先頭に
  
  // 推奨順序で並び替え
  const sorted = [...BOARD_COLOR_THEMES].sort((a, b) => {
    const aIndex = recommendedOrder.indexOf(a.id);
    const bIndex = recommendedOrder.indexOf(b.id);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return sorted;
};