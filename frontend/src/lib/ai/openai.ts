import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { prisma } from '@/lib/database/prisma';

// OpenAIのモデル名を定義
const GPT_MODEL_NAME = "gpt-4o-mini";

// OpenAIクライアントのインスタンスを作成
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAIのチャット完了APIを呼び出す関数
 * @param messages - チャットメッセージの配列
 * @returns AIの応答テキスト
 */
export async function getChatCompletion(messages: ChatCompletionMessageParam[]) {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL_NAME,
      messages: messages,
    });
    
    return response?.choices[0]?.message?.content || "応答を生成できませんでした。";
  } catch (error) {
    console.error("OpenAI API呼び出しエラー:", error);
    throw new Error("AIサービスとの通信中にエラーが発生しました。");
  }
}

/**
 * ユーザーの購入履歴とトップページの商品情報を取得し、
 * パーソナライズされたレコメンデーションを生成する
 * @param userId - ユーザーID
 * @param userMessage - ユーザーからのメッセージ
 * @returns AIの応答テキスト
 */
export async function getPersonalizedRecommendation(userId: string, userMessage: string) {
  try {
    console.log('getPersonalizedRecommendation');
    // 1. ユーザーの購入履歴を取得
    const orderHistory = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { orderedAt: 'desc' },
      take: 5 // 直近5件の注文を取得
    });
    console.log('orderHistory', orderHistory);

    // 2. トップページの商品情報を取得
    const topPageProducts = await prisma.topPageDisplay.findMany({
      where: { 
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gt: new Date() } }
        ]
      },
      include: {
        product: true
      },
      orderBy: { priority: 'asc' },
      take: 10 // 優先度の高い10件を取得
    });

    // 3. ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // 4. AIに送信するコンテキスト情報を構築
    let purchasedProducts = "購入履歴なし";
    if (orderHistory.length > 0) {
      purchasedProducts = orderHistory
        .flatMap(order => order.orderItems.map(item => 
          `商品名: ${item.product.name}, 価格: ${item.product.price}円, 購入日: ${order.orderedAt.toLocaleDateString('ja-JP')}`
        ))
        .join('\n');
    }

    let recommendedProducts = "おすすめ商品なし";
    if (topPageProducts.length > 0) {
      recommendedProducts = topPageProducts
        .map(display => {
          const price = display.specialPrice || display.product?.price || display.productPrice;
          return `商品名: ${display.product?.name || display.productName}, 価格: ${price}円, タイプ: ${display.displayType}`;
        })
        .join('\n');
    }

 
    // 5. AIに送信するメッセージを構築
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `あなたはECサイトの商品レコメンデーションAIアシスタントです。
ユーザーの購入履歴とサイトのおすすめ商品情報を基に、パーソナライズされた商品提案を行ってください。
提案は具体的な商品名と、なぜその商品がユーザーに合っているかの理由を含めてください。
丁寧で親しみやすい日本語で回答し、最大3つの商品を推薦してください。

【ユーザー情報】
メールアドレス: ${user?.email || '不明'}

【購入履歴】
${purchasedProducts}

【現在のおすすめ商品】
${recommendedProducts}`
    };

    const userMessageObj: ChatCompletionMessageParam = {
      role: "user",
      content: userMessage
    };
    
    // 6. OpenAI APIを呼び出してレコメンデーションを取得
    const messages: ChatCompletionMessageParam[] = [systemMessage, userMessageObj];
    const aiResponse = await getChatCompletion(messages);
    console.log('★★★ Check ★★★');
    console.log('aiResponse', aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("レコメンデーション生成エラー:", error);
    throw new Error("商品レコメンデーションの生成に失敗しました。");
  }
}