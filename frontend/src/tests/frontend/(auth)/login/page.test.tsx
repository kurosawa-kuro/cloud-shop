import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import * as jose from 'jose';

// Mock fetch for API calls
global.fetch = jest.fn();

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Zustand storeのモックを修正
const mockSetUser = jest.fn();
jest.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      setUser: mockSetUser
    }))
  }
}));

// JOSEのモック
jest.mock('jose', () => ({
  decodeJwt: jest.fn()
}));

describe('LoginPage', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('正常にログインが完了した場合、/productsにリダイレクトされる', async () => {
    // モックの戻り値を設定
    const mockIdToken = 'mock-id-token';
    const mockDecodedToken = {
      email: 'test@example.com',
      sub: 'test-user-id'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, idToken: mockIdToken })
    });

    (jose.decodeJwt as jest.Mock).mockReturnValueOnce(mockDecodedToken);

    render(<LoginPage />);

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' }
    });

    // フォームを送信
    fireEvent.submit(screen.getByRole('button', { name: 'ログイン' }));

    // 期待される動作の検証
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      }));
      expect(mockSetUser).toHaveBeenCalledWith({
        email: mockDecodedToken.email,
        userId: mockDecodedToken.sub,
        idToken: mockIdToken
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/products');
    });
  });

  it('ログインに失敗した場合、エラーメッセージが表示される', async () => {
    // ログイン失敗のモックを設定
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'ログインに失敗しました' })
    });

    render(<LoginPage />);

    // フォームに値を入力
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'password123' }
    });

    // フォームを送信
    fireEvent.submit(screen.getByRole('button', { name: 'ログイン' }));

    // エラーメッセージの表示を確認
    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument();
    });
  });
});