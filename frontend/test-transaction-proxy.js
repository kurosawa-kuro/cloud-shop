#!/usr/bin/env node

/**
 * トランザクション系プロキシテストスクリプト
 * Cart Service、Orders Service、Payments Serviceとの連携をテストします
 */

const http = require('http');

// 設定
const FRONTEND_PORT = 3000;
const BACKEND_GATEWAY_PORT = 8072;

// テスト用のHTTPリクエスト関数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// テストケース
async function runTransactionTests() {
  console.log('🛒 トランザクション系プロキシテストを開始します...\n');

  // テスト用の認証トークン（模擬）
  const testAuthToken = 'Bearer test-token-12345';
  const testUserId = 'test-user-001';

  // 1. Backend Services Health Check
  console.log('1. Backend Services ヘルスチェック...');
  const services = [
    { name: 'Gateway', port: BACKEND_GATEWAY_PORT, path: '/actuator/health' },
    { name: 'Cart Service', port: 8084, path: '/actuator/health' },
    { name: 'Orders Service', port: 8085, path: '/actuator/health' },
    { name: 'Payments Service', port: 8086, path: '/actuator/health' }
  ];

  for (const service of services) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: service.port,
        path: service.path,
        method: 'GET',
        timeout: 5000
      });
      
      if (response.statusCode === 200) {
        console.log(`✅ ${service.name} は稼働中です`);
      } else {
        console.log(`⚠️  ${service.name} が応答しません (Status: ${response.statusCode})`);
      }
    } catch (error) {
      console.log(`❌ ${service.name} への接続に失敗:`, error.message);
    }
  }

  // 2. Cart API プロキシテスト
  console.log('\n2. Cart API プロキシテスト...');
  
  // 2.1 カート情報取得
  try {
    const cartResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/carts',
      method: 'GET',
      headers: {
        'Authorization': testAuthToken,
        'x-user-id': testUserId
      },
      timeout: 10000
    });
    
    console.log('   Cart GET Status:', cartResponse.statusCode);
    if (cartResponse.statusCode === 200) {
      const data = JSON.parse(cartResponse.data);
      if (data.isFallback) {
        console.log('   ⚠️  Cart フォールバック機能が動作しています');
      } else {
        console.log('   ✅ Cart API プロキシが正常に動作しています');
      }
    }
  } catch (error) {
    console.log('   ❌ Cart GET テストに失敗:', error.message);
  }

  // 2.2 カートに商品追加
  try {
    const addToCartResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/carts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': testAuthToken,
        'x-user-id': testUserId
      },
      timeout: 10000
    }, JSON.stringify({
      productId: 1,
      quantity: 2
    }));
    
    console.log('   Cart POST Status:', addToCartResponse.statusCode);
    if (addToCartResponse.statusCode === 201 || addToCartResponse.statusCode === 200) {
      const data = JSON.parse(addToCartResponse.data);
      if (data.isFallback) {
        console.log('   ⚠️  Cart 追加フォールバック機能が動作しています');
      } else {
        console.log('   ✅ Cart 追加 API プロキシが正常に動作しています');
      }
    }
  } catch (error) {
    console.log('   ❌ Cart POST テストに失敗:', error.message);
  }

  // 2.3 カートサマリー取得
  try {
    const summaryResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/carts/summary',
      method: 'GET',
      headers: {
        'Authorization': testAuthToken,
        'x-user-id': testUserId
      },
      timeout: 10000
    });
    
    console.log('   Cart Summary Status:', summaryResponse.statusCode);
    if (summaryResponse.statusCode === 200) {
      const data = JSON.parse(summaryResponse.data);
      if (data.isFallback) {
        console.log('   ⚠️  Cart Summary フォールバック機能が動作しています');
        console.log(`   小計: ${data.subtotal}円, 税込: ${data.total}円`);
      } else {
        console.log('   ✅ Cart Summary API プロキシが正常に動作しています');
      }
    }
  } catch (error) {
    console.log('   ❌ Cart Summary テストに失敗:', error.message);
  }

  // 3. Checkout API プロキシテスト
  console.log('\n3. Checkout API プロキシテスト...');
  
  // 3.1 チェックアウト準備
  try {
    const prepareResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/checkout/prepare',
      method: 'GET',
      headers: {
        'Authorization': testAuthToken,
        'x-user-id': testUserId
      },
      timeout: 10000
    });
    
    console.log('   Checkout Prepare Status:', prepareResponse.statusCode);
    if (prepareResponse.statusCode === 200) {
      const data = JSON.parse(prepareResponse.data);
      if (data.isFallback) {
        console.log('   ⚠️  Checkout Prepare フォールバック機能が動作しています');
      } else {
        console.log('   ✅ Checkout Prepare API プロキシが正常に動作しています');
      }
    }
  } catch (error) {
    console.log('   ❌ Checkout Prepare テストに失敗:', error.message);
  }

  // 3.2 チェックアウト確定（注意: 実際の注文が作成される可能性があります）
  console.log('   注意: チェックアウト確定テストはスキップします（実際の注文作成を避けるため）');

  // 4. Orders API プロキシテスト
  console.log('\n4. Orders API プロキシテスト...');
  
  try {
    const ordersResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/order',
      method: 'GET',
      headers: {
        'Authorization': testAuthToken,
        'x-user-id': testUserId
      },
      timeout: 10000
    });
    
    console.log('   Orders GET Status:', ordersResponse.statusCode);
    if (ordersResponse.statusCode === 200) {
      const data = JSON.parse(ordersResponse.data);
      if (data.isFallback) {
        console.log('   ⚠️  Orders フォールバック機能が動作しています');
        console.log(`   注文履歴件数: ${data.orders?.length || 0}件`);
      } else {
        console.log('   ✅ Orders API プロキシが正常に動作しています');
      }
    }
  } catch (error) {
    console.log('   ❌ Orders テストに失敗:', error.message);
  }

  // 5. 統合フローテスト
  console.log('\n5. 統合フローテスト（簡易）...');
  console.log('   完全なE2Eテストは実際のブラウザテストで実施してください');
  console.log('   フロー: 商品追加 → カート確認 → チェックアウト準備 → 注文履歴確認');
  
  let flowSuccess = true;
  const testFlow = [
    { name: 'カート情報取得', endpoint: '/api/carts', method: 'GET' },
    { name: 'カートサマリー', endpoint: '/api/carts/summary', method: 'GET' },
    { name: 'チェックアウト準備', endpoint: '/api/checkout/prepare', method: 'GET' },
    { name: '注文履歴取得', endpoint: '/api/order', method: 'GET' }
  ];

  for (const step of testFlow) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: FRONTEND_PORT,
        path: step.endpoint,
        method: step.method,
        headers: {
          'Authorization': testAuthToken,
          'x-user-id': testUserId
        },
        timeout: 5000
      });
      
      if (response.statusCode === 200) {
        console.log(`   ✅ ${step.name}: OK`);
      } else {
        console.log(`   ❌ ${step.name}: Status ${response.statusCode}`);
        flowSuccess = false;
      }
    } catch (error) {
      console.log(`   ❌ ${step.name}: ${error.message}`);
      flowSuccess = false;
    }
  }

  if (flowSuccess) {
    console.log('   🎉 統合フローテストが成功しました');
  } else {
    console.log('   ⚠️  統合フローテストで一部エラーが発生しました');
  }

  console.log('\n🏁 トランザクション系テスト完了');
  console.log('\n📋 次のステップ:');
  console.log('   1. Backend サービスを起動: cd /home/wsl/dev/cloud-shop/backend && make dev-core');
  console.log('   2. Frontend サーバーを起動: cd /home/wsl/dev/cloud-shop/frontend && npm run dev');
  console.log('   3. ブラウザで http://localhost:3000 にアクセス');
  console.log('   4. 実際のユーザーフローでテスト:');
  console.log('      - 商品をカートに追加');
  console.log('      - カート内容を確認');
  console.log('      - チェックアウト画面に進む');
  console.log('      - 注文履歴を確認');
  console.log('\n⚠️  注意事項:');
  console.log('   - フォールバック機能が動作している場合、マイクロサービスが停止している可能性があります');
  console.log('   - 実際の決済処理では十分なテストと検証が必要です');
  console.log('   - データ整合性の確認とバックアップを定期的に実施してください');
}

// メイン実行
if (require.main === module) {
  runTransactionTests().catch(console.error);
}

module.exports = { runTransactionTests };