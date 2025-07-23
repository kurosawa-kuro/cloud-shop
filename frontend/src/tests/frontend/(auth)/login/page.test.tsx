import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { signIn } from '@/lib/auth/cognito';
import * as jose from 'jose';

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/auth/cognito', () => ({
  signIn: jest.fn()
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

    (signIn as jest.Mock).mockResolvedValueOnce({
      AuthenticationResult: {
        IdToken: mockIdToken
      }
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
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
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
    (signIn as jest.Mock).mockRejectedValueOnce(new Error('Login failed'));

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