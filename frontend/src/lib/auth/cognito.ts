// src/lib/auth/cognito.ts
import { 
  CognitoIdentityProviderClient, 
  SignUpCommand, 
  InitiateAuthCommand, 
  ConfirmSignUpCommand, 
  AdminGetUserCommand,
  type CognitoIdentityProviderClientConfig
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from 'crypto';
import {  logger } from '@/lib/logger';

// 設定関連
const COGNITO_CONFIG = {
  REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  CLIENT_SECRET: process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!,
  USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
} as const;

// クライアント初期化
const createCognitoClient = () => {
  const clientConfig: CognitoIdentityProviderClientConfig = {
    region: COGNITO_CONFIG.REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
    }
  };
  return new CognitoIdentityProviderClient(clientConfig);
};

export const client = createCognitoClient();

// セキュリティユーティリティ
const SecurityUtils = {
  generateSecretHash: (username: string): string => {
    const message = username + COGNITO_CONFIG.CLIENT_ID;
    const hmac = crypto.createHmac('SHA256', COGNITO_CONFIG.CLIENT_SECRET);
    return hmac.update(message).digest('base64');
  }
};

// コマンドファクトリー
const CommandFactory = {
  createSignUpCommand: (email: string, password: string) => {
    return new SignUpCommand({
      ClientId: COGNITO_CONFIG.CLIENT_ID,
      Username: email,
      Password: password,
      SecretHash: SecurityUtils.generateSecretHash(email),
      UserAttributes: [{ Name: "email", Value: email }],
    });
  },

  createConfirmSignUpCommand: (email: string, code: string) => {
    return new ConfirmSignUpCommand({
      ClientId: COGNITO_CONFIG.CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      SecretHash: SecurityUtils.generateSecretHash(email),
    });
  },

  createSignInCommand: (email: string, password: string) => {
    return new InitiateAuthCommand({
      ClientId: COGNITO_CONFIG.CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: SecurityUtils.generateSecretHash(email),
      },
    });
  }
};

// 認証サービス
export const AuthService = {
  
  async signUp(email: string, password: string) {
    try {
      const command = CommandFactory.createSignUpCommand(email, password);
      const response = await client.send(command);
      
      return { ...response, UserSub: response.UserSub };
    } catch (error) {
      logger.error('Cognito登録エラー:', error as Error);
      throw error;
    }
  },

  async confirmSignUp(email: string, code: string) {
    try {
      const command = CommandFactory.createConfirmSignUpCommand(email, code);
      const response = await client.send(command);
      
      const userCommand = new AdminGetUserCommand({
        UserPoolId: COGNITO_CONFIG.USER_POOL_ID,
        Username: email
      });
      
      const userResponse = await client.send(userCommand);
      const sub = userResponse.UserAttributes?.find(attr => attr.Name === 'sub')?.Value;
      
      return { ...response, sub };
    } catch (error) {
      logger.error('確認エラー:', error as Error);
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const command = CommandFactory.createSignInCommand(email, password);
      
      return await client.send(command);
    } catch (error) {
      logger.error('ログインエラー:', error as Error);
      throw error;
    }
  }
};

// 既存のエクスポートを維持するためのエイリアス
export const { signUp, confirmSignUp, signIn } = AuthService;