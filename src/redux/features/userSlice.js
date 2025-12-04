import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    
    Login: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    setUser: (state, action) => {
      state.user = action.payload; 
    },
  },
});

export const { Login, logout, setUser } = userSlice.actions;

export default userSlice.reducer;
