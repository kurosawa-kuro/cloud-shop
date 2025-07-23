// API Response Types
interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  categoryId?: number;
  stock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CartItem {
  id: number;
  userId: string;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
  };
  addedAt?: Date;
}

// 統一されたAPIレスポンス型
interface ApiResponse<T = any> {
  timestamp: string;
  status: number;
  data?: T;
  success: boolean;
  message?: string;
  correlationId?: string;
}

// 統一されたエラーレスポンス型
interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  correlationId?: string;
  debug?: {
    stack: string;
    originalError: string;
  };
}

// APIベースURLはNext.jsのpublic環境変数のみを参照（windowやtypeof判定は不要）
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8072';

// 認証関連API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/register', 'POST', { email, password, name });
  },
  login: async (email: string, password: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/login', 'POST', { email, password }, { credentials: 'include' });
  },
  confirm: async (email: string, code: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/confirm', 'POST', { email, code });
  },
  logout: async () => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/logout', 'POST', undefined, { credentials: 'include' });
  },
  verify: async () => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/verify', 'POST');
  },
  refresh: async (refreshToken: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/refresh', 'POST', { refreshToken });
  },
  revoke: async (token: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/auth/revoke', 'POST', { token });
  }
};

// カート管理API
export const cartAPI = {
  addToCart: async (productId: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/cart', 'POST', { productId });
  },
  readdToCart: async (productId: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/cart/readd-items', 'POST', { productId });
  },
  getCartItems: async (): Promise<ApiResponse<{ cartItems: CartItem[] }>> => {
    return executeRequest<ApiResponse<{ cartItems: CartItem[] }>>('/cloud-shop/cart', 'GET');
  },
  updateCartItemQuantity: async (cartItemId: number, quantity: number) => {
    return executeRequest<ApiResponse>(`/cloud-shop/cart/${cartItemId}`, 'PATCH', { quantity });
  },
  removeCartItem: async (cartItemId: number) => {
    return executeRequest<ApiResponse>(`/cloud-shop/cart/${cartItemId}`, 'DELETE');
  },
  getCartSummary: async (): Promise<ApiResponse<{ subtotal: number }>> => {
    return executeRequest<ApiResponse<{ subtotal: number }>>('/cloud-shop/cart/summary', 'GET');
  }
};

// 決済処理API
export const checkoutAPI = {
  confirmCheckout: async (
    name: string,
    address: string,
    cardNumber: string,
    expiryDate: string,
    securityCode: string,
    deliveryDate: string,
    paymentMethod: 'credit_card' | 'bank_transfer'
  ) => {
    return executeRequest<ApiResponse>('/cloud-shop/checkout/confirm', 'POST', {
      name,
      address,
      cardNumber,
      expiryDate,
      securityCode,
      deliveryDate,
      paymentMethod
    });
  }
};

// 購入履歴管理API
export const orderAPI = {
  fetchorders: async (): Promise<ApiResponse<{ orders: Order[] }>> => {
    return executeRequest<ApiResponse<{ orders: Order[] }>>('/cloud-shop/orders', 'GET');
  },
  return: async (orderId: string, productId: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/orders/return', 'POST', { orderId, productId });
  },
  review: async (orderId: string, productId: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/orders/review', 'POST', { orderId, productId });
  }
};

// 商品情報API
export const productAPI = {
  getProducts: async (): Promise<ApiResponse<{ products: Product[] }>> => {
    return executeRequest<ApiResponse<{ products: Product[] }>>('/cloud-shop/products', 'GET', undefined, { cache: 'no-store' });
  },
  getProduct: async (productId: string): Promise<ApiResponse<{ product: Product }>> => {
    return executeRequest<ApiResponse<{ product: Product }>>(`/cloud-shop/products/${productId}`, 'GET', undefined, { cache: 'no-store' });
  },
  getProductsByCategory: async (categoryId: number): Promise<ApiResponse<{ products: Product[] }>> => {
    return executeRequest<ApiResponse<{ products: Product[] }>>(`/cloud-shop/products/category/${categoryId}`, 'GET', undefined, { cache: 'no-store' });
  }
};

// 閲覧履歴API
export const historyAPI = {
  recordView: async (productId: string, userId: string) => {
    return executeRequest<ApiResponse>('/cloud-shop/analytics/view-history', 'POST', { productId }, {
      headers: { 'x-user-id': userId }
    });
  }
};

// Top Page Display API
interface TopPageDisplay {
  id: number;
  displayType: string;
  productId: number;
  productName: string;
  productPrice: number;
  categoryId: number;
  categoryName: string;
  priority: number;
  specialPrice?: number | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type TopPageDisplayByDisplayType = Record<string, TopPageDisplay[]>;

interface TopPageResponse {
  topPageDisplayByDisplayType: TopPageDisplayByDisplayType;
}

export const topAPI = {
  getTopPageDisplay: async (): Promise<ApiResponse<TopPageResponse>> => {
    return executeRequest<ApiResponse<TopPageResponse>>("/cloud-shop/content/top", "GET", undefined, { cache: "no-store" });
  }
};

// リクエスト実行ユーティリティ（エラーハンドリング強化版）
const executeRequest = async <T = ApiResponse>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<T> => {
  try {
    // baseUrlはバックエンドAPIのURL
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    });

    const responseData = await response.json();

    if (!response.ok) {
      // バックエンドの統一エラーレスポンス形式に対応
      const errorData = responseData as ApiError;
      const error = new Error(errorData.message || 'Request failed');
      
      // エラーオブジェクトに追加情報を付与
      (error as any).status = errorData.status;
      (error as any).errorCode = errorData.error;
      (error as any).path = errorData.path;
      (error as any).correlationId = errorData.correlationId;
      (error as any).timestamp = errorData.timestamp;
      
      // 開発環境ではデバッグ情報も含める
      if (process.env.NODE_ENV === 'development' && errorData.debug) {
        (error as any).debug = errorData.debug;
      }
      
      throw error;
    }

    // 成功レスポンスはバックエンドの統一形式をそのまま返す
    return responseData as T;
  } catch (error) {
    // ネットワークエラーやJSON解析エラーの場合
    if (error instanceof TypeError) {
      const networkError = new Error('Network error or invalid response format');
      (networkError as any).status = 0;
      (networkError as any).errorCode = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // その他のエラーはそのまま再スロー
    throw error;
  }
};