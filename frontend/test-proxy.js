#!/usr/bin/env node

/**
 * プロキシ化テストスクリプト
 * Backend Gatewayとの連携をテストします
 */

const http = require('http');

// 設定
const FRONTEND_PORT = 3000;
const BACKEND_GATEWAY_PORT = 8072;

// テスト用のHTTPリクエスト関数
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// テストケース
async function runTests() {
  console.log('🚀 プロキシ化テストを開始します...\n');

  // 1. Backend Gateway Health Check
  console.log('1. Backend Gateway ヘルスチェック...');
  try {
    const gatewayHealth = await makeRequest({
      hostname: 'localhost',
      port: BACKEND_GATEWAY_PORT,
      path: '/actuator/health',
      method: 'GET',
      timeout: 5000
    });
    
    if (gatewayHealth.statusCode === 200) {
      console.log('✅ Backend Gateway は稼働中です');
    } else {
      console.log('❌ Backend Gateway が応答しません (Status:', gatewayHealth.statusCode, ')');
    }
  } catch (error) {
    console.log('❌ Backend Gateway への接続に失敗:', error.message);
    console.log('   Backend Gatewayが起動していることを確認してください');
    console.log('   コマンド: cd /home/wsl/dev/cloud-shop/backend && make dev-core\n');
  }

  // 2. Frontend Health Check
  console.log('2. Frontend サーバーヘルスチェック...');
  try {
    const frontendHealth = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000
    });
    
    if (frontendHealth.statusCode === 200) {
      console.log('✅ Frontend サーバーは稼働中です');
    } else {
      console.log('❌ Frontend サーバーが応答しません (Status:', frontendHealth.statusCode, ')');
    }
  } catch (error) {
    console.log('❌ Frontend サーバーへの接続に失敗:', error.message);
    console.log('   Frontend サーバーが起動していることを確認してください');
    console.log('   コマンド: cd /home/wsl/dev/cloud-shop/frontend && npm run dev\n');
  }

  // 3. Products API プロキシテスト
  console.log('3. Products API プロキシテスト...');
  try {
    const productsResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/products',
      method: 'GET',
      timeout: 10000
    });
    
    console.log('Status Code:', productsResponse.statusCode);
    
    if (productsResponse.statusCode === 200) {
      const data = JSON.parse(productsResponse.data);
      if (data.isFallback) {
        console.log('⚠️  フォールバック機能が動作しています');
        console.log('   Backend Products Service (8083) が稼働していない可能性があります');
      } else {
        console.log('✅ Products API プロキシが正常に動作しています');
      }
    } else {
      console.log('❌ Products API プロキシでエラーが発生しました');
    }
  } catch (error) {
    console.log('❌ Products API プロキシテストに失敗:', error.message);
  }

  // 4. Product Search プロキシテスト
  console.log('4. Product Search プロキシテスト...');
  try {
    const searchResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/products/search?q=test',
      method: 'GET',
      timeout: 10000
    });
    
    console.log('Status Code:', searchResponse.statusCode);
    
    if (searchResponse.statusCode === 200) {
      const data = JSON.parse(searchResponse.data);
      if (data.isFallback) {
        console.log('⚠️  検索フォールバック機能が動作しています');
      } else {
        console.log('✅ Product Search プロキシが正常に動作しています');
      }
    } else {
      console.log('❌ Product Search プロキシでエラーが発生しました');
    }
  } catch (error) {
    console.log('❌ Product Search プロキシテストに失敗:', error.message);
  }

  console.log('\n🏁 テスト完了');
  console.log('\n📋 次のステップ:');
  console.log('   1. Backend サービスを起動: cd /home/wsl/dev/cloud-shop/backend && make dev-core');
  console.log('   2. Frontend サーバーを起動: cd /home/wsl/dev/cloud-shop/frontend && npm run dev');
  console.log('   3. ブラウザで http://localhost:3000 にアクセス');
  console.log('   4. 商品一覧・検索機能をテスト');
}

// メイン実行
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };