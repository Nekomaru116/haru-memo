// components/PWAInstallDialog.tsx - PWAインストール推奨ダイアログ（単一ページ版）

import React, { useState, useEffect } from 'react';
import AppIcon from './AppIcon';
import { X, Download, Smartphone, Monitor, Share, Expand, Wind, WifiOff, Laugh, SquarePlus, Grid2X2Plus } from 'lucide-react';

/**
 * @interface PWAInstallDialogProps
 * @description このコンポーネントが受け取るpropsの型定義です。
 */
interface PWAInstallDialogProps {
  isOpen: boolean;    // ダイアログの表示状態
  onClose: () => void;  // ダイアログを閉じる（完了）際に呼び出される関数
  onSkip: () => void;   // ダイアログをスキップする際に呼び出される関数 (Xボタンや背景クリック)
}

/**
 * @function getDeviceType
 * @description ユーザーのデバイス種類をユーザーエージェントから判定します。
 * @returns {object} デバイス情報（iOS, Android, Mobile, Desktop）を含むオブジェクト。
 */
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid;
  
  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop: !isMobile
  };
};

/**
 * @function usePWAInstall
 * @description PWAのインストール関連のロジックをカプセル化するカスタムフックです。
 * @returns {object} インストール可能性(`isInstallable`)とインストール実行関数(`handleInstall`)を返します。
 */
const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return false;
    try {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      }
    } catch (error) {
      console.error('PWAインストールエラー:', error);
    }
    return false;
  };

  return { isInstallable, handleInstall };
};


/**
 * @component PWAInstallDialog
 * @description PWAのインストールメリットと手順を1ページで表示するダイアログコンポーネント。
 */
