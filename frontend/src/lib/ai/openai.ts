// import { OpenAI } from 'openai';
// import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
// openaiパッケージとprocess.env利用を全てコメントアウト

// 型定義のダミー
export type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// OpenAIのモデル名を定義
const GPT_MODEL_NAME = "gpt-4o-mini";

// OpenAIクライアントのインスタンスを作成
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

/**
 * OpenAIのチャット完了APIを呼び出す関数（ダミー実装）
 * @param messages - チャットメッセージの配列
 * @returns AIの応答テキスト
 */
export async function getChatCompletion(messages: ChatCompletionMessageParam[]) {
  // 本来はOpenAI API呼び出し
  return "（ダミー応答）おすすめ商品はA・B・Cです。";
}

/**
 * ユーザーの購入履歴とトップページの商品情報を取得し、
 * パーソナライズされたレコメンデーションを生成する（ダミー実装）
 * @param userId - ユーザーID
 * @param userMessage - ユーザーからのメッセージ
 * @returns AIの応答テキスト
 */
export async function getPersonalizedRecommendation(userId: string, userMessage: string) {
  // 本来はDBやOpenAI API呼び出し
  return "（ダミー応答）あなたにおすすめの商品はサンプル商品A・B・Cです。";
}