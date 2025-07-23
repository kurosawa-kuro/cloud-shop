#!/usr/bin/env node

/**
 * 全プロキシ統合テストスクリプト
 * Products, Auth, Cart, Orders の全APIプロキシを包括的にテストします
 */

const { runTests: runProductTests } = require('./test-proxy.js');
const { runAuthTests } = require('./test-auth-proxy.js');
const { runTransactionTests } = require('./test-transaction-proxy.js');

async function runAllProxyTests() {
  console.log('🚀 Cloud-Shop Frontend-Backend プロキシ統合テストを開始します...\n');
  console.log('=' .repeat(80));
  
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // Phase 1: 読み取り系API (Products)
    console.log('\n📦 Phase 1: Products API プロキシテスト');
    console.log('-'.repeat(50));
    
    try {
      await runProductTests();
      console.log('✅ Products API テスト完了');
      passedTests++;
    } catch (error) {
      console.log('❌ Products API テスト失敗:', error.message);
      failedTests++;
    }
    totalTests++;

    // Phase 2: 認証系API (Auth)
    console.log('\n🔐 Phase 2: Auth API プロキシテスト');
    console.log('-'.repeat(50));
    
    try {
      await runAuthTests();
      console.log('✅ Auth API テスト完了');
      passedTests++;
    } catch (error) {
      console.log('❌ Auth API テスト失敗:', error.message);
      failedTests++;
    }
    totalTests++;

    // Phase 3: トランザクション系API (Cart, Orders, Payments)
    console.log('\n💳 Phase 3: Transaction API プロキシテスト');
    console.log('-'.repeat(50));
    
    try {
      await runTransactionTests();
      console.log('✅ Transaction API テスト完了');
      passedTests++;
    } catch (error) {
      console.log('❌ Transaction API テスト失敗:', error.message);
      failedTests++;
    }
    totalTests++;

  } catch (error) {
    console.error('❌ 統合テストで予期しないエラーが発生:', error);
    failedTests++;
  }

  // テスト結果サマリー
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 統合テスト結果サマリー');
  console.log('=' .repeat(80));
  console.log(`⏱️  実行時間: ${duration}秒`);
  console.log(`📊 総テスト数: ${totalTests}`);
  console.log(`✅ 成功: ${passedTests}`);
  console.log(`❌ 失敗: ${failedTests}`);
  console.log(`🎯 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // プロキシ化状況の確認
  console.log('\n📋 プロキシ化実装状況');
  console.log('-'.repeat(50));
  
  const proxyStatus = [
    { category: 'Products API', items: [
      { name: '/api/products', status: '✅ 完了' },
      { name: '/api/products/[id]', status: '✅ 完了' },
      { name: '/api/products/search', status: '✅ 完了' }
    ]},
    { category: 'Auth API', items: [
      { name: '/api/auth/login', status: '✅ 完了 (Keycloak統合)' },
      { name: '/api/auth/register', status: '✅ 完了 (Keycloak統合)' },
      { name: '/api/auth/logout', status: '✅ 完了' },
      { name: '/api/auth/confirm', status: '✅ 完了' }
    ]},
    { category: 'Cart API', items: [
      { name: '/api/carts (GET/POST/DELETE)', status: '✅ 完了' },
      { name: '/api/carts/summary', status: '✅ 完了' },
      { name: '/api/carts/readd-items', status: '✅ 完了' }
    ]},
    { category: 'Checkout API', items: [
      { name: '/api/checkout/prepare', status: '✅ 完了' },
      { name: '/api/checkout/confirm', status: '✅ 完了 (Critical)' }
    ]},
    { category: 'Orders API', items: [
      { name: '/api/order (GET/POST)', status: '✅ 完了' }
    ]}
  ];

  proxyStatus.forEach(category => {
    console.log(`\n${category.category}:`);
    category.items.forEach(item => {
      console.log(`  ${item.name}: ${item.status}`);
    });
  });

  // 推奨事項
  console.log('\n💡 推奨事項と次のステップ');
  console.log('-'.repeat(50));
  
  if (failedTests > 0) {
    console.log('⚠️  失敗したテストがあります:');
    console.log('   1. Backend サービスが全て起動していることを確認');
    console.log('   2. 各サービスのヘルスチェックを実行');
    console.log('   3. ネットワーク接続とポート設定を確認');
    console.log('   4. ログファイルでエラー詳細を確認');
  }

  if (passedTests === totalTests) {
    console.log('🎉 全てのプロキシテストが成功しました！');
  }
  
  console.log('\n🔧 運用時の注意事項:');
  console.log('   • フォールバック機能は緊急時のみ使用される想定です');
  console.log('   • 本番環境では全サービスの冗長化を推奨します');
  console.log('   • 定期的なヘルスチェックとモニタリングを実施してください');
  console.log('   • データ整合性の定期確認を行ってください');
  
  console.log('\n🚀 デプロイ準備:');
  console.log('   1. 環境変数の設定確認');
  console.log('   2. セキュリティ設定の検証');
  console.log('   3. パフォーマンステストの実施');
  console.log('   4. バックアップとロールバック手順の確認');

  // 終了コード
  process.exit(failedTests > 0 ? 1 : 0);
}

// メイン実行
if (require.main === module) {
  runAllProxyTests().catch((error) => {
    console.error('❌ 統合テストで致命的なエラーが発生:', error);
    process.exit(1);
  });
}

module.exports = { runAllProxyTests };