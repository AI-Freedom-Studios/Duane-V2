import { create } from 'zustand';
import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email, password) => {
    const res: any = await api.post('/auth/login', { email, password });
    api.setToken(res.accessToken);
    set({ user: res.user });
  },
  register: async (email, password, name) => {
    const res: any = await api.post('/auth/register', { email, password, name });
    api.setToken(res.accessToken);
    set({ user: res.user });
  },
  logout: () => {
    api.setToken(null);
    set({ user: null });
  },
  loadUser: async () => {
    try {
      const token = api.getToken();
      if (!token) { set({ isLoading: false }); return; }
      const user: any = await api.get('/auth/me');
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
