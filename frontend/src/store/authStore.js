import { create } from 'zustand';
import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set, get) => ({
  user: null, 
  isAuthenticated: false,
  isInitializing: true, // Specifically for the first check
  isLoading: false, 
  error: null,

  initAuthListener: async () => {
    try {
      set({ isInitializing: true });
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Fetch fresh user profile
        const { data } = await api.get('/user/profile');
        set({ 
          user: data, 
          isAuthenticated: true, 
          isInitializing: false 
        });
      } else {
        set({ user: null, isAuthenticated: false, isInitializing: false });
      }
    } catch (error) {
      console.error("Error initializing auth: ", error);
      // Token might be invalid or expired
      await AsyncStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  requestOTP: async (email, isLogin) => {
    try {
      set({ isLoading: true, error: null });
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const { data } = await api.post(endpoint, { email });
      set({ isLoading: false });
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to send OTP";
      set({ error: errorMessage, isLoading: false });
      return { success: false };
    }
  },

  resendOTP: async (email, isLogin) => {
    // Reuses the same logic as requestOTP
    return get().requestOTP(email, isLogin);
  },

  verifyOTP: async (email, otp, isLogin, signupData = null) => {
    try {
        set({ isLoading: true, error: null });
        const endpoint = isLogin ? '/auth/login/verify' : '/auth/verify-otp';
        const payload = isLogin ? { email, otp } : { email, otp, ...signupData };

        const { data } = await api.post(endpoint, payload);
        
        await AsyncStorage.setItem('token', data.token);
        set({ 
          user: data.user, 
          isAuthenticated: true,
          isLoading: false 
        });
        return true;
    } catch (error) {
        const errorMessage = error.response?.data?.error || "Invalid OTP";
        set({ error: errorMessage, isLoading: false });
        return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  }
}));

export default useAuthStore;
