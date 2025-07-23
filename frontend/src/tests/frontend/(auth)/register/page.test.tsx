import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/app/(auth)/register/page';
import { signUp } from '@/lib/auth/cognito';

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/cognito', () => ({
  signUp: jest.fn(),
}));

describe('RegisterPage', () => {
  // テストごとにモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRouter = {
    push: jest.fn(),
  };

  // useRouterのモックを設定
  (useRouter as jest.Mock).mockReturnValue(mockRouter);

  it('フォームが正しくレンダリングされること', () => {
    render(<RegisterPage />);
    
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アカウント作成' })).toBeInTheDocument();
  });

  it('入力フィールドの値が更新されること', () => {
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('Password123');
  });

  it('正常に登録が完了した場合、確認ページにリダイレクトされること', async () => {
    (signUp as jest.Mock).mockResolvedValueOnce({});
    
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('test@example.com', 'Password123');
      expect(mockRouter.push).toHaveBeenCalledWith('/confirm?email=test%40example.com');
    });
  });

  it('登録に失敗した場合、エラーメッセージが表示されること', async () => {
    const errorMessage = 'ユーザー登録に失敗しました';
    (signUp as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const submitButton = screen.getByRole('button', { name: 'アカウント作成' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});