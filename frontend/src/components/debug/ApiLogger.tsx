// // components/debug/ApiLogger.tsx
// 'use client';
// export const ApiLogger = () => {
//   if (process.env.NODE_ENV === 'production') return null;

//   return (
//     <div className="fixed bottom-0 right-0 p-4 bg-gray-800 text-white">
//       <h3>API Calls Log</h3>
//       {/* APIコールのログ表示 */}
//     </div>
//   );
// };

// // types/api.ts
// interface ApiLog {
//     id: string;
//     timestamp: number;
//     method: string;
//     url: string;
//     requestData?: any;
//     responseData?: any;
//     status?: number;
//     duration: number;
//     error?: string;
//   }
  
//   // store/apiLogger.ts
//   import { atom } from 'jotai';
  
//   export const apiLogsAtom = atom<ApiLog[]>([]);
  
//   // utils/apiLogger.ts
//   export const interceptFetch = () => {
//     const originalFetch = window.fetch;
    
//     window.fetch = async (...args) => {
//       const start = performance.now();
//       const [url, config] = args;
//       const id = Math.random().toString(36).substring(7);
      
//       // リクエストのログを記録
//       const log: ApiLog = {
//         id,
//         timestamp: Date.now(),
//         method: config?.method || 'GET',
//         url: url.toString(),
//         requestData: config?.body ? JSON.parse(config.body as string) : undefined,
//         duration: 0
//       };
  
//       try {
//         const response = await originalFetch(...args);
//         const duration = performance.now() - start;
        
//         // レスポンスのクローンを作成（Stream を2回読むため）
//         const clone = response.clone();
//         const responseData = await clone.json();
  
//         // ログを更新
//         log.responseData = responseData;
//         log.status = response.status;
//         log.duration = duration;
  
//         // グローバルなログ配列に追加
//         window.dispatchEvent(new CustomEvent('apiLog', { detail: log }));
  
//         return response;
//       } catch (error) {
//         log.error = error.message;
//         log.duration = performance.now() - start;
        
//         window.dispatchEvent(new CustomEvent('apiLog', { detail: log }));
//         throw error;
//       }
//     };
//   };
  
//   // components/debug/ApiLogger.tsx
//   'use client';
//   import { useEffect, useState } from 'react';
//   import { useAtom } from 'jotai';
//   import { apiLogsAtom } from '@/store/apiLogger';
//   import { interceptFetch } from '@/utils/apiLogger';
  
//   export const ApiLogger = () => {
//     const [isExpanded, setIsExpanded] = useState(false);
//     const [logs, setLogs] = useAtom(apiLogsAtom);
//     const [selectedLog, setSelectedLog] = useState<string | null>(null);
  
//     useEffect(() => {
//       interceptFetch();
      
//       const handleApiLog = (event: CustomEvent<ApiLog>) => {
//         setLogs(prev => [event.detail, ...prev].slice(0, 50)); // 最新50件のみ保持
//       };
  
//       window.addEventListener('apiLog', handleApiLog as EventListener);
//       return () => window.removeEventListener('apiLog', handleApiLog as EventListener);
//     }, []);
  
//     if (process.env.NODE_ENV === 'production') return null;
  
//     return (
//       <div className={`fixed bottom-0 right-0 p-4 bg-gray-800 text-white rounded-tl-lg transition-all duration-300 ${
//         isExpanded ? 'w-96 h-96' : 'w-48 h-12'
//       }`}>
//         <div className="flex justify-between items-center mb-2">
//           <h3 className="font-bold">API Calls Log</h3>
//           <button
//             onClick={() => setIsExpanded(!isExpanded)}
//             className="text-gray-400 hover:text-white"
//           >
//             {isExpanded ? '縮小' : '拡大'}
//           </button>
//         </div>
  
//         {isExpanded && (
//           <div className="overflow-auto h-[calc(100%-3rem)]">
//             <div className="space-y-2">
//               {logs.map(log => (
//                 <div
//                   key={log.id}
//                   className={`p-2 rounded cursor-pointer hover:bg-gray-700 ${
//                     selectedLog === log.id ? 'bg-gray-700' : 'bg-gray-900'
//                   }`}
//                   onClick={() => setSelectedLog(log.id === selectedLog ? null : log.id)}
//                 >
//                   <div className="flex justify-between text-sm">
//                     <span className={`font-mono ${
//                       log.error ? 'text-red-400' : 'text-green-400'
//                     }`}>
//                       {log.method} {new URL(log.url).pathname}
//                     </span>
//                     <span className="text-gray-400">
//                       {log.duration.toFixed(0)}ms
//                     </span>
//                   </div>
                  
//                   {selectedLog === log.id && (
//                     <div className="mt-2 text-xs">
//                       <div className="mb-1">
//                         <div className="text-gray-400">Request:</div>
//                         <pre className="overflow-auto">
//                           {JSON.stringify(log.requestData || {}, null, 2)}
//                         </pre>
//                       </div>
//                       <div>
//                         <div className="text-gray-400">Response:</div>
//                         <pre className="overflow-auto">
//                           {JSON.stringify(log.responseData || {}, null, 2)}
//                         </pre>
//                       </div>
//                       {log.error && (
//                         <div className="text-red-400 mt-1">
//                           Error: {log.error}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };