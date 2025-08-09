// components/TermsDialog.tsx - 利用規約表示ダイアログ

import React from 'react';
import { X, ScrollText } from 'lucide-react';

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsDialog: React.FC<TermsDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // 🔧 修正：書式を保った利用規約JSX要素として定義
  const renderTermsContent = () => (
  <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
        ひらめきボード 利用規約
      </h2>
      <p style={{ margin: '8px 0', fontSize: '14px' }}>
        <strong>制定日：</strong> 2025年 8月 8日<br />
        <strong>最終更新日：</strong> 2025年 8月 8日
      </p>
    </div>

    <p style={{ marginBottom: '16px', textAlign: 'justify' }}>
      この利用規約（以下「本規約」）は, ｵﾃﾃﾔﾜﾗｶｶﾆ（以下, 「運営者」）がこのウェブサイト上で提供するサービス（以下, 「本サービス」）の利用条件を定めるものです。本サイトを利用するすべての方（以下, 「利用者」）には, 本規約にしたがって本サービスを利用するものとします。
    </p>

    <p style={{ marginBottom: '24px', textAlign: 'justify' }}>
      本サービスへの初回アクセス時に表示されるダイアログ内の「同意して始める」ボタンを、利用者がクリックないしはタップすることで本規約に同意したものとみなします。本規約に同意しない場合は、本サービスの利用もしくは本サイトへのアクセスを中止しなければなりません。
    </p>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第1条（適用）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本規約は, 利用者と運営者との間の本サービスの利用に関する一切の関係に適用されるものとします。</li>
        <li style={{ marginBottom: '8px' }}>運営者は本サービスに関し, 本規約のほか, ご利用にあたってのルール等, 各種の定め（以下, 「個別規定」）をすることがあります。これら個別規定はその名称の如何にかかわらず, 本規約の一部を構成するものとします。</li>
        <li style={{ marginBottom: '8px' }}>本規約の規定が個別規定の規定と矛盾する場合には, 個別規定において特段の定めがない限り, 個別規定の規定が優先されるものとします。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第2条（定義）</strong>
      </h3>
      <p style={{ marginBottom: '8px' }}>本規約において, 以下の用語は次の意味で使用します。</p>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '4px' }}>「本サイト」：ひらめきボード - アイデア前駆体収集器 -</li>
        <li style={{ marginBottom: '4px' }}>「本サービス」：本サイトを通じて提供される一切のサービス</li>
        <li style={{ marginBottom: '4px' }}>「運営者」：本サイトの開発・運営を行う個人</li>
        <li style={{ marginBottom: '4px' }}>「利用者」：本サイトを利用するすべての方</li>
        <li style={{ marginBottom: '4px' }}>「コンテンツ」：利用者が本サービスを利用して入力, 作成, 保存した付箋のテキスト, 描画データ, ボード, その他一切のデータ</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第3条（本サービスの性質・目的）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}><strong>学習目的での開発</strong>: 本サービスは, 運営者の技術学習および研究目的で開発されたものです。</li>
        <li style={{ marginBottom: '8px' }}><strong>生成AIの使用</strong>: 本サービスの開発において, 一部工程で生成AI（Claude, Gemini）を使用しています。</li>
        <li style={{ marginBottom: '8px' }}><strong>ベータ版としての提供</strong>: 本サービスはベータ版であり, 機能の変更, 追加, 削除が予告なく行われることがあります。また, 動作に不具合が含まれる可能性があります。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第4条（第三者ソフトウェア）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>
          本サービスは, 以下のオープンソースソフトウェアを使用しています：
          <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>React (MIT License)</li>
            <li>Konva (MIT License)</li>
            <li>Dexie (Apache License 2.0)</li>
            <li>Lucide React (MIT License)</li>
          </ol>
        </li>
        <li style={{ marginBottom: '8px' }}>これらのライブラリの著作権は各権利者に帰属し、それぞれのライセンス条項に従って使用されています。</li>
        <li style={{ marginBottom: '8px' }}>各ライブラリの詳細なライセンス情報は、アプリ内の「このアプリについて」→「ライセンス」から確認できます。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第5条（利用許諾）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li>運営者は, 利用者に対し, 本規約に従うことを条件として, 本サービスを非独占的に利用する権利を許諾します。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第6条（禁止事項）</strong>
      </h3>
      <p style={{ marginBottom: '8px' }}>利用者は, 本サービスの利用にあたり, 以下の行為をしてはなりません：</p>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '4px' }}>法令または公序良俗に違反する行為</li>
        <li style={{ marginBottom: '4px' }}>犯罪行為に関連する行為</li>
        <li style={{ marginBottom: '4px' }}>本サービスの複製, 配布, 販売, 貸与, その他運営者の許可なく商業的に利用する行為</li>
        <li style={{ marginBottom: '4px' }}>運営者, 他の利用者, またはその他第三者のサーバーまたはネットワークの機能を破壊したり, 妨害したりする行為</li>
        <li style={{ marginBottom: '4px' }}>不正アクセスをし, またはこれを試みる行為</li>
        <li style={{ marginBottom: '4px' }}>他の利用者に関する個人情報等を収集または蓄積する行為</li>
        <li style={{ marginBottom: '4px' }}>本サービスの他の利用者に不利益, 損害を与える行為</li>
        <li style={{ marginBottom: '4px' }}>本サービスに関連して, 反社会的勢力に対して直接または間接に利益を供与する行為</li>
        <li style={{ marginBottom: '4px' }}>その他, 運営者が不適切と判断する行為</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第7条（プライバシー）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}><strong>利用者情報の非収集</strong>: 運営者は, 本サービスを通じて利用者の個人情報や利用者が作成したコンテンツを収集, 閲覧, 外部へ送信することはありません。</li>
        <li style={{ marginBottom: '8px' }}><strong>ローカル保存</strong>: すべてのデータは, 利用者が本サービスを利用した端末のブラウザ内にのみ保存されます。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第8条（PWAとしての性質）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本サービスはPWA（プログレッシブウェブアプリ）技術に対応しており, 利用者の端末に「インストール」することができます。</li>
        <li style={{ marginBottom: '8px' }}>「インストール」された場合でも, 本サービスはネイティブアプリケーションではなく, 実体はブラウザのサンドボックス環境で動作するウェブアプリケーションです。これにより, 端末のファイルシステムやOSの深い領域にアクセスすることはありません。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第9条（免責事項）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '12px' }}>
          <strong>包括的免責</strong>: 運営者は, 本サービスの利用により利用者に生じたいかなる損害についても, 一切の責任を負いません。利用者は, 自己の責任において本サービスを利用するものとします。
        </li>
        <li style={{ marginBottom: '12px' }}>
          <strong>データに関する免責</strong>: 本サービスは利用者の端末内ローカルストレージ（IndexedDB）にデータを保存しており, 以下の事象等によるデータの消失・破損について, 運営者は一切の責任を負いません。利用者は, 重要なデータについて, 必ず自身でバックアップを取ることを強く推奨します。
          <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>ブラウザのキャッシュクリア, 設定リセット, アンインストール</li>
            <li>ブラウザ, OS, 端末のアップデートによる互換性問題</li>
            <li>端末の故障, 紛失, 初期化</li>
            <li>ブラウザのストレージ容量不足による自動削除</li>
          </ol>
        </li>
        <li style={{ marginBottom: '12px' }}>
          <strong>コンテンツに関する免責</strong>: 利用者が本サービスで作成・保存するコンテンツについて, 第三者の権利侵害（著作権, 商標権, プライバシー権等）や, それに伴う法的責任はすべて利用者が負うものとし, 運営者は一切関与せず, 責任を負いません。
        </li>
        <li style={{ marginBottom: '12px' }}>
          <strong>セキュリティに関する免責</strong>: 第三者による不正アクセス, サイバー攻撃, マルウェア感染等によって利用者に損害が生じた場合でも, 一切の責任を負いません。
          <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>利用者は適切なセキュリティ対策（端末保護、ブラウザソフトウェア更新、端末のオペレーティングシステム更新等）を講じるものとします。</li>
          </ol>
        </li>
        <li style={{ marginBottom: '12px' }}>
          <strong>共有端末での利用に関する免責</strong>: 学校, 図書館, ネットカフェ等の共有端末で本サービスを利用した際に生じる, 情報の漏洩, データの消失, 第三者によるアクセス等の一切の問題について, 運営者は責任を負いません。
          <ol style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>利用者が共有端末で本サービスを利用する際は、利用後にデータを削除する等、適切な策を講じるものとします。</li>
          </ol>
        </li>
        <li style={{ marginBottom: '12px' }}>
          <strong>重要データ利用に関する免責</strong>: 本サービスは学習・研究目的で開発されたものであり, 商用目的, 業務用途, 企業の重要情報, 顧客情報, その他消失した場合に重大な影響を及ぼすデータの保存に利用したことによるいかなる損害についても, 運営者は責任を負いません。
        </li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第10条（保証の否認）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本サービスは「現状有姿（あるがままの状態）」で提供され, 運営者は, 本サービスの完全性, 正確性, 有用性, 特定目的への適合性, 動作の安定性, セキュリティ, エラーや瑕疵が存在しないこと, データが消失しないこと等について, 明示的か黙示的かを問わず, 一切の保証をしません。</li>
        <li style={{ marginBottom: '8px' }}>利用者は自らの責任において本サービスを利用するものとし、本サービスの利用に関連して行われた一切の行為及びその結果、損害について、その責任は利用者が負うものとします。</li>
        <li style={{ marginBottom: '8px' }}>運営者は、本サービスの品質、性能、機能について保証しません。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第11条（利用者の責任）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>利用者は、自己の責任において本サービスを利用するものとします。</li>
        <li style={{ marginBottom: '8px' }}>重要なデータは必ず定期的なバックアップを取るものとします。</li>
        <li style={{ marginBottom: '8px' }}>利用者は、本サービスの利用により第三者に損害を与えた場合、自己の責任で解決するものとします。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第12条（サービスの変更・終了）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>運営者は、利用者への事前通知なく、本サービスの内容を変更、追加、削除することができます。</li>
        <li style={{ marginBottom: '8px' }}>運営者は、利用者への事前通知なく、本サービスを終了することができます。</li>
        <li style={{ marginBottom: '8px' }}>サービス終了時のデータ移行・返却は保証されません。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第13条（本規約の変更）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>運営者は、必要に応じて本規約を変更することができます。</li>
        <li style={{ marginBottom: '8px' }}>変更後の規約は、本サービス内での表示により効力を生じるものとします。</li>
        <li style={{ marginBottom: '8px' }}>利用者が変更後も本サービスを継続利用した場合、変更後の規約に同意したものとみなします。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第14条（準拠法・管轄裁判所）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本規約の成立、解釈、履行および紛争の解決には、日本法を適用するものとします。</li>
        <li style={{ marginBottom: '8px' }}>本規約または本サービスに起因する一切の紛争については、 東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第15条（分離可能性）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本規約のいずれかの条項またはその一部が, 法令等により無効または執行不能と判断された場合であっても, 本規約の残りの規定及び一部が無効または執行不能と判断された規定の残りの部分は, 継続して完全に効力を有するものとします。</li>
      </ol>
    </div>

    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
        <strong>第16条（完全条項）</strong>
      </h3>
      <ol style={{ paddingLeft: '20px', margin: 0 }}>
        <li style={{ marginBottom: '8px' }}>本規約は、本サービスの利用に関する利用者と運営者の間の完全な合意を構成し、本サービスの利用に関する従前の口頭または書面による合意に代わるものとします。</li>
      </ol>
    </div>

    <div style={{ textAlign: 'center', margin: '32px 0 24px 0' }}>
      <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>以上</p>
    </div>

    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
      <p style={{ margin: '4px 0' }}>Claudeは, 米Anthropic PBCの商標または登録商標です。</p>
      <p style={{ margin: '4px 0' }}>Geminiは, Google LLCの米国およびその他の国における商標または登録商標です。</p>
    </div>
  </div>
);

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
          zIndex: 10002, // WelcomeDialogより上
          backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      >
        {/* ダイアログ本体 */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ScrollText size={24} color="#333" />
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: 0
                }}
              >
                利用規約
              </h1>
            </div>
            
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              style={{
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
          </div>

          {/* スクロール可能なコンテンツエリア */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 8px',
              marginBottom: '20px'
            }}
          >
            {renderTermsContent()}
          </div>

          {/* フッター */}
          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              paddingTop: '16px',
              textAlign: 'center'
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2d46c5ff 0%, #567ec8ff 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(45, 70, 197, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(45, 70, 197, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(45, 70, 197, 0.4)';
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsDialog;