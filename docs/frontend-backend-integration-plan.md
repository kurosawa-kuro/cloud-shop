# Frontend-Backend統合計画書

## 概要

Cloud-Shopプロジェクトにおいて、フルスタックNext.jsアプリケーションからマイクロサービスアーキテクチャへの移行を実施します。本計画書では、既存のフロントエンド資産を有効活用しながら、バックエンドマイクロサービスとの統合を行う方針を示します。

## 現在のアーキテクチャ分析

### フロントエンド (Next.js 15)
- **フレームワーク**: Next.js 15 with React 19 + TypeScript
- **認証**: Keycloak統合 (AWS Cognito廃止済み)
- **状態管理**: Zustand
- **データベース**: Prisma + PostgreSQL (フロントエンド専用)
- **AI機能**: OpenAI ChatBot統合
- **テスト**: Jest (Frontend/Backend分離済み) + Playwright E2E
- **スタイリング**: Tailwind CSS

#### 既存のAPIルート構成
```
src/app/api/
├── auth/             # 認証関連
├── carts/            # カート管理
├── chatbot/          # AI機能
├── checkout/         # 決済処理
├── order/            # 注文管理
├── products/         # 商品情報
├── top/              # トップページ
├── upload/           # ファイルアップロード
└── view-history/     # 閲覧履歴
```

### バックエンド (マイクロサービス)
- **Gateway**: API Gateway (8072) - 認証・ルーティング・レート制限
- **認証**: Keycloak統合 Auth Service (8081)
- **ユーザー**: Users Service (8082) - プロフィール・アカウント管理
- **商品**: Products Service (8083) - 商品カタログ
- **カート**: Cart Service (8084) - ショッピングカート
- **注文**: Orders Service (8085) - 注文処理 + Kafka
- **決済**: Payments Service (8086) - Stripe統合
- **分析**: Analytics Service (8087) - ビジネス分析
- **コンテンツ**: Content Service (8088) - CMS
- **メッセージ**: Message Service (9010) - イベント処理

## 統合戦略

### Phase 1: API Proxy層の実装

#### 1.1 Gateway統合
```typescript
// src/lib/api/gateway.ts
const GATEWAY_URL = process.env.BACKEND_GATEWAY_URL || 'http://localhost:8072';

export class GatewayClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = GATEWAY_URL;
  }
  
  async request(endpoint: string, options: RequestInit = {}) {
    // JWT token injection
    // Error handling
    // Response transformation
  }
}
```

#### 1.2 既存API Routeの段階的移行

##### Step 1: プロキシ層実装
既存Next.js API Routes内でBackend Microservicesへプロキシする実装に変更

**例: 商品API (`src/app/api/products/route.ts`)**
```typescript
// Before: 直接データベースアクセス
import { prisma } from '@/lib/database/prisma';

export async function GET() {
  const products = await prisma.product.findMany();
  return Response.json(products);
}

// After: マイクロサービスプロキシ
import { GatewayClient } from '@/lib/api/gateway';

export async function GET(request: Request) {
  const gateway = new GatewayClient();
  const url = new URL(request.url);
  
  try {
    const response = await gateway.request('/cloud-shop/products' + url.search, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      }
    });
    
    return Response.json(response.data);
  } catch (error) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
```

##### Step 2: サービス別移行優先順位

**Phase 2.1: 読み取り系API (Low Risk)**
```typescript
// 優先度: 高
- /api/products/route.ts → Products Service (8083)
- /api/products/[productId]/route.ts → Products Service
- /api/products/search/route.ts → Products Service

// 優先度: 中
- /api/view-history/route.ts → Analytics Service (8087)
- /api/top/route.ts → Content Service (8088)
```

**Phase 2.2: 認証系API (Medium Risk)**
```typescript
- /api/auth/login/route.ts → Gateway → Auth Service (8081)
- /api/auth/register/route.ts → Gateway → Auth Service
- /api/auth/logout/route.ts → Gateway → Auth Service
```

**Phase 2.3: トランザクション系API (High Risk)**
```typescript
- /api/carts/route.ts → Cart Service (8084)
- /api/checkout/prepare/route.ts → Orders Service (8085)
- /api/order/route.ts → Orders Service + Payments Service (8086)
```

##### Step 3: プロキシ設定の標準化

**共通プロキシユーティリティ (`src/lib/api/proxy.ts`)**
```typescript
export class MicroserviceProxy {
  private gateway: GatewayClient;
  
  constructor() {
    this.gateway = new GatewayClient();
  }
  
  async proxyRequest(
    servicePath: string,
    request: Request,
    options: ProxyOptions = {}
  ): Promise<Response> {
    const { 
      requireAuth = true, 
      timeout = 30000,
      retries = 3 
    } = options;
    
    // Request preparation
    const headers = this.prepareHeaders(request, requireAuth);
    const body = await this.prepareBody(request);
    
    // Service call with retry logic
    return this.callWithRetry(servicePath, {
      method: request.method,
      headers,
      body,
    }, retries);
  }
  
  private async callWithRetry(path: string, options: RequestInit, retries: number) {
    // Circuit breaker implementation
    // Retry logic with exponential backoff
    // Error handling and fallback
  }
}
```

##### Step 4: フロントエンド影響最小化

**API呼び出しレイヤー (`src/lib/api/client.ts`)**
```typescript
// フロントエンドコンポーネントは変更不要
export const apiClient = {
  // 既存インターフェース維持
  products: {
    getAll: () => fetch('/api/products').then(r => r.json()),
    getById: (id: string) => fetch(`/api/products/${id}`).then(r => r.json()),
    search: (query: string) => fetch(`/api/products/search?q=${query}`).then(r => r.json()),
  },
  
  cart: {
    get: () => fetch('/api/carts').then(r => r.json()),
    add: (item: CartItem) => fetch('/api/carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(r => r.json()),
  }
};

// コンポーネント側は無変更
// const { data: products } = await apiClient.products.getAll();
```

### Phase 2: 認証システムの統合

#### 2.1 認証フロー統一
```
統一後: Frontend → Gateway → Keycloak → Auth Service
```
**変更点**: AWS Cognitoを廃止し、Keycloakに完全統一

#### 2.2 認証ミドルウェア更新
```typescript
// src/middleware.ts の更新
export async function middleware(request: NextRequest) {
  // Keycloak JWT validation
  // Gateway endpoint routing
  // Role-based access control
}
```

### Phase 3: データフロー最適化

#### 3.1 Database分離
- **Frontend DB**: ユーザーセッション、一時データ、キャッシュ
- **Backend DBs**: 各マイクロサービス専用スキーマ

#### 3.2 状態管理統合
```typescript
// src/stores/api.store.ts
export const useApiStore = create<ApiState>((set, get) => ({
  // Gateway client integration
  // Service-specific state management
  // Caching strategy
}));
```

### Phase 4: 段階的移行計画

#### Week 1-2: インフラ準備
- [ ] Gateway endpoint mapping
- [ ] Environment variable configuration
- [ ] Keycloak認証フロー統一 (AWS Cognito除去)
- [ ] Health check integration

#### Week 3-4: Core Services Integration
- [ ] Products Service → 商品表示・検索
- [ ] Cart Service → カート機能
- [ ] Users Service → プロフィール管理

#### Week 5-6: Advanced Features
- [ ] Orders Service → 注文処理
- [ ] Payments Service → 決済統合
- [ ] Analytics Service → データ分析

#### Week 7-8: Quality Assurance
- [ ] Performance optimization
- [ ] Error handling enhancement
- [ ] Security audit
- [ ] Load testing

### Phase 5: モニタリング・運用

#### 5.1 APM統合
```typescript
// src/lib/monitoring/apm.ts
export class APMClient {
  // Performance monitoring
  // Error tracking
  // User experience metrics
}
```

#### 5.2 ログ・メトリクス
- **Frontend**: Client-side error tracking
- **Gateway**: Request/Response logging
- **Services**: Business logic monitoring

## 認証システム変更の詳細

### AWS Cognito → Keycloak移行作業

#### 1. フロントエンド認証ライブラリ変更
```bash
# パッケージ削除
npm uninstall @aws-sdk/client-cognito-identity @aws-sdk/client-cognito-identity-provider aws-amplify

# Keycloak統合ライブラリ追加
npm install keycloak-js @types/keycloak-js
```

#### 2. 認証関連ファイル更新対象
- `src/lib/auth/cognito.ts` → `src/lib/auth/keycloak.ts`
- `src/stores/auth.store.ts` - Keycloak token管理
- `src/middleware.ts` - JWT validation変更
- `src/app/api/auth/**` - 認証API Route更新

#### 3. 環境変数更新
```env
# 削除対象
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_REGION=

# 追加対象
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=cloud-shop
KEYCLOAK_CLIENT_ID=frontend-client
```

## 移行における考慮事項

### パフォーマンス最適化

#### 1. レスポンス時間短縮
- API Gateway caching
- CDN integration
- Database query optimization

#### 2. ネットワーク最適化
- Request batching
- Connection pooling
- Compression

### セキュリティ強化

#### 1. 認証・認可
- JWT token validation
- Role-based access control
- Rate limiting

#### 2. データ保護
- HTTPS enforcement
- Input validation
- SQL injection prevention

### 開発者体験

#### 1. デバッグ・開発効率
```typescript
// src/components/debug/MicroserviceDebugger.tsx
export const MicroserviceDebugger = () => {
  // Service health monitoring
  // API call tracing
  // Performance profiling
};
```

#### 2. テスト戦略
```json
{
  "scripts": {
    "test:integration": "jest ./src/tests/integration/",
    "test:microservices": "jest ./src/tests/microservices/",
    "test:e2e": "playwright test --config=playwright.microservices.config.ts"
  }
}
```

## リスク管理

### 技術的リスク
- **Network latency**: Service mesh導入検討
- **Service availability**: Circuit breaker pattern
- **Data consistency**: Event sourcing + CQRS

### 運用リスク
- **Rollback strategy**: Blue-green deployment
- **Monitoring**: Comprehensive logging
- **Performance degradation**: Load balancing

## 成功メトリクス

### パフォーマンス指標
- API レスポンス時間: < 200ms (P95)
- ページロード時間: < 2秒
- エラー率: < 0.1%

### ビジネス指標
- ユーザー体験スコア: 維持
- コンバージョン率: 改善
- システム可用性: 99.9%

## 次のステップ

1. **環境準備**: Docker Compose環境での統合テスト
2. **CI/CD設定**: GitHub Actions workflow更新
3. **チーム教育**: マイクロサービス開発手法の共有
4. **段階的ロールアウト**: Feature flag利用での段階的リリース

---

**作成日**: 2025-07-23  
**バージョン**: 1.0  
**承認**: 開発チーム