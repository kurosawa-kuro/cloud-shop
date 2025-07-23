import { BaseApiHandler } from '@/lib/api/handler';

class ReviewHandler extends BaseApiHandler {
  async POST() {
    try {
      console.log("レビュー投稿リクエストを受け付けました");

      return this.successResponse({ message: 'レビュー投稿に成功しました' });
    } catch (error) {
      return this.handleError(error, 'レビュー投稿に失敗しました');
    }
  }
}

const handler = new ReviewHandler();
export const POST = handler.POST.bind(handler);