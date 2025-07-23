import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  email: string | null;
  userId: string | null;
}

interface AuthStore {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
  resetStore: () => void;
}

const initialState = {
  user: {
    email: null,
    userId: null
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set(() => ({ user })),
      clearUser: () => {
        // ローカルストレージのクリア
        localStorage.removeItem('auth-storage');
        // クッキーのクリア
        document.cookie = 'idToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        set(() => initialState);
      },
      resetStore: () => {
        localStorage.removeItem('auth-storage');
        document.cookie = 'idToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        set(() => initialState);
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        console.log('Hydrated state:', state);
      }
    }
  )
);

// ユーザー情報を取得するためのヘルパー関数
export const getAuthUser = () => useAuthStore.getState().user; 