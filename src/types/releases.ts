// types/releases.ts - リリースノート関連の型定義

export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
}

export interface ReleaseNoteWithNew extends ReleaseNote {
  isNew: boolean;
}

export interface ReleasesData {
  currentVersion: string;
  releases: ReleaseNote[];
}

// バージョン比較のヘルパー型
export type VersionString = `v${number}.${number}.${number}`;

// リリース管理用のユーティリティ型
export interface ReleaseManager {
  getCurrentVersion: () => string;
  getAllReleases: () => ReleaseNoteWithNew[];
  getLatestRelease: () => ReleaseNoteWithNew | null;
  hasUnreadReleases: (lastSeenVersion: string | null) => boolean;
}