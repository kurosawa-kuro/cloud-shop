# フロントエンドデータベース削除・Cognito・RDS排除計画

## 概要

Cloud-Shopプラットフォームのフロントエンドから直接的なデータベースアクセス（Prisma）、AWS Cognito認証、およびRDS依存関係を完全に排除し、純粋なマイクロサービスAPI ゲートウェイモデルに移行する計画です。

## 現状分析

### 現在のハイブリッドアーキテクチャ
- **プライマリ**: バックエンドマイクロサービス経由でのAPI通信（ゲートウェイポート8072）
- **フォールバック**: マイクロサービス不使用時の直接データベースアクセス

### 削除対象コンポーネント

#### 1. Prismaデータベース関連
```javascript
// package.json依存関係
"@prisma/client": "5.10.2"
"prisma": "5.10.2"

// npmスクリプト
"prisma:generate": "prisma generate"
"prisma:migrate": "prisma migrate dev"
"prisma:studio": "prisma studio"
"prisma:seed": "ts-node -r tsconfig-paths/register --compilerOptions '{\"module\":\"CommonJS\"}' prisma/seed.ts"
```

#### 2. AWS Cognito認証関連
```javascript
// package.json依存関係
"@aws-sdk/client-cognito-identity": "^3.731.1"
"@aws-sdk/client-cognito-identity-provider": "^3.732.0"
"aws-amplify": "^6.12.1"
```

#### 3. 環境変数
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/frontend_db?schema=public"
```

## 移行計画

### フェーズ1: 依存関係の削除

#### 1.1 パッケージ依存関係の削除
```bash
npm uninstall @prisma/client prisma @aws-sdk/client-cognito-identity @aws-sdk/client-cognito-identity-provider aws-amplify
```

#### 1.2 package.jsonスクリプトの削除
- `prisma:generate`
- `prisma:migrate` 
- `prisma:studio`
- `prisma:seed`

#### 1.3 環境変数の削除
- `.env.example`から`DATABASE_URL`を削除
- 本番環境設定からデータベース接続文字列を削除

### フェーズ2: コードベースの修正

#### 2.1 APIルートの修正
**対象ファイル**: `/src/app/api/carts/route.ts`

**削除する処理**:
```javascript
// フォールバック データベース操作の削除
prisma.cartItem.findMany()
prisma.cartItem.create()
prisma.cartItem.update() 
prisma.cartItem.delete()
```

**修正後の動作**:
- マイクロサービスが利用不可の場合はエラーレスポンスを返す
- フォールバック処理を完全に削除

#### 2.2 型定義の修正
**対象ファイル**: `/src/lib/api/client.ts`

**削除する内容**:
```javascript
import { Order, Product } from '@prisma/client'
```

**修正方法**:
- バックエンドAPI用の独自型定義を作成
- または既存のAPI型定義を使用

#### 2.3 データベースクライアントの削除
**削除対象ファイル**:
- `/src/lib/database/prisma.ts`

### フェーズ3: テストの修正

#### 3.1 Cognitoモックの削除
**対象ファイル**:
- `/src/tests/frontend/(auth)/login/page.test.tsx`
- `/src/tests/frontend/(auth)/register/page.test.tsx`
- `/src/tests/backend/auth/register/route.test.ts`

**修正内容**:
- 削除された`cognito.ts`ファイルへの参照を削除
- JWT ベースの認証テストに変更

#### 3.2 データベーステストの削除
- Prismaを使用したテストクリーンアップ処理を削除
- バックエンドAPIモックに置き換え

### フェーズ4: 認証システムの移行

#### 4.1 現在の認証フロー（保持）
- JWT トークンをHTTP-onlyクッキー（`idToken`）に保存
- ミドルウェアでJWTをデコードしユーザーヘッダー注入
- バックエンドマイクロサービスでKeycloak経由の認証処理

#### 4.2 Cognito参照の削除
**対象ファイル**: `/src/app/(auth)/confirm/page.tsx`
```javascript
// 削除対象
CodeMismatchException // Cognito特有のエラーハンドリング
```

**修正方法**:
- バックエンドAPIからの標準エラーレスポンスに変更

### フェーズ5: 保持する機能

#### 5.1 AWS S3統合（継続使用）
```javascript
// 保持する依存関係
"@aws-sdk/client-s3": "^3.731.1"
"@aws-sdk/s3-request-presigner": "^3.731.1"
```

**保持するファイル**:
- `/src/types/aws-sdk.d.ts`
- `/src/app/api/upload/presigned/route.ts`

#### 5.2 マイクロサービスプロキシ（継続使用）
- `microserviceProxy.ts`
- `BaseApiHandler.ts`
- JWT ミドルウェア

## RDS排除戦略

### RDS削除の前提条件
1. **全マイクロサービスの完全運用**: すべてのAPIエンドポイントがバックエンドサービス経由でアクセス可能
2. **データ移行完了**: フロントエンド固有のデータがバックエンドサービスに移行済み
3. **認証統合完了**: Keycloak経由の認証が完全に機能

### 削除手順

#### 1. インフラストラクチャレベル
```yaml
# docker-compose.yml - フロントエンド用PostgreSQL削除
# 削除対象
postgres-frontend:
  image: postgres:15
  environment:
    POSTGRES_DB: frontend_db
    POSTGRES_USER: user
    POSTGRES_PASSWORD: password
  ports:
    - "5433:5432"
```

#### 2. CI/CDパイプライン修正
- フロントエンドデータベースマイグレーション削除
- フロントエンド用のデータベース初期化スクリプト削除

#### 3. 監視・ログ設定
- フロントエンドデータベース接続の監視を削除
- 関連するアラート設定を削除

## 実装スケジュール

### Week 1: 準備とテスト
- [ ] 開発環境でのテスト実装
- [ ] バックエンドAPI の動作確認
- [ ] フォールバック処理の無効化テスト

### Week 2: コード修正
- [ ] 依存関係の削除
- [ ] APIルートの修正  
- [ ] テストコードの修正

### Week 3: 統合テスト
- [ ] E2Eテストの実行
- [ ] パフォーマンステスト
- [ ] セキュリティテスト

### Week 4: 本番展開
- [ ] ステージング環境での最終テスト
- [ ] 本番環境への段階的展開
- [ ] 監視とロールバック準備

## リスクと対策

### 高リスク項目
1. **マイクロサービス障害時の動作**: フォールバック削除により、サービス障害時にユーザー体験が悪化
2. **データ整合性**: 移行過程でのデータ不整合の可能性

### 対策
1. **サーキットブレーカー実装**: マイクロサービス障害を早期検出
2. **グレースフルエラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
3. **段階的展開**: 機能別の段階的な移行実施

## 成功指標

### 技術指標
- [ ] フロントエンドバンドルサイズの削減（Prisma/Cognito依存関係削除）
- [ ] API レスポンス時間の一貫性向上
- [ ] データベース接続数の削減

### ビジネス指標  
- [ ] ページロード時間の改善
- [ ] エラー率の維持または改善
- [ ] ユーザー認証成功率の維持

## 完了基準

1. ✅ フロントエンドから全てのPrisma/Cognito依存関係が削除されている
2. ✅ 全てのAPIリクエストがバックエンドマイクロサービス経由で処理されている  
3. ✅ フロントエンド専用データベースが完全に削除されている
4. ✅ 全てのテストが正常に通過している
5. ✅ 本番環境で安定稼働している

---

**注意**: この移行により、フロントエンドは純粋なAPIクライアントとなり、全てのデータ処理とビジネスロジックがバックエンドマイクロサービスに委譲されます。