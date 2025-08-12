// ReleaseNotesDialog.tsx - リリースノート表示ダイアログ

import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import releasesData from '../data/releases.json';
import type { ReleaseNoteWithNew } from '../types/releases';


interface ReleaseNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// リリースデータ処理クラス
class ReleaseManager {
  private data = releasesData;

  getCurrentVersion(): string {
    return this.data.currentVersion;
  }

  getAllReleases(): ReleaseNoteWithNew[] {
    return this.data.releases.map((note, _index) => ({
      ...note,
      isNew: note.version === this.data.currentVersion
    }));
  }

  getLatestRelease(): ReleaseNoteWithNew | null {
    const releases = this.getAllReleases();
    return releases.length > 0 ? releases[0] : null;
  }

  hasUnreadReleases(lastSeenVersion: string | null): boolean {
    if (!lastSeenVersion) return true;
    return lastSeenVersion !== this.data.currentVersion;
  }
}

// シングルトンインスタンス
const releaseManager = new ReleaseManager();

const ReleaseNotesDialog: React.FC<ReleaseNotesDialogProps> = ({
  isOpen,
  onClose
}) => {
    const releases = releaseManager.getAllReleases();
    const latestVersion = releaseManager.getCurrentVersion();
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(new Set([latestVersion]));

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
              お知らせ・更新
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
          {releases.map((note) => (
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
                  <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
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

export {releaseManager};
export default ReleaseNotesDialog;