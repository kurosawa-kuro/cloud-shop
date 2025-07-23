import { PrismaClient, Prisma } from '@prisma/client';
import { ActionType as PrismaActionType } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DB_STORED_ACTIONS = [
  // 売上・在庫関連
  'CART_ADD',
  'CART_REMOVE', 
  'CART_UPDATE',
  'ORDER_COMPLETE',
  'ORDER_CANCEL',
  'RETURN_REQUESTED',
  'RETURN_COMPLETED',
  // ユーザー関連
  'USER_REGISTER_START',
  'USER_REGISTER_COMPLETE',
  'PROFILE_UPDATE',
  'USER_LOGIN',
  'USER_LOGOUT',
  'DELETE_ACCOUNT'
] as const;

const LOG_ONLY_ACTIONS = [
  // 閲覧行動
  'PRODUCT_VIEW',
  'PRODUCT_SEARCH',
  'PRODUCT_FILTER',
  'PRODUCT_SORT',
  'PRODUCT_BUY_AGAIN',
  // カート
  'CART_SAVE_FOR_LATER',
  // 決済
  'CHECKOUT_START',
  'PAYMENT_ERROR',
  'ADDRESS_UPDATE',
  // その他
  'Order_DELIVERY_STATUS_VIEW',
  'PASSWORD_CHANGE'
] as const;

// この動的に生成する方のみを残す
export const ActionLogType = {
  Pre_Order: {
    PRODUCT: {
      VIEW: 'PRODUCT_VIEW',
      SEARCH: 'PRODUCT_SEARCH',
      FILTER: 'PRODUCT_FILTER',
      SORT: 'PRODUCT_SORT'
    },
    CART: {
      ADD: 'CART_ADD',
      REMOVE: 'CART_REMOVE',
      UPDATE: 'CART_UPDATE',
      SAVE_FOR_LATER: 'CART_SAVE_FOR_LATER'
    },
    CHECKOUT: {
      START: 'CHECKOUT_START',
      COMPLETE: 'COMPLETE_ORDER',
      PAYMENT_ERROR: 'PAYMENT_ERROR',
      ADDRESS_UPDATE: 'ADDRESS_UPDATE'
    }
  },
  Post_Order: {
    PRODUCT: {
      BUY_AGAIN: 'PRODUCT_BUY_AGAIN',
      CANCEL: 'ORDER_CANCEL',
      RETURN: {
        REQUEST: 'RETURN_REQUESTED',
        COMPLETE: 'RETURN_COMPLETED'
      }
    },
    Order: {
      DELIVERY_STATUS_VIEW: 'Order_DELIVERY_STATUS_VIEW'
    }
  },
  USER: {
    LOGIN: 'USER_LOGIN',
    LOGOUT: 'USER_LOGOUT',
    REGISTER_START: 'USER_REGISTER_START',
    REGISTER_COMPLETE: 'USER_REGISTER_COMPLETE',
    PROFILE_UPDATE: 'PROFILE_UPDATE',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    DELETE_ACCOUNT: 'DELETE_ACCOUNT'
  }
} as const;

// ----------------
// 型定義
// ----------------
type DBStoredAction = typeof DB_STORED_ACTIONS[number];
type LogOnlyAction = typeof LOG_ONLY_ACTIONS[number];
export type ActionType = DBStoredAction | LogOnlyAction;

export interface UserAction {
  actionType: ActionType;
  userId: string;
  requestID?: string;
  page_url?: string;
  requestUrl?: string;
  
  // 製品情報
  productId?: number;
  productName?: string;
  productPrice?: number;
  categoryId?: number;
  categoryName?: string;
  
  // トランザクション情報
  cartItemId?: number;
  orderId?: number;
  returnId?: number;
  quantity?: number;
  
  // 検索情報
  searchKeyword?: string;
  searchCategoryId?: number;
  searchCategoryName?: string;
  
  // コンテンツ
  reviewText?: string;
  rating?: number;
  actionReason?: string;
  errorDetails?: string;
  
  // システム情報
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug' | 'action';
  message: string;
  timestamp: Date;
  userId?: string;
  action?: UserAction;
  requestID?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  info(message: string, metadata?: Record<string, unknown>): Promise<void>;
  warn(message: string, metadata?: Record<string, unknown>): Promise<void>;
  error(message: string, error: Error, metadata?: Record<string, unknown>): Promise<void>;
  debug(message: string, metadata?: Record<string, unknown>): Promise<void>;
  action(action: UserAction): Promise<void>;
}

interface AthenaLogEntry {
  timestamp: string;
  request_id: string;
  log_type: string;
  environment: string;
  user_id: string;
  user_agent: string;
  client_ip: string;
  country_code: string;
  device_type: string;
  action: string;
  context: Record<string, unknown>;
  product_data?: {
    product_id: number;
    product_name: string;
    product_price: number;
    quantity: number;
    category_id: number;
    category_name: string;
  };
  search_data?: {
    keyword: string;
    category_id: number;
    category_name: string;
  };
  metadata?: Record<string, unknown>;
  order_data?: {
    order_id: string;
  };
}

