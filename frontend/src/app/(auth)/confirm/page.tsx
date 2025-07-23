'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api/client';

// 確認フォームのコンポーネントを分離
function ConfirmForm() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 確認コードのバリデーション
    if (!/^\d{6}$/.test(code)) {
      setError('確認コードは6桁の数字で入力してください');
      return;
    }

    try {
      await authAPI.confirm(email, code);
      router.push('/login');
    } catch (err: unknown) {
      console.error('Confirmation error:', err);
      if (err instanceof Error) {
        // Cognitoのエラーメッセージをユーザーフレンドリーに変換
        if (err.name === 'CodeMismatchException') {
          setError('確認コードが正しくありません。再度お試しください。');
        } else {
          setError(err.message || '確認コードの検証に失敗しました');
        }
      } else {
        setError('予期せぬエラーが発生しました');
      }
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      {error && (
        <div className="bg-red-500 text-white p-4 mb-4 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow w-1/2">
        <h1 className="text-2xl font-bold mb-6 text-white">メールアドレスの確認</h1>
        <p className="text-gray-300 mb-6">
          {email} に送信された確認コードを入力してください
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              確認コード
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500"
              placeholder="123456"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            確認
          </button>
        </form>
      </div>
    </div>
  );
}

// メインのページコンポーネント
export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmForm />
    </Suspense>
  );
}