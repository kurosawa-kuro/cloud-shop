import { BaseApiHandler } from '@/lib/api/handler';

class readdItemsHandler extends BaseApiHandler {
  async POST() {
    try {
      console.log("再度購入リクエストを受け付けました");

      return this.successResponse({ message: '再度購入リクエストに成功しました' });
    } catch (error) {
      return this.handleError(error, '再度購入リクエストに失敗しました');
    }
  }
}

const handler = new readdItemsHandler();
export const POST = handler.POST.bind(handler);