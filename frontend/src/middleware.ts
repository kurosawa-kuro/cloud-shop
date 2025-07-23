import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

// マッチャー設定
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

// トークン取得専用クラス
class TokenExtractor {
  private request: NextRequest;

  constructor(request: NextRequest) {
    this.request = request;
  }

  getIdToken(): string | undefined {
    const cookieToken = this.request.cookies.get('idToken')?.value;
    const headerToken = this.request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('idToken='))
      ?.split('=')[1];

    return cookieToken || headerToken;
  }
}

// トークン検証専用クラス
class TokenValidator {
  async decodeToken(idToken: string): Promise<{ email?: string, sub?: string } | null> {
    try {
      const decodedIdToken = await jose.decodeJwt(idToken);
      
      if (decodedIdToken.email && decodedIdToken.sub) {
        return {
          email: String(decodedIdToken.email),
          sub: String(decodedIdToken.sub)
        };
      }
    } catch (error) {
      console.error('Token decode error:', error);
    }
    return null;
  }
}

// ヘッダー管理専用クラス
class HeaderManager {
  private headers: Headers;

  constructor(originalHeaders: Headers) {
    this.headers = new Headers(originalHeaders);
  }

  // リクエストパスを取得 request.url
  setRequestURL(request: NextRequest): void {
    this.headers.set('x-request-url', request.url);
  }

  setRequestId(requestID: string): void {
    this.headers.set('x-request-id', requestID);
  }

  setUserInfo(email: string, userId: string): void {
    this.headers.set('x-user-email', email);
    this.headers.set('x-user-id', userId);
  }

  getHeaders(): Headers {
    return this.headers;
  }
}

// 認証チェック専用クラス
class AuthGuard {
  private static readonly PROTECTED_PATHS = ['/carts', '/checkout', '/order'];

  static isProtectedPath(path: string): boolean {
    return this.PROTECTED_PATHS.includes(path);
  }

  static redirectToLogin(request: NextRequest): NextResponse {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// メインのミドルウェア関数
export async function middleware(request: NextRequest) {

  const requestID = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);

  const tokenExtractor = new TokenExtractor(request);
  const tokenValidator = new TokenValidator();
  const headerManager = new HeaderManager(request.headers);
  headerManager.setRequestId(requestID);
  headerManager.setRequestURL(request);
  const idToken = tokenExtractor.getIdToken();
  
  if (idToken) {
    const userInfo = await tokenValidator.decodeToken(idToken);
    if (userInfo?.email && userInfo.sub) {
      headerManager.setUserInfo(userInfo.email, userInfo.sub);    
    }
  }

  if (AuthGuard.isProtectedPath(request.nextUrl.pathname) && 
      !headerManager.getHeaders().get('x-user-id')) {
    return AuthGuard.redirectToLogin(request);
  }

  return NextResponse.next({
    request: {
      headers: headerManager.getHeaders(),
    },
  });
}