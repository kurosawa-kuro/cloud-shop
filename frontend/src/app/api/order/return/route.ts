import { BaseApiHandler } from '@/lib/api/handler';

class ReturnHandler extends BaseApiHandler {
  async POST() {
    try {
      console.log("返品リクエストを受け付けました");

      return this.successResponse({ message: '返品リクエストに成功しました' });
    } catch (error) {
      return this.handleError(error, '返品リクエストに失敗しました');
    }
  }
}

const handler = new ReturnHandler();
export const POST = handler.POST.bind(handler);