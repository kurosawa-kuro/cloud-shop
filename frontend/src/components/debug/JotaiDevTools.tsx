// // (developerTools)/components/JotaiDevTools.tsx
// 'use client';
// import { useAtomCallback } from 'jotai/utils';
// import { cartAtom, userAtom, searchFilterAtom } from '@/store/atoms';

// export const JotaiDevTools = () => {
//   // アトムの値を監視
//   const cart = useAtom(cartAtom);
//   const user = useAtom(userAtom);
//   const filter = useAtom(searchFilterAtom);

//   if (process.env.NODE_ENV === 'production') return null;

//   return (
//     <div className="fixed top-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg w-80 opacity-90 hover:opacity-100">
//       <h3 className="text-lg font-bold mb-2">Jotai DevTools</h3>
      
//       <div className="space-y-4">
//         <div>
//           <h4 className="font-semibold">カート状態</h4>
//           <pre className="text-xs">{JSON.stringify(cart, null, 2)}</pre>
//         </div>
        
//         <div>
//           <h4 className="font-semibold">ユーザー状態</h4>
//           <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
//         </div>

//         <div>
//           <h4 className="font-semibold">検索/フィルター</h4>
//           <pre className="text-xs">{JSON.stringify(filter, null, 2)}</pre>
//         </div>
        
//         <div className="flex space-x-2">
//           <button 
//             className="bg-red-500 px-2 py-1 rounded text-sm"
//             onClick={() => resetCart()}>
//             カートリセット
//           </button>
//           <button 
//             className="bg-blue-500 px-2 py-1 rounded text-sm"
//             onClick={() => addTestItems()}>
//             テストアイテム追加
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };