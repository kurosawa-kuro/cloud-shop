import { prisma } from '@/lib/database/prisma';
import { ActionLogType, logger } from '@/lib/logger';
import { signUp } from '@/lib/auth/cognito';
import { BaseApiHandler } from '@/lib/api/handler';

interface RegisterRequestBody {
  email: string;
  password: string;
}

interface UserCreationData {
  id: string;
  email: string;
  cognitoId: string;
  status: "ACTIVE";
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function createUserData(email: string, sub: string): UserCreationData {
  const now = new Date();
  return {
    id: sub,
    email,
    cognitoId: sub,
    status: "ACTIVE",
    emailVerified: false,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

class RegisterHandler extends BaseApiHandler {
  async POST(request: Request) {
    try {
      const body = await request.json() as RegisterRequestBody;
      const { email, password } = body;

      if (!email || !password) {
        return this.errorResponse('メールアドレスとパスワードは必須です', 400);
      }

      const cognitoResponse = await signUp(email, password);
      const sub = cognitoResponse.UserSub;

      if (!sub) {
        return this.errorResponse('Cognitoの登録に失敗しました', 500);
      }

      const userData = createUserData(email, sub);
      
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: userData });
        
        await logger.action({
          actionType: ActionLogType.USER.REGISTER_START,
          userId: sub
        });

        return { user };
      });

      return this.successResponse({ 
        success: true, 
        user: result.user,
        sub: cognitoResponse.UserSub 
      }, 201);

    } catch (error) {
      return this.handleError(error, 'ユーザー登録に失敗しました');
    }
  }
}

const handler = new RegisterHandler();

export const POST = handler.POST.bind(handler);