// (developerTools)/components/ErrorSimulator.tsx
export const ErrorSimulator = () => {
    const triggerError = (type: string) => {
      switch (type) {
        case '404':
          // 404エラーの発生
          break;
        case 'network':
          // ネットワークエラーの発生
          break;
        // その他のエラーパターン
      }
    };
  
    return (
      <div className="error-simulator">
        <button onClick={() => triggerError('404')}>
          404エラー発生
        </button>
        <button onClick={() => triggerError('network')}>
          ネットワークエラー発生
        </button>
      </div>
    );
  };