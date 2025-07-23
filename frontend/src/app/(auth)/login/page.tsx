'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { authAPI } from '@/lib/api/client';

interface User {
  userId: string;
  email: string;
}

const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Attempting login with:", { email, password });
      const data = await authAPI.login(email, password);
      
      console.log("Login response:", data);

      if (data.success) {
        useAuthStore.getState().setUser(data.user as User);
        router.push('/products');
      } else {
        setError(data.error as string || 'ログインに失敗しました');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('ログインに失敗しました');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    handleSubmit
  };
};

const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, handleSubmit } = useLoginForm();

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      
      {error && (
        <div className="bg-red-500 text-white p-4 mb-4 rounded">
          {error}
        </div>
      )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow w-1/2">
        <h1 className="text-2xl font-bold mb-6 text-white">ログイン</h1>
        <p className="text-gray-300 mb-6">アカウントにログインしてください</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              パスワード
            </label>
            <input
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            ログイン
          </button>

          <div className="text-center">
            <Link href="/register" className="text-blue-400 text-sm hover:text-blue-300">
              アカウントをお持ちでない方はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;