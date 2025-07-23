'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
import { authAPI } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

export default function LogoutPage() {
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    const logout = async () => {
      // 認証状態をクリア
      clearUser();

      await authAPI.logout();

      // トップページにリダイレクト
      router.push('/');
    };

    logout();
  }, [clearUser, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>ログアウト中...</p>
    </div>
  );
} 