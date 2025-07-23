'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// チャットメッセージの型定義
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Page() {
  // チャット履歴の状態管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // 初期メッセージを設定（クライアントサイドのみ）
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'こんにちは！どのようなご質問がありますか？',
        timestamp: new Date(),
      }]);
    }
  }, [messages.length]);
  
  // 入力メッセージの状態管理
  const [inputMessage, setInputMessage] = useState('');
  
  // 送信中の状態管理
  const [isLoading, setIsLoading] = useState(false);
  
  // チャット履歴の参照
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // チャット履歴が更新されたら自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // メッセージ送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;
    
    // ユーザーメッセージをチャット履歴に追加
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // APIリクエスト用のメッセージ形式に変換
      const apiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      console.log('Sending messages to API:', apiMessages);
      
      // APIエンドポイントにリクエスト
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });
      
      console.log('API response status:', response.status);
      
      const responseData = await response.json();
      console.log('API response data:', responseData);
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status} - ${responseData.message || 'Unknown error'}`);
      }
      
      // レスポンスの構造を確認し、適切にデータを取り出す
      const aiResponseContent = responseData.data?.response || 
                               responseData.response || 
                               'レスポンスの形式が不正です。';
      
      // AIの応答をチャット履歴に追加
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // エラーメッセージをチャット履歴に追加
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'すみません、メッセージの処理中にエラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 時刻のフォーマット関数
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mt-2 mb-6 px-4 text-white">問い合わせ（人工知能）</h1>
      
      {/* チャットメッセージ表示エリア */}
      <div 
        ref={chatContainerRef}
        className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4 h-[60vh] overflow-y-auto"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 relative mr-2">
                    <Image
                      src="/system/chatbot.png"
                      alt="AI Assistant"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="font-semibold">AI アシスタント</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs opacity-70 mt-1 text-right">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* ローディングインジケーター */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-700 rounded-lg p-3 flex items-center">
              <div className="w-6 h-6 relative mr-2">
                <Image
                  src="/system/chatbot.png"
                  alt="AI Assistant"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* メッセージ入力フォーム */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="メッセージを入力してください..."
          className="flex-1 p-3 rounded-l-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`p-3 rounded-r-lg ${
            isLoading || !inputMessage.trim()
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={isLoading || !inputMessage.trim()}
        >
          送信
        </button>
      </form>
    </div>
  );
}

export const dynamic = 'force-dynamic';