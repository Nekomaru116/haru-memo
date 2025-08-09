import React from 'react';
import AppIcon from './AppIcon';
// Lucideアイコンをインポート
import { Paintbrush, Search, BookAlert, StickyNote, Layers3, TriangleAlert } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onShowTerms: () => void;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  isOpen,
  onAccept,
  onDecline,
  onShowTerms
}) => {
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
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          backdropFilter: 'blur(8px)'
        }}
        onClick={onDecline}
      >
        {/* ダイアログ本体 */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* アプリアイコン */}
          <AppIcon 
              size={80} 
              variant="rounded"
              style={{
                margin: '0 auto 24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            />

          {/* タイトル */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 16px 0'
            }}
          >
            ようこそ！
          </h1>

          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'normal',
              color: '#666',
              margin: '0 0 24px 0'
            }}
          >
            ひらめきボード
          </h2>

          {/* 説明文 */}
          <div style={{ marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
            <div style={{ color: '#555', margin: '0 0 24px 0', fontSize: '16px' }}>
              <p style={{ margin: 0 }}>思いつきを逃がさない、</p>
              <p style={{ margin: 0 }}>アイデア前駆体収集器。</p>
            </div>
            
            {/* --- ここから修正箇所 --- */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              {/* 付箋メモ */}
              <div style={{ textAlign: 'center', width: '80px' }}>
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <StickyNote size={28} color="#4a5568" strokeWidth={1.5} />
                </div>
                <div>付箋メモ</div>
              </div>
              {/* 自由描画 */}
              <div style={{ textAlign: 'center', width: '80px' }}>
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Paintbrush size={28} color="#4a5568" strokeWidth={1.5} />
                </div>
                <div>自由描画</div>
              </div>
              {/* 複数ボード */}
              <div style={{ textAlign: 'center', width: '80px' }}>
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Layers3 size={28} color="#4a5568" strokeWidth={1.5} />
                </div>
                <div>ボード達</div>
              </div>
              {/* 検索機能 */}
              <div style={{ textAlign: 'center', width: '80px' }}>
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Search size={28} color="#4a5568" strokeWidth={1.5} />
                </div>
                <div>検索</div>
              </div>
            </div>
            {/* --- ここまで修正箇所 --- */}
          </div>
            
          {/* 免責事項 */}
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '16px',
              padding: '16px',
              margin: '24px 0',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <TriangleAlert size={22} color = "rgba(162, 154, 6, 1)" strokeWidth={3}/>
              <strong style={{ color: '#856404', fontSize: '14px' }}>重要事項</strong>
            </div>
            <p
              style={{
                color: '#856404',
                margin: '0',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
             <div style={{ color: '#856404', margin: '0 0 5 0', fontSize: '14px' }}>
              <p style={{ margin: 1 }}>●アプリの利用開始前に利用規約に同意してください。</p>
              <p style={{ margin: 1 }}>●このアプリは学習目的で開発されました。データの破損や消滅による損害への責任は負いかねます。</p>
              <p style={{ margin: 1 }}>●私的利用のみに限られます。</p>
              <p style={{ margin: 1 }}>●あなたが作成したすべてのデータは、利用している端末内にのみ保存されます。運営者はあなたの大切なアイデアたちを覗き見たり、外部に送信することはありません。</p>
            </div>
            </p>
          </div>
          {/* 利用規約ボタン */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={onShowTerms}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                background: 'white',
                color: '#555',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <BookAlert size={16} />
              利用規約を読む
            </button>
          </div>
          {/* ボタン群 */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '16px' // 若干調整
            }}
          >
            <button
              onClick={onDecline}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                background: 'white',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              キャンセル
            </button>
            
            <button
              onClick={onAccept}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2d46c5ff 0%, #567ec8ff 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '120px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              同意して始める
            </button>
          </div>

          {/* バージョン情報 */}
          <div
            style={{
              marginTop: '24px',
              fontSize: '11px',
              color: '#999',
              textAlign: 'center'
            }}
          >
            Version 1.0.0
             {/* 「Beta」をspanで囲み、スタイルを適用 */}
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
      </div>
    </>
  );
};

export default WelcomeDialog;