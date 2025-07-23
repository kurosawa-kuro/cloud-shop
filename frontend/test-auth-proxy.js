#!/usr/bin/env node

/**
 * 認証系プロキシテストスクリプト
 * Backend Auth Serviceとの連携をテストします
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
async function runAuthTests() {
  console.log('🔐 認証系プロキシテストを開始します...\n');

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

  // 2. Auth Service Health Check (via Gateway)
  console.log('2. Auth Service ヘルスチェック...');
  try {
    const authHealth = await makeRequest({
      hostname: 'localhost',
      port: BACKEND_GATEWAY_PORT,
      path: '/auth/health', // Gatewayを経由してAuth Serviceのヘルスチェック（仮想パス）
      method: 'GET',
      timeout: 5000
    });
    
    if (authHealth.statusCode === 200) {
      console.log('✅ Auth Service は稼働中です');
    } else {
      console.log('⚠️  Auth Service が応答しません (Status:', authHealth.statusCode, ')');
      console.log('   フォールバック機能が動作する可能性があります');
    }
  } catch (error) {
    console.log('⚠️  Auth Service への接続に失敗:', error.message);
    console.log('   フォールバック機能が動作する可能性があります');
  }

  // 3. Register API プロキシテスト
  console.log('3. Register API プロキシテスト...');
  try {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }, JSON.stringify({
      email: testEmail,
      password: testPassword
    }));
    
    console.log('Status Code:', registerResponse.statusCode);
    
    if (registerResponse.statusCode === 201 || registerResponse.statusCode === 200) {
      const data = JSON.parse(registerResponse.data);
      if (data.isFallback) {
        console.log('⚠️  Register フォールバック機能が動作しています');
        console.log('   Backend Auth Service (8081) が稼働していない可能性があります');
      } else {
        console.log('✅ Register API プロキシが正常に動作しています');
      }
      console.log('   テストEmail:', testEmail);
    } else {
      console.log('❌ Register API プロキシでエラーが発生しました');
      console.log('   Response:', registerResponse.data);
    }
  } catch (error) {
    console.log('❌ Register API プロキシテストに失敗:', error.message);
  }

  // 4. Login API プロキシテスト
  console.log('4. Login API プロキシテスト...');
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }, JSON.stringify({
      email: testEmail,
      password: testPassword
    }));
    
    console.log('Status Code:', loginResponse.statusCode);
    
    if (loginResponse.statusCode === 200) {
      const data = JSON.parse(loginResponse.data);
      if (data.isFallback) {
        console.log('⚠️  Login フォールバック機能が動作しています');
        console.log('   Backend Auth Service (8081) が稼働していない可能性があります');
      } else {
        console.log('✅ Login API プロキシが正常に動作しています');
      }
      
      // クッキーの確認
      if (loginResponse.cookies.length > 0) {
        console.log('   認証クッキーが設定されました');
      }
    } else {
      console.log('❌ Login API プロキシでエラーが発生しました');
      console.log('   Response:', loginResponse.data);
    }
  } catch (error) {
    console.log('❌ Login API プロキシテストに失敗:', error.message);
  }

  // 5. Logout API プロキシテスト
  console.log('5. Logout API プロキシテスト...');
  try {
    const logoutResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'idToken=test-token' // テスト用のクッキー
      },
      timeout: 10000
    });
    
    console.log('Status Code:', logoutResponse.statusCode);
    
    if (logoutResponse.statusCode === 200) {
      const data = JSON.parse(logoutResponse.data);
      if (data.isFallback) {
        console.log('⚠️  Logout フォールバック機能が動作しています');
      } else {
        console.log('✅ Logout API プロキシが正常に動作しています');
      }
      
      // クッキーのクリア確認
      const clearCookie = logoutResponse.cookies.find(cookie => 
        cookie.includes('idToken=;') || cookie.includes('idToken=""')
      );
      if (clearCookie) {
        console.log('   認証クッキーが正常にクリアされました');
      }
    } else {
      console.log('❌ Logout API プロキシでエラーが発生しました');
    }
  } catch (error) {
    console.log('❌ Logout API プロキシテストに失敗:', error.message);
  }

  // 6. Confirm API プロキシテスト
  console.log('6. Confirm API プロキシテスト...');
  try {
    const confirmResponse = await makeRequest({
      hostname: 'localhost',
      port: FRONTEND_PORT,
      path: '/api/auth/confirm',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }, JSON.stringify({
      email: 'test@example.com',
      code: '123456'
    }));
    
    console.log('Status Code:', confirmResponse.statusCode);
    
    if (confirmResponse.statusCode === 200) {
      const data = JSON.parse(confirmResponse.data);
      if (data.isFallback) {
        console.log('⚠️  Confirm フォールバック機能が動作しています');
      } else {
        console.log('✅ Confirm API プロキシが正常に動作しています');
      }
    } else {
      console.log('❌ Confirm API プロキシでエラーが発生しました');
    }
  } catch (error) {
    console.log('❌ Confirm API プロキシテストに失敗:', error.message);
  }

  console.log('\n🏁 認証系テスト完了');
  console.log('\n📋 次のステップ:');
  console.log('   1. Backend サービスを起動: cd /home/wsl/dev/cloud-shop/backend && make dev-core');
  console.log('   2. Frontend サーバーを起動: cd /home/wsl/dev/cloud-shop/frontend && npm run dev');
  console.log('   3. ブラウザで http://localhost:3000/register にアクセス');
  console.log('   4. ユーザー登録・ログイン機能をテスト');
  console.log('\n⚠️  注意: AWS CognitoからKeycloakへの移行により、以下が必要です:');
  console.log('   - Keycloakサーバーの起動とレルム設定');
  console.log('   - Auth Service (8081) の適切な設定');
  console.log('   - フロントエンド認証ライブラリの更新（必要に応じて）');
}

// メイン実行
if (require.main === module) {
  runAuthTests().catch(console.error);
}

module.exports = { runAuthTests };