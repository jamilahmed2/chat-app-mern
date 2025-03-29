import { createAsyncThunk } from "@reduxjs/toolkit";
import { uploadUserProfileImage, updatePassword, updateUserEmail, updateUserName, userEmailResendOTP, verifyUserEmailOTP, getAllUsersHome } from "../api/api";
import { GET_ALL_USERS, USER_EMAIL_RESEND_OTP, USER_EMAIL_UPDATE, USER_NAME_UPDATE, USER_PASSWORD_UPDATE, USER_UPLOAD_PROFILE_IMAGE, USER_VERIFY_EMAIL_OTP } from "../actionTypes/actionTypes";

// Get All Users
export const getAllUsersHomeAction = createAsyncThunk(GET_ALL_USERS, async (_, thunkAPI) => {
  try {
    const response = await getAllUsersHome();
    // console.log("Users from API:", response.data); // Debugging
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch users");
  }
});

// Add this with other actions
export const uploadProfileImageAction = createAsyncThunk(
  USER_UPLOAD_PROFILE_IMAGE,
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await uploadUserProfileImage(formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload image");
    }
  }
);

// Update User Password
export const updateUserPasswordAction = createAsyncThunk(USER_PASSWORD_UPDATE, async (passwordData, thunkAPI) => {
  try {
    const response = await updatePassword(passwordData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Unknown error");
  }
});

// ✅ Update user Name
export const updateUserNameAction = createAsyncThunk(
  USER_NAME_UPDATE,
  async ({ name }, { rejectWithValue }) => {
    try {
      const { data } = await updateUserName({ name });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

// ✅ Update user Email (Triggers OTP)
export const updateUserEmailAction = createAsyncThunk(
  USER_EMAIL_UPDATE,
  async (email, { rejectWithValue }) => {
    try {
      // console.log("Dispatching email update request for:", email);
      const { data } = await updateUserEmail(email); // ✅ Correct call
      // console.log("Response from API:", data);
      return { ...data, tempEmail: email };
    } catch (error) {
      console.error("Update email error:", error.response?.data);
      return rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

// Resend OTP
export const userEmailResendOTPAction = createAsyncThunk(USER_EMAIL_RESEND_OTP, async (email, thunkAPI) => {
  try {
    const response = await userEmailResendOTP(email); // Ensure email is sent correctly
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to resend OTP");
  }
});

export const userEmailOTPAction = createAsyncThunk(USER_VERIFY_EMAIL_OTP, async ({ email, otp }, thunkAPI) => {
  try {
    const { data } = await verifyUserEmailOTP({ email, otp });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "OTP verification failed");
  }
});