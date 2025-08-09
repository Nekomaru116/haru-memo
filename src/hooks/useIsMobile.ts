import { useState, useEffect } from 'react';

// この値より画面幅が小さければモバイルと判定
const MOBILE_BREAKPOINT = 768; 

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    // コンポーネントがアンマウントされた時にイベントリスナーを削除
    return () => window.removeEventListener('resize', handleResize);
  }, []); // 空の依存配列で、初回レンダリング時にのみ実行

  return isMobile;
};