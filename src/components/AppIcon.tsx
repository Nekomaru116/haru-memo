// components/AppIcon.tsx - アプリアイコンコンポーネント

import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'rounded' | 'circle';
}

const AppIcon: React.FC<AppIconProps> = ({
  size = 64,
  className = '',
  style = {},
  variant = 'rounded'
}) => {
  // バリアント別のスタイル
  const getVariantStyle = (): React.CSSProperties => {
    const baseStyle = {
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'cover' as const,
      ...style
    };

    switch (variant) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%'
        };
      case 'rounded':
        return {
          ...baseStyle,
          borderRadius: `${size * 0.2}px` // 20%の角丸
        };
      case 'default':
      default:
        return baseStyle;
    }
  };

  // サイズに応じて最適な画像を選択
  const getOptimalImagePath = (): string => { //それぞれ一回り大きめ
    if (size <= 32) return '/icons/app-icon-48.png';
    if (size <= 48) return '/icons/app-icon-64.png';
    if (size <= 64) return '/icons/app-icon-80.png';
    if (size <= 80) return '/icons/app-icon-192.png'; 
    if (size <= 192) return 'icons/app-icon-512.png';
    return '/icons/app-icon-512.png';
  };

  return (
    <img
      src={getOptimalImagePath()}
      alt="ホワイトボードアプリ"
      className={className}
      style={getVariantStyle()}
      onError={(e) => {
        // 画像読み込みエラー時のフォールバック
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        
        // フォールバック用のdivを作成
        const fallback = document.createElement('div');
        fallback.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: ${variant === 'circle' ? '50%' : variant === 'rounded' ? `${size * 0.2}px` : '0'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size * 0.4}px;
          color: white;
        `;
        fallback.textContent = '🗂️';
        
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
};

export default AppIcon;