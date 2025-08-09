import React, { useState, useCallback } from 'react';
import AppIcon from './AppIcon'
import { X, Heart, Twitter, CodeXml, BookAlert, Download } from 'lucide-react';
// LicenseNotices のインポートを削除

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleDebugMode: () => void;
  onShowLicenses: () => void; // 🔧 新規追加：ライセンス表示のコールバック
  onShowPWAInstall: () =>void;
  onShowTerms: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({
  isOpen,
  onClose,
  onToggleDebugMode,
  onShowLicenses, // 🔧 新規追加
  onShowPWAInstall,
  onShowTerms
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  // showLicenses 状態を削除

  // アプリ名クリック処理（隠しコマンド）
  const handleAppNameClick = useCallback(() => {
    const now = Date.now();
    
    // 1秒以内の連続クリックのみカウント
    if (now - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(now);
    
    console.log('🔍 アプリ名クリック:', { clickCount: clickCount + 1 });
    
    // 5回クリックで隠しコマンド発動
    if (clickCount + 1 >= 5) {
      console.log('🎉 隠しコマンド発動！デバッグモード切り替え');
      onToggleDebugMode();
      setClickCount(0); // リセット
      
      // 簡単な視覚フィードバック
      const appNameElement = document.querySelector('.app-name-secret');
      if (appNameElement) {
        appNameElement.classList.add('secret-activated');
        setTimeout(() => {
          appNameElement?.classList.remove('secret-activated');
        }, 1000);
      }
    }
  }, [clickCount, lastClickTime, onToggleDebugMode]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景オーバーレイ */}
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
          zIndex: 10000,
          backdropFilter: 'blur(5px)'
        }}
        onClick={onClose}
      >
        {/* ダイアログ本体 */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} color="#666" />
          </button>

          {/* アプリアイコン */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <AppIcon 
              size={80} 
              variant="rounded"
              style={{
                margin: '0 auto 16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            />

            {/* アプリ名（隠しコマンド対象） */}
            <h1
              className="app-name-secret"
              onClick={handleAppNameClick}
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 8px 0',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                padding: '8px',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ひらめきボード
            </h1>
            
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              アイデア前駆体収集器
            </p>
          </div>

          {/* バージョン情報 */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#666',
                fontWeight: '600'
              }}
            >
              Version 1.0.0
               <span
              style={{
                marginLeft: '4px',
                padding: '2px 6px',
                backgroundColor: '#dbdbdbff', // 背景色（注意喚起ボックスに合わせた黄色）
                color: '#8a8a8aff',       // テキスト色
                borderRadius: '6px',     // 角丸
                fontWeight: '600',       // 少し太字に
                fontSize: '10px'         // 少し小さくしてバランス調整
              }}
            >
              Beta
               </span>
            </div>
          </div>

          {/* 説明文 */}
          <div style={{ marginBottom: '24px', lineHeight: '1.6'}}>

            <p style={{ color: '#555', margin: '0 0 0px 0', textAlign: 'center'  }}>
              1秒でも早くあなたの脳内からアイデアの結晶核を取り出し、アイデアが溶けるのを防ぎましょう！
            </p>
          </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {/* 🔧 修正：ライセンスボタンを独立した動作に変更 */}
              <button
                onClick={onShowPWAInstall} // 🔧 修正：親コンポーネントのコールバックを呼び出し
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#555',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <Download size ={16} />
                インストール
              </button>
            </div>

          {/* 主な機能 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#333', margin: '12px 0 12px 0' }}>
              特徴
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
              <li>付箋の作成・編集</li>
              <li>ペンと消しゴムによる自由描画</li>
              <li>複数のボード</li>
              <li>設計とコーディングの一部過程に生成AI(Claude・Gemini)を使用しています</li>
            </ul>
          </div>

          {/* 制作者情報 */}
          <div style={{ 
            borderTop: '1px solid #e5e7eb', 
            paddingTop: '20px',
            textAlign: 'center' 
          }}>
            <p style={{ 
              color: '#666', 
              margin: '0 0 12px 0',
              fontSize: '14px'
            }}>
              <Heart size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              作成者: ｵﾃﾃﾔﾜﾗｶｶﾆ & Claude
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={onShowTerms} // 🔧 修正：親コンポーネントのコールバックを呼び出し
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#555',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <BookAlert size ={16} />
                規約
              </button>
              {/* 🔧 修正：ライセンスボタンを独立した動作に変更 */}
              <button
                onClick={onShowLicenses} // 🔧 修正：親コンポーネントのコールバックを呼び出し
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#555',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <CodeXml size ={16} />
                ライセンス
              </button>
              
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#555',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                onClick={() => window.open('https://x.com/NekomaruSanDesu', '_blank')}
              >
                <Twitter size={16} />
                X
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 隠しコマンド用CSS */}
      <style>{`
        .secret-activated {
          animation: secretPulse 1s ease-out;
          background: linear-gradient(135deg,  #2d46c5ff 0%, #567ec8ff 100% 100%) !important;
          color: white !important;
          transform: scale(1.05);
        }
        
        @keyframes secretPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default AboutDialog;