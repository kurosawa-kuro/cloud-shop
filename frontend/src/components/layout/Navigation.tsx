'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';

export default function Navigation() {
  const email = useAuthStore((state) => state.user.email);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { href: '/', label: 'TOP' },
    { href: '/products', label: '商品一覧' },
    { href: '/chatbot', label: '問い合わせ（人工知能）' },
  ];

  // ログイン済みの場合のみカートと注文履歴リンクを追加
  if (email) {
    menuItems.push({ href: '/carts', label: 'カート' });
    menuItems.push({ href: '/order', label: '注文履歴' });
  }

// クライアントサイドでの呼び出し例
const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (searchQuery.trim()) {
    try {
     await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      // 検索結果の処理
    } catch (error) {
      console.error('検索エラー:', error);
    }
  }
};

  return (
    <nav className="container mx-auto bg-gray-900">
      <ul className="flex flex-wrap gap-4 list-none p-4 items-center justify-center">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link 
              href={item.href}
              className="hover:text-blue-500 transition-colors"
              prefetch={true}
            >{item.label}</Link>
          </li>
        ))}
        <li>
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="商品を検索..."
              className="bg-gray-700 text-white px-3 py-1 rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded-r-md hover:bg-blue-700 transition-colors"
            >
              検索
            </button>
          </form>
        </li>
        {!email ? (
          <>
            <li>
              <Link 
                href="/login"
                className="hover:text-blue-500 transition-colors"
                prefetch={true}
              >
                ログイン
              </Link>
            </li>
            <li>
              <Link 
                href="/register"
                className="hover:text-blue-500 transition-colors"
                prefetch={true}
              >
                ユーザー登録
              </Link>
            </li>
          </>
        ) : (
          <>
            <li className="ml-2 text-gray-400">
              {email}
            </li>
            <li>
              <Link 
                href="/logout"
                className="hover:text-blue-500 transition-colors"
                prefetch={true}
              >
                ログアウト
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
} 