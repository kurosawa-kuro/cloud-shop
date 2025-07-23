import { prisma } from '@/lib/database/prisma';
import { logger } from '@/lib/logger';
import { BaseApiHandler } from '@/lib/api/handler';
import { getChatCompletion, getPersonalizedRecommendation } from '@/lib/ai/openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

class ChatbotHandler extends BaseApiHandler {

  async POST(request: Request) {
    try {
      console.log('ChatbotHandler POST');

      // ユーザーIDの取得（実際の認証システムに合わせて調整）
      const userId = "c7e49a78-d031-70c4-4b79-8b34ccf7c684";

      const user = await prisma.user.findUnique({ 
        where: { id: userId! } 
      });

      console.log('user', user);
      
      if (!user) {
        return this.errorResponse('ユーザーIDが存在しません', 400);
      }

      // リクエストボディの取得
      const body = await request.json();
      const { messages } = body;
      
      if (!messages || !Array.isArray(messages)) {
        return this.errorResponse('メッセージが正しく指定されていません', 400);
      }

      // 最新のユーザーメッセージを取得
      const latestUserMessage = messages
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';

      let aiResponse: string;

      // 「お勧め」「おすすめ」「オススメ」などのキーワードを含むか確認
      if (
        latestUserMessage.includes('お勧め') || 
        latestUserMessage.includes('おすすめ') || 
        latestUserMessage.includes('オススメ') ||
        latestUserMessage.includes('recommend')
      ) {
        // パーソナライズされたレコメンデーションを取得
        aiResponse = await getPersonalizedRecommendation(userId, latestUserMessage);
      } else {
        // 通常のチャット応答を取得
        aiResponse = await getChatCompletion(messages as ChatCompletionMessageParam[]);
      }
      
      // // チャット履歴をデータベースに保存（オプション）
      // await prisma.userActionLog.create({
      //   data: {
      //     userId: user.id,
      //     actionType: ActionType.CHATBOT_INTERACTION,
      //     metadata: { 
      //       message: latestUserMessage,
      //       response: aiResponse.substring(0, 255) // 長すぎる場合は切り詰める
      //     }
      //   }
      // });

      // 成功レスポンスを返す
      return this.successResponse({ 
        response: aiResponse 
      }, 200);
      
    } catch (error) {
      logger.error('チャットボットエラー:', error as Error);
      return this.handleError(error, 'チャットボットの処理に失敗しました');
    }
  }
}

const handler = new ChatbotHandler();

export const POST = handler.POST.bind(handler);