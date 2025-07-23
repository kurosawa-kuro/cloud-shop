import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white">
      <nav className="p-8">
        <ul className="space-y-1">
          <li><Link href="/" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">TOP</Link></li>
          <li><Link href="/products" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">検索バー</Link></li>
          <li><Link href="/developerTools" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">カート</Link></li>
          <li><Link href="/adminTools" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">ログイン/アカウント</Link></li>
          <li><Link href="/publicTools" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">カテゴリー</Link></li>
          <li><Link href="/products" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">注文一覧</Link></li>
          <li><Link href="/products" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">会員登録</Link></li>
          <li><Link href="/dev" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">開発者ツール</Link></li>
          <li><Link href="/admin" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">管理者ツール</Link></li>
          <li><Link href="/publicTools" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">パブリックツール</Link></li>
          <li><Link href="/sample" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">Auth</Link></li>
          <li><Link href="/sample" className="block py-2 px-3 hover:bg-gray-800 hover:text-blue-400">User</Link></li>
        </ul>
      </nav>
    </aside>
  );
}