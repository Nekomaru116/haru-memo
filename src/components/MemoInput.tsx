import React, { useEffect, useState } from 'react';

interface MemoInputProps {
  onAddMemo: (text: string) => void;
}

const MemoInput: React.FC<MemoInputProps> = ({ onAddMemo }) => {
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // モバイルデバイスかどうかを判定
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase()
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // 768pxいかまたはタッチデバイス、またはモバイルUserAgentの場合はモバイル判定
      const mobileCheck = width <= 768 || isTouchDevice || /mobile|android|iphone|ipad|ipod/.test(userAgent);
      setIsMobile(mobileCheck);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // フォーム送信時のデフォルト動作を防ぐ
    if (input.trim()) { // 入力が空でない場合のみ
      onAddMemo(input.trim()); // 親コンポーネントのコールバックを呼び出す
      setInput(''); // 入力欄をクリア
    }
  };

 const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isMobile) {
        // スマホ・タブレット: Enterで改行（デフォルト動作）
        return;
      } else {
        // PC: Enterで改行、Shift+Enterで付箋作成
        if (e.shiftKey) {
          // Shift+Enter: 付箋作成
          e.preventDefault();
          handleSubmit();
        } else {
          // Enter: 改行（デフォルト動作）
          return;
        }
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-2 z-10 ">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isMobile 
                ? "思考を入力... (改行はReturnキー)" 
                : "思考を入力... (Enter: 改行 / Shift+Enter: 付箋作成)"
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[60px] max-h-[200px]"
            rows={4}
            autoFocus
          />
          
          {/* スマホ・タブレット用の付箋作成ボタン */}
          {isMobile && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[80px] h-fit self-start mt-1"
            >
              付箋
              <br />
              作成
            </button>
          )}
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {isMobile ? (
            <>モバイル： Returnキーで改行、「付箋作成」ボタンで付箋作成</>
          ) : (
            <>PC： Enterで改行、Shift+Enterで付箋作成</>
          )}
        </div>
      </form>
    </div>
  );
};

export default MemoInput;