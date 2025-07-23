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

// APIベースURLはNext.jsのpublic環境変数のみを参照（windowやtypeof判定は不要）
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8072';

// 認証関連API
export const authAPI = {
  register: async (email: string, password: string) => {
    return executeRequest('/cloud-shop/auth/register', 'POST', { email, password });
  },
  login: async (email: string, password: string) => {
    return executeRequest('/cloud-shop/auth/login', 'POST', { email, password }, { credentials: 'include' });
  },
  confirm: async (email: string, code: string) => {
    return executeRequest('/cloud-shop/auth/confirm', 'POST', { email, code });
  },
  logout: async () => {
    return executeRequest('/cloud-shop/auth/logout', 'POST', undefined, { credentials: 'include' });
  }
};

// カート管理API
export const cartAPI = {
  addToCart: async (productId: string) => {
    return executeRequest('/cloud-shop/carts', 'POST', { productId });
  },
  readdToCart: async (productId: string) => {
    return executeRequest('/cloud-shop/carts/readd-items', 'POST', { productId });
  },
  getCartItems: async (): Promise<{ cartItems: CartItem[] }> => {
    return executeRequest<{ cartItems: CartItem[] }>('/cloud-shop/carts', 'GET');
  },
  updateCartItemQuantity: async (cartItemId: number, quantity: number) => {
    return executeRequest(`/cloud-shop/carts/${cartItemId}`, 'PATCH', { quantity });
  },
  removeCartItem: async (cartItemId: number) => {
    return executeRequest(`/cloud-shop/carts/${cartItemId}`, 'DELETE');
  },
  getCartSummary: async (): Promise<{ subtotal: number }> => {
    return executeRequest('/cloud-shop/carts/summary', 'GET');
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
    return executeRequest('/cloud-shop/checkout/confirm', 'POST', {
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
  fetchorders: async (): Promise<{ orders: Order[] }> => {
    return executeRequest('/cloud-shop/order', 'GET');
  },
  return: async (orderId: string, productId: string) => {
    return executeRequest('/cloud-shop/order/return', 'POST', { orderId, productId });
  },
  review: async (orderId: string, productId: string) => {
    return executeRequest('/cloud-shop/order/review', 'POST', { orderId, productId });
  }
};

// 商品情報API
export const productAPI = {
  getProducts: async (): Promise<{ products: Product[] }> => {
    return executeRequest('/cloud-shop/products', 'GET', undefined, { cache: 'no-store' });
  },
  getProduct: async (productId: string): Promise<{ product: Product }> => {
    return executeRequest(`/cloud-shop/products/${productId}`, 'GET', undefined, { cache: 'no-store' });
  },
  getProductsByCategory: async (categoryId: number): Promise<{ products: Product[] }> => {
    return executeRequest(`/cloud-shop/products/category/${categoryId}`, 'GET', undefined, { cache: 'no-store' });
  }
};

// 閲覧履歴API
export const historyAPI = {
  recordView: async (productId: string, userId: string) => {
    return executeRequest('/cloud-shop/view-history', 'POST', { productId }, {
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
  getTopPageDisplay: async (): Promise<TopPageResponse> => {
    return executeRequest<TopPageResponse>("/cloud-shop/top", "GET", undefined, { cache: "no-store" });
  }
};

// リクエスト実行ユーティリティ
const executeRequest = async <T = Record<string, unknown>>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<T> => {
  // baseUrlはバックエンドAPIのURL
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    ...options
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }

  return response.json();
};