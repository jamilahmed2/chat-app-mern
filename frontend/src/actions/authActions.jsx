import { createAsyncThunk } from "@reduxjs/toolkit";
import { login,logout, register, verifyOTP, resendOTP, forgotPassword,resetPassword } from "../api/api";
import { AUTH_LOGIN, AUTH_REGISTER, AUTH_VERIFY_OTP, AUTH_FORGOT_PASSWORD, AUTH_RESEND_OTP, AUTH_RESET_PASSWORD, AUTH_LOGOUT } from "../actionTypes/actionTypes";

// Register
export const registerUser = createAsyncThunk(AUTH_REGISTER, async (userData, thunkAPI) => {
  try {
    const response = await register(userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data.message);
  }
});

// Login
export const loginUser = createAsyncThunk(AUTH_LOGIN, async (userData, thunkAPI) => {
  try {
    const response = await login(userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
  }
});


// Verify OTP
export const verifyOTPAction = createAsyncThunk(AUTH_VERIFY_OTP, async (otpData, thunkAPI) => {
  try {
    const response = await verifyOTP(otpData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "OTP verification failed");
  }
});

// Resend OTP
export const resendOTPAction = createAsyncThunk(AUTH_RESEND_OTP, async (email, thunkAPI) => {
  try {
    // console.log("📩 Resend OTP Request Email:", email); // Debugging
    const response = await resendOTP(email); // ✅ Fix: Pass directly as an object
    return response.data;
  } catch (error) {
    // console.error("❌ Resend OTP Error:", error.response?.data || error.message);
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to resend OTP");
  }
});


// Forgot Password
export const forgotPasswordAction = createAsyncThunk(AUTH_FORGOT_PASSWORD, async (email, thunkAPI) => {
  try {
    const response = await forgotPassword( email );
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to send password reset email");
  }
});

// Reset Password
export const resetPasswordAction = createAsyncThunk(AUTH_RESET_PASSWORD, async (resetData, thunkAPI) => {
  try {
    const response = await resetPassword(resetData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to reset password");
  }
});

// Logout
export const logoutUserAction = createAsyncThunk(AUTH_LOGOUT, async (_, thunkAPI) => {
  try {
    const response = await logout();
    return {};
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Logout failed");
  }
});