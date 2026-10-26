import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AdminUser {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  avatar?: string;
  approvalStatus?: string;
  designation?: string;
  permissions?: string[];
}
export interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user:            JSON.parse(localStorage.getItem('admin_user') || 'null'),
  accessToken:     localStorage.getItem('admin_token'),
  refreshToken:    localStorage.getItem('admin_refresh_token'),
  isAuthenticated: !!localStorage.getItem('admin_token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AdminUser; accessToken: string; refreshToken?: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('admin_refresh_token', action.payload.refreshToken);
      }
      state.isAuthenticated = true;
      localStorage.setItem('admin_token', action.payload.accessToken);
      localStorage.setItem('admin_user',  JSON.stringify(action.payload.user));
    },
    updateToken(state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) {
      state.accessToken = action.payload.accessToken;
      localStorage.setItem('admin_token', action.payload.accessToken);
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('admin_refresh_token', action.payload.refreshToken);
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    },
  },
});

export const { setCredentials, updateToken, logout } = authSlice.actions;
export default authSlice.reducer;
