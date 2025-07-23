import { NextRequest } from "next/server";
import { signIn } from '@/lib/auth/cognito';
import * as jose from 'jose';
import { ActionLogType, logger } from "@/lib/logger";
import { prisma } from '@/lib/database/prisma';
import { BaseApiHandler } from '@/lib/api/handler';

interface DecodedToken {
  email: string;
  sub: string;
}

class TokenValidator {
  async validateToken(idToken: string | undefined): Promise<DecodedToken> {
    if (!idToken) {
      throw new Error('認証トークンがありません');
    }
    return await jose.decodeJwt(idToken) as DecodedToken;
  }
}

class UserAuthenticator {
  private tokenValidator = new TokenValidator();

  async authenticate(email: string, password: string) {
    const result = await signIn(email, password);
    const idToken = result?.AuthenticationResult?.IdToken;
    
    if (!idToken) {
      throw new Error('認証トークンの取得に失敗しました');
    }
    
    const decoded = await this.tokenValidator.validateToken(idToken);
    return {
      idToken,
      user: {
        email: decoded.email,
        userId: decoded.sub
      }
    };
  }
}

class UserActivityLogger {
  async logLogin(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });

    await logger.action({
      actionType: ActionLogType.USER.LOGIN,
      userId
    });
  }

  async logFailedLogin(error: Error) {
    await logger.action({
      actionType: ActionLogType.USER.LOGIN,
      userId: 'unknown',
      metadata: {
        error: error.message,
        timestamp: new Date()
      }
    });
  }
}

class LoginHandler extends BaseApiHandler {
  private authenticator = new UserAuthenticator();
  private logger = new UserActivityLogger();

  async POST(request: NextRequest) {
    try {
      const { email, password } = await request.json();
      const { idToken, user } = await this.authenticator.authenticate(email, password);

      await this.logger.logLogin(user.userId);

      const response = this.successResponse({ 
        success: true,
        user
      });

      response.cookies.set({
        name: 'idToken',
        value: idToken,
        path: '/',
        secure: false,
        sameSite: 'lax',
        httpOnly: true,
      });

      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        await this.logger.logFailedLogin(error);
      }
      return this.errorResponse('ログインに失敗しました', 500);
    }
  }
}

const handler = new LoginHandler();
export const POST = handler.POST.bind(handler);