// ----------------
// ユーティリティ関数
// ----------------
function getRequestContext() {
  return {
    headers: {
      'user-agent': '',
      'cf-ipcountry': '',
      referer: ''
    },
    ip: '',
    originalUrl: '',
    query: {},
    session: {
      id: ''
    }
  };
}

function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function categorizeAction(actionType: ActionType): string {
  return actionType.toString();
}

function extractUTMParams(query: Record<string, unknown>): Record<string, unknown> {
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  return Object.fromEntries(
    Object.entries(query).filter(([key]) => utmParams.includes(key))
  );
}

// ----------------
// ロガー実装
// ----------------
class AppLogger implements Logger {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // private isLoggableAction(actionType: ActionType): actionType is DBStoredAction {
  //   return DB_STORED_ACTIONS.includes(actionType as DBStoredAction);
  // }

  private isLoggingOnlyAction(actionType: ActionType): actionType is LogOnlyAction {
    return LOG_ONLY_ACTIONS.includes(actionType as LogOnlyAction);
  }

  private async logToDB(action: UserAction): Promise<void> {
    try {
      const logData = {
        requestID: action.requestID,
        userId: action.userId,
        actionType: action.actionType as PrismaActionType,
        
        // 製品情報
        productId: action.productId,
        productName: action.productName,
        productPrice: action.productPrice,
        categoryId: action.categoryId,
        categoryName: action.categoryName,
        
        // トランザクション情報
        cartItemId: action.cartItemId,
        orderId: action.orderId,
        returnId: action.returnId,
        quantity: action.quantity,
        
        // 検索情報
        searchKeyword: action.searchKeyword,
        searchCategoryId: action.searchCategoryId,
        searchCategoryName: action.searchCategoryName,
        
        // コンテンツ
        reviewText: action.reviewText,
        rating: action.rating,
        actionReason: action.actionReason,
        errorDetails: action.errorDetails,
        
        // システム情報
        metadata: action.metadata as Prisma.InputJsonValue
      } satisfies Prisma.UserActionLogUncheckedCreateInput;

      await this.prisma.userActionLog.create({ data: logData });

    } catch (error) {
      if (error instanceof Error) {
        console.error('Logging error:', error.message);
      } else {
        console.error('Unexpected logging error');
      }
    }
  }

  private generateRequestID(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date(),
      requestID: this.generateRequestID(),
      metadata
    };
    console.log(JSON.stringify(entry));
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date(),
      requestID: this.generateRequestID(),
      metadata
    };
    console.warn(JSON.stringify(entry));
  }

  async error(message: string, error: Error, metadata?: Record<string, unknown>): Promise<void> {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date(),
      requestID: this.generateRequestID(),
      error,
      metadata
    };
    console.error(JSON.stringify(entry));
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      const entry: LogEntry = {
        level: 'debug',
        message,
        timestamp: new Date(),
        requestID: this.generateRequestID(),
        metadata
      };
      console.debug(JSON.stringify(entry));
    }
  }

  async action(action: UserAction): Promise<void> {
    const athenaLog = await this.formatForAthena(action);
    
    // CloudWatch Logs経由でAthenaに送信
    console.log('\x1b[33m%s\x1b[0m', JSON.stringify(athenaLog));

    // DB保存ロジック
    if (!this.isLoggingOnlyAction(action.actionType)) {
      await this.logToDB(action);
    }
  }

  private async formatForAthena(action: UserAction): Promise<AthenaLogEntry> {
    const req = getRequestContext();

    return {
      timestamp: new Date().toISOString(),
      request_id: action.requestID || this.generateRequestID(),
      log_type: 'USER_ACTION',
      environment: process.env.NODE_ENV || 'development',
      
      // ユーザー情報
      user_id: action.userId,
      user_agent: req.headers['user-agent'],
      client_ip: req.ip,
      country_code: req.headers['cf-ipcountry'],
      device_type: detectDeviceType(req.headers['user-agent']),

      // アクション情報
      action: categorizeAction(action.actionType),

      // コンテキスト
      context: {
        page_url: action.page_url,
        source: action.metadata?.source,
        referrer: req.headers.referer,
        session_id: req.session?.id,
        ...extractUTMParams(req.query)
      },

      // 製品データ
      product_data: action.productId ? {
        product_id: action.productId,
        product_name: action.productName || '',
        product_price: action.productPrice || 0,
        quantity: action.quantity || 0,
        category_id: action.categoryId || 0,
        category_name: action.categoryName || ''
      } : undefined,

      // 注文データ
      order_data: action.orderId ? {
        order_id: action.orderId.toString()
      } : undefined,

      // 検索データ
      search_data: action.searchKeyword ? {
        keyword: action.searchKeyword,
        category_id: action.searchCategoryId || 0,
        category_name: action.searchCategoryName || ''
      } : undefined,

      // その他のメタデータ
      ...action.metadata
    };
  }
}

export const logger = new AppLogger();