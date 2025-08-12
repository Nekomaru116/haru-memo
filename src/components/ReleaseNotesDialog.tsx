// ReleaseNotesDialog.tsx - リリースノート表示ダイアログ

import React from 'react';
import { X, ChevronDown } from 'lucide-react';

interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
  isNew?: boolean;
}

interface ReleaseNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// リリースノートデータ（実際の運用では外部ファイルや設定から読み込み）
const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "v1.2.0",
    date: "2025-08-13",
    changes: [
      "リリースノート機能を追加",
      "ハンバーガーメニューに「お知らせ」ボタンを追加",
      "アップデート通知機能を実装"
    ],
    isNew: true
  },
  {
    version: "v1.1.0", 
    date: "2025-08-01",
    changes: [
      "検索機能の改善",
      "UI/UXの向上",
      "バグ修正"
    ]
  },
  {
    version: "v1.0.0",
    date: "2025-07-15", 
    changes: [
      "初回リリース",
      "基本的な付箋機能",
      "描画機能",
      "マルチボード機能"
    ]
  }
];

const ReleaseNotesDialog: React.FC<ReleaseNotesDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(new Set(['v1.2.0']));

  const toggleExpanded = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%'
              }}
            />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              お知らせ
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div
          style={{
            padding: '0',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 80px)'
          }}
        >
          {RELEASE_NOTES.map((note) => (
            <div
              key={note.version}
              style={{
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              {/* バージョンヘッダー */}
              <button
                onClick={() => toggleExpanded(note.version)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {note.isNew && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    {note.version}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    ({note.date})
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  style={{
                    transform: expandedVersions.has(note.version) ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* 変更内容 */}
              {expandedVersions.has(note.version) && (
                <div style={{ padding: '0 24px 16px 24px' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
                    {note.changes.map((change, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotesDialog;