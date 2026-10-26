import { createSlice } from '@reduxjs/toolkit';
export interface AppState { sidebarOpen: boolean; }
const appSlice = createSlice({
  name: 'app',
  initialState: { sidebarOpen: true } as AppState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
  },
});
export const { toggleSidebar } = appSlice.actions;
export default appSlice.reducer;
