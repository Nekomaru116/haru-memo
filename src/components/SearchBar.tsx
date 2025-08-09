import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  resultCount: number;
  currentIndex: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  onClearSearch, 
  isSearchActive, 
  resultCount, 
  currentIndex 
}) => {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  const handleClear = () => {
    setKeyword('');
    onClearSearch();
  };

  return (
    <div 
      className={`fixed top-2 right-2 z-20 transition-all duration-300 ${
        isSearchActive ? 'w-80' : 'w-64' // 検索がアクティブな場合は幅を広げる
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="付箋を検索..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!keyword.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300"
          >
            検索
          </button>
          {isSearchActive && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 focus:outline-none"
            >
              ✕
            </button>
          )}
        </div>
      </form>
      
      {/* 検索結果の表示 */}
      {isSearchActive && (
        <div className="mt-3 text-sm text-gray-600">
          {resultCount > 0 ? (
            <span>
              {resultCount}件見つかりました ({currentIndex + 1}/{resultCount})
            </span>
          ) : (
            <span>該当する付箋が見つかりません</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;