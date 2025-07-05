import { create } from 'zustand';

interface LayoutState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  profileOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setProfileOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  closeAllModals: () => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  sidebarOpen: false,
  searchOpen: false,
  notificationsOpen: false,
  profileOpen: false,
  theme: 'light',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  setProfileOpen: (open) => set({ profileOpen: open }),
  setTheme: (theme) => set({ theme }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  closeAllModals: () => set({
    searchOpen: false,
    notificationsOpen: false,
    profileOpen: false,
  }),
}));
