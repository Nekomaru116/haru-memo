import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Circle, Eraser, SendHorizontal } from 'lucide-react';

type AppMode = 'note' | 'drawing';
type DrawingTool = 'pen_red' | 'pen_black' | 'eraser';

interface FloatingFooterProps {
  onAddMemo: (text: string) => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  keyboardHeight: number;
  isInputFocused: boolean;
}

const FloatingFooter: React.FC<FloatingFooterProps> = ({
  onAddMemo,
  mode,
  onModeChange,
  selectedTool,
  onToolChange
}) => {
  const [input, setInput] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(16);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
    const calculateCenterLowerPosition = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/.test(userAgent);
      
      if (!isMobile) {
        // PC: 従来通り
        return 30;
      }
      
      // モバイル: スクリーン下半分の中央を計算
      const windowHeight = window.innerHeight;
      
      // PWA検出（強化版）
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.matchMedia('(display-mode: fullscreen)').matches ||
                    window.matchMedia('(display-mode: minimal-ui)').matches ||
                    (window.navigator as any).standalone === true;
      
      
      
        // ブラウザ種別検出
      const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isChromeOrSafari = isChrome || isSafari;

      let calculatedOffset;

      if (isPWA) {
        // PWA: より下寄りの位置（操作しやすさ重視）
        calculatedOffset = Math.round(windowHeight * 0.15);
      }  else {
        // ブラウザ時
        if (isChromeOrSafari) {
          calculatedOffset = Math.round(windowHeight * 0.2); // Chrome/Safari ブラウザ
        } else {
          calculatedOffset = Math.round(windowHeight * 0.05); // その他のブラウザ
        }
      }
      
      // 安全な範囲に制限（PWA用に下限を調整）
      calculatedOffset = Math.max(60, Math.min(300, calculatedOffset));
      
      console.log('📱 PWA対応配置:', {
        isMobile,
        isPWA,
        windowHeight,
        calculatedOffset,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      });
      
      return calculatedOffset;
    };

    const updatePosition = () => {
      const newOffset = calculateCenterLowerPosition();
      setBottomOffset(newOffset);
    };

    // 初期計算
    updatePosition();

    // リサイズ時の再計算
    const handleResize = () => {
      updatePosition();
    };

    // キーボード検知（位置は変えず、キーボード分だけ上に）
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const keyboardHeight = window.innerHeight - window.
        visualViewport.height;
        setKeyboardOffset(Math.max(0, keyboardHeight));
      }
    };

    // PWA状態変更の監視
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      updatePosition();
    };

    // イベントリスナー設定
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  const getLineCount = (text: string): number => {
    return text.split('\n').length;
  };

  const lineCount = getLineCount(input);

  const getTextFieldStyle = () => {
    const baseHeight = 48;
    const lineHeight = 20;
    const maxLines = 4;
    
    const actualLines = Math.min(lineCount, maxLines);
    const height = baseHeight + (actualLines - 1) * lineHeight;

    return {
      height: `${height}px`,
      borderRadius: lineCount <= 1 ? '24px' : '16px',
      overflow: lineCount > maxLines ? 'auto' : 'visible' as const,
    };
  };

  const getFooterStyle = () => {
    const baseHeight = 64;
    const lineHeight = 20;
    const maxLines = 4;
    
    const actualLines = Math.min(lineCount, maxLines);
    const height = baseHeight + (actualLines - 1) * lineHeight;

    return {
      height: `${height}px`,
      borderRadius: lineCount <= 1 ? '32px' : '20px',
    };
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim()) {
      onAddMemo(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDrawingModeToggle = () => {
    onModeChange(mode === 'drawing' ? 'note' : 'drawing');
  };

  return (
    <>
      {/* 描画ツールバー */}
      {mode === 'drawing' && (
        <div
          style={{
            position: 'fixed',
            bottom: `${bottomOffset + 80 + keyboardOffset}px`,
            left: '16px',
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            borderRadius: '25px',
            padding: '8px 16px',
            zIndex: 1001,
            transition: 'bottom 0.3s ease',
          }}
        >
          <button onClick={() => onToolChange('pen_red')} style={{width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: selectedTool === 'pen_red' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'}}>
            <Circle size={20} color="#ef4444" fill={selectedTool === 'pen_red' ? '#ef4444' : 'none'} />
          </button>
          <button onClick={() => onToolChange('pen_black')} style={{width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: selectedTool === 'pen_black' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'}}>
            <Circle size={20} color="#000000" fill={selectedTool === 'pen_black' ? '#000000' : 'none'} />
          </button>
          <button onClick={() => onToolChange('eraser')} style={{width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: selectedTool === 'eraser' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'}}>
            <Eraser size={18} color="#9ca3af" />
          </button>
        </div>
      )}

      {/* メインフッター */}
      <div
        style={{
          position: 'fixed',
          bottom: `${bottomOffset + keyboardOffset}px`,
          left: '16px',
          right: '16px',
          ...getFooterStyle(),
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'stretch',
          gap: '12px',
          zIndex: 1000,
          transition: 'bottom 0.3s ease, height 0.2s ease, border-radius 0.2s ease',
        }}
      >
        <button onClick={handleDrawingModeToggle} style={{width: '48px', height: '48px', borderRadius: '50%', border: 'none', boxShadow: mode === 'drawing' ? '0 0px 0px rgba(0, 0, 0, 0.09)' : '0 8px 16px rgba(0, 0, 0, 0.09)', background: mode === 'drawing' ? 'rgba(100, 100, 100, 0.26)' : 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0, alignSelf: 'center'}}>
          <PenTool size={20} color={mode === 'drawing' ? '#FFF' : '#333'} />
        </button>

        <form onSubmit={handleSubmit} style={{flex: 1, display: 'flex', gap: '12px', alignItems: 'stretch', minWidth: 0}}>
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} placeholder="いま考えていることは..." style={{...getTextFieldStyle(), flex: 1, minWidth: 0, maxWidth: '100%', border: isFocused ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(131, 131, 131, 0.2)', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(5px)', color: '#333', fontSize: '14px', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '12px 16px', resize: 'none', outline: 'none', transition: 'all 0.2s ease', lineHeight: '20px', boxSizing: 'border-box'}} rows={1} />
          
          <button type="submit" disabled={!input.trim()} style={{width: '48px', height: '48px', borderRadius: '50%', border: 'none', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.09)', background: input.trim() ? 'rgba(34, 197, 94, 0.3)' : 'rgba(81, 90, 104, 0.2)', backdropFilter: 'blur(5px)', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0, alignSelf: 'center'}}>
            <SendHorizontal size={16} color={input.trim() ? '#22c55e' : '#64748b'} fill={input.trim() ? '#22c55e' : 'none'} />
          </button>
        </form>
      </div>

      {/* デバッグ情報削除済み - クリーンなUI */}
    </>
  );
};

export default FloatingFooter;