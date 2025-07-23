import { Order } from "@prisma/client";
import { Product } from "@prisma/client";

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

// 認証関連API
export const authAPI = {
  register: async (email: string, password: string) => {
    return executeRequest('/api/auth/register', 'POST', { email, password });
  },
  login: async (email: string, password: string) => {
    return executeRequest('/api/auth/login', 'POST', { email, password }, { credentials: 'include' });
  },
  confirm: async (email: string, code: string) => {
    return executeRequest('/api/auth/confirm', 'POST', { email, code });
  },
  logout: async () => {
    return executeRequest('/api/auth/logout', 'POST', undefined, { credentials: 'include' });
  }
};

// カート管理API
export const cartAPI = {
  addToCart: async (productId: string) => {
    return executeRequest('/api/carts', 'POST', { productId });
  },
  readdToCart: async (productId: string) => {
    return executeRequest('/api/carts/readd-items', 'POST', { productId });
  },
  getCartItems: async (): Promise<{ cartItems: CartItem[] }> => {
    return executeRequest<{ cartItems: CartItem[] }>('/api/carts', 'GET');
  },
  updateCartItemQuantity: async (cartItemId: number, quantity: number) => {
    return executeRequest(`/api/carts/${cartItemId}`, 'PATCH', { quantity });
  },
  removeCartItem: async (cartItemId: number) => {
    return executeRequest(`/api/carts/${cartItemId}`, 'DELETE');
  },
  getCartSummary: async (): Promise<{ subtotal: number }> => {
    return executeRequest('/api/carts/summary', 'GET');
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
    return executeRequest('/api/checkout/confirm', 'POST', {
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
    return executeRequest('/api/order', 'GET');
  },
  return: async (orderId: string, productId: string) => {
    return executeRequest('/api/order/return', 'POST', { orderId, productId });
  },

  review: async (orderId: string, productId: string) => {
    return executeRequest('/api/order/review', 'POST', { orderId, productId });
  }
};

// 商品情報API
export const productAPI = {
  getProducts: async (): Promise<{ products: Product[] }> => {
    return executeRequest('/api/products', 'GET', undefined, { cache: 'no-store' });
  },
  getProduct: async (productId: string): Promise<{ product: Product }> => {
    return executeRequest(`/api/products/${productId}`, 'GET', undefined, { cache: 'no-store' });
  },
  getProductsByCategory: async (categoryId: number): Promise<{ products: Product[] }> => {
    return executeRequest(`/api/products/category/${categoryId}`, 'GET', undefined, { cache: 'no-store' });
  }
};

// 閲覧履歴API
export const historyAPI = {
  recordView: async (productId: string, userId: string) => {
    return executeRequest('/api/view-history', 'POST', { productId }, {
      headers: { 'x-user-id': userId }
    });
  }
};

/* ------------------------------------------------------------------
   New API: Top Page Display API
   This API retrieves the top page display information grouped
   by display type from the backend (/api/top).
---------------------------------------------------------------------*/

// Type definitions for top page display response
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
    return executeRequest<TopPageResponse>("/api/top", "GET", undefined, { cache: "no-store" });
  }
};

// リクエスト実行ユーティリティ
const executeRequest = async <T = Record<string, unknown>>(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  options?: RequestInit
): Promise<T> => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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