const PWAInstallDialog: React.FC<PWAInstallDialogProps> = ({
  isOpen,
  onClose,
  onSkip
}) => {
  const device = getDeviceType();
  const { isInstallable, handleInstall } = usePWAInstall();

  // isOpenがfalseなら何も表示しない
  if (!isOpen) return null;

  /**
   * @function handleAutoInstall
   * @description Android Chromeで「今すぐインストール」ボタンが押された時の処理。
   */
  const handleAutoInstall = async () => {
    const success = await handleInstall();
    if (success) {
      // インストールが成功したらダイアログを閉じる
      onClose();
    }
    // 失敗した場合（ユーザーがキャンセルした場合など）は、ダイアログは開いたままにする。
    // ユーザーは手動インストールのガイドをそのまま参照できます。
  };

  /**
   * @function getInstallSteps
   * @description デバイスの種類に応じて、表示するインストール手順の配列を生成して返します。
   */
  const getInstallSteps = () => {
  if (device.isIOS) {
    return [
      { 
        step: 1, 
        icon: <Share size={24} />, 
        title: '共有ボタンをタップ', 
        description: (
          <span>
            Safariの下部にある共有ボタン（<Share size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />）をタップしてください
          </span>
        ), 
        image: '/screenshots/ios-step1.png' 
      },
      { 
        step: 2, 
        icon: <SquarePlus size={24} />, 
        title: 'ホーム画面に追加', 
        description: (
          <span>
            メニューから「ホーム画面に追加」（<SquarePlus size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />）を選択してください
          </span>
        ), 
        image: '/screenshots/ios-step2.png' 
      },
      { 
        step: 3, 
        icon: <Download size={24} />, 
        title: 'インストール完了', 
        description: '「追加」ボタンをタップして完了です', 
        image: '/screenshots/ios-step3.png' 
      }
    ];
  } else if (device.isAndroid) {
    return [
      { 
        step: 1, 
        icon: <Download size={24} />, 
        title: 'インストールボタン', 
        description: (
          <span>
            ブラウザのアドレスバーに表示される「インストール」ボタン（<Download size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />）をタップ
          </span>
        ), 
        image: '/screenshots/android-step1.png' 
      },
      { 
        step: 2, 
        icon: <Smartphone size={24} />, 
        title: 'インストール確認', 
        description: '「インストール」ダイアログで「インストール」をタップ', 
        image: '/screenshots/android-step2.png' 
      }
    ];
  } else {
    return [
      { 
        step: 1, 
        icon: <Download size={24} />, 
        title: 'インストールアイコン', 
        description: (
          <span>
            アドレスバーの右側にあるインストールアイコン（<Grid2X2Plus size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />）をクリック
          </span>
        ), 
        image: '/screenshots/desktop-step1.png' 
      },
      { 
        step: 2, 
        icon: <Monitor size={24} />, 
        title: 'アプリとしてインストール', 
        description: '「インストール」ボタンをクリックして完了', 
        image: '/screenshots/desktop-step2.png' 
      }
    ];
  }
};

  const installSteps = getInstallSteps();

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10002, backdropFilter: 'blur(8px)'
        }}
        onClick={onSkip} // 背景クリックでスキップ
      >
        {/* ダイアログ本体 */}
        <div
          style={{
            backgroundColor: 'white', borderRadius: '20px', padding: '32px',
            maxWidth: '480px', width: '90%', maxHeight: '80vh',
            overflowY: 'auto', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            position: 'relative', textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()} // ダイアログ内のクリックが伝播するのを防ぐ
        >
          {/* 閉じるボタン */}
          <button
            onClick={onSkip}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', border: 'none', background: 'transparent',
              borderRadius: '50%', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} color="#666" />
          </button>

          {/* ----- ここからが統合されたコンテンツ ----- */}
          
          {/* 1. PWA紹介セクション */}
          <AppIcon 
              size={80} 
              variant="rounded"
              style={{
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0 0 16px 0' }}>
            いつでもそばに
          </h1>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            はるメモ をアプリ（PWA）としてスマートフォンやPCにインストールすることで、より快適にご利用いただけます。（強く推奨）
          </p>
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', margin: '24px 0', textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 12px 0', textAlign: 'center' }}>
              インストールのメリット
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Expand size={20}/><span style={{ fontSize: '14px', color: '#555' }}>全画面でとても見やすく！</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Wind size={20}/><span style={{ fontSize: '14px', color: '#555' }}>素早いアクセスで真の”脳直”メモを</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><WifiOff size={20}/><span style={{ fontSize: '14px', color: '#555' }}>省サイズ・オフラインでも利用可能に</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Laugh size={20}/><span style={{ fontSize: '14px', color: '#555' }}>とてもおすすめ！</span></div>
            </div>
          </div>
          
          {/* 区切り線 */}
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

          {/* 2. インストール手順セクション */}
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: '0 0 24px 0' }}>
            {device.isIOS ? 'iPhone/iPad' : device.isAndroid ? 'Android' : 'PC'}でのインストール手順
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {installSteps.map((step) => (
              <div key={step.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', textAlign: 'left', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '32px', height: '32px', background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                    {step.step}
                  </div>
                  <div style={{ color: '#667eea' }}>{step.icon}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>{step.title}</h3>
                  <p style={{ fontSize: '14px', color: '#666', margin: '0 0 12px 0', lineHeight: '1.5' }}>{step.description}</p>
                  <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img 
                    src={step.image} 
                    alt={`${step.title}の手順画像`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa'
                    }}
                    onError={(e) => {
                      // 画像読み込みエラー時のフォールバック
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.style.cssText = `
                        width: 100%; 
                        height: 100%; 
                        background: #e5e7eb; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: #9ca3af; 
                        font-size: 12px;
                        text-align: center;
                      `;
                      fallback.innerHTML = `スクリーンショット<br/>(${step.image})`;
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. ボタンセクション */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
            {/* PWAがインストール可能で、かつAndroidデバイスの場合のみ「今すぐインストール」ボタンを表示 */}
            {isInstallable && device.isAndroid && (
              <button
                onClick={handleAutoInstall}
                style={{
                  padding: '16px 24px', border: 'none', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Download size={20} />
                今すぐインストール
              </button>
            )}
            
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px', border: '1px solid #d1d5db',
                borderRadius: '12px', background: 'white', color: '#666',
                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              閉じる
            </button>
          </div>
          {/* ----- コンテンツここまで ----- */}

        </div>
      </div>
    </>
  );
};

export default PWAInstallDialog;