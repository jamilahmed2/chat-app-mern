import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllUsers, deleteUser, updateAdminName, updateAdminEmail, updateAdminPassword, banUser, getReportedUsers, clearReports, unbanUser, getBannedUsers,verifyEmailOTP, adminEmailResendOTP, uploadAdminProfileImage } from "../api/api";
import { ADMIN_PASSWORD_UPDATE, ADMIN_GET_ALL_USERS, ADMIN_DELETE_USER, ADMIN_CLEAR_REPORTS, ADMIN_BAN_USER, ADMIN_GET_REPORTED_USERS, ADMIN_UNBAN_USER, ADMIN_GET_BANNED_USERS, ADMIN_NAME_UPDATE, ADMIN_EMAIL_UPDATE, ADMIN_VERIFY_EMAIL_OTP, ADMIN_EMAIL_RESEND_OTP, ADMIN_UPLOAD_PROFILE_IMAGE } from "../actionTypes/actionTypes";


// Get All Users
export const getAllUsersAction = createAsyncThunk(ADMIN_GET_ALL_USERS, async (_, thunkAPI) => {
  try {
    const response = await getAllUsers();
    // console.log("Users from API:", response.data); // Debugging
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch users");
  }
});

export const uploadAdminProfileImageAction = createAsyncThunk(
  ADMIN_UPLOAD_PROFILE_IMAGE,
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await uploadAdminProfileImage(formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload image");
    }
  }
);

// ✅ Update Admin Name
export const updateAdminNameAction = createAsyncThunk(
  ADMIN_NAME_UPDATE,
  async ({ name }, { rejectWithValue }) => {
    try {
      const { data } = await updateAdminName({ name });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

// ✅ Update Admin Email (Triggers OTP)
export const updateAdminEmailAction = createAsyncThunk(
  ADMIN_EMAIL_UPDATE,
  async (email, { rejectWithValue }) => {
    try {
      // console.log("Dispatching email update request for:", email);
      const { data } = await updateAdminEmail(email); // ✅ Correct call
      // console.log("Response from API:", data);
      return { ...data, tempEmail: email };
    } catch (error) {
      console.error("Update email error:", error.response?.data);
      return rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

// Resend OTP
export const adminEmailResendOTPAction = createAsyncThunk(ADMIN_EMAIL_RESEND_OTP, async (email, thunkAPI) => {
  try {
    const response = await adminEmailResendOTP(email); // Ensure email is sent correctly
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to resend OTP");
  }
});

export const verifyEmailOTPAction = createAsyncThunk(ADMIN_VERIFY_EMAIL_OTP, async ({ email, otp }, thunkAPI) => {
  try {
    const { data } = await verifyEmailOTP({ email, otp });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "OTP verification failed");
  }
});


// Update Admin Password
export const updateAdminPasswordAction = createAsyncThunk(ADMIN_PASSWORD_UPDATE, async (passwordData, thunkAPI) => {
  try {
    const response = await updateAdminPassword(passwordData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update password");
  }
});

// Delete User
export const deleteUserAction = createAsyncThunk(
  ADMIN_DELETE_USER,
  async (userId, thunkAPI) => {
    try {
      await deleteUser(userId);
      return userId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to delete user");
    }
  }
);


// Get Reported Users
export const getReportedUsersAction = createAsyncThunk(ADMIN_GET_REPORTED_USERS, async (_, thunkAPI) => {
  try {
    const response = await getReportedUsers();
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch reported users");
  }
});

// Ban User
export const banUserAction = createAsyncThunk(ADMIN_BAN_USER, async (userId, thunkAPI) => {
  try {
    await banUser(userId); // Ban user in the backend
    const response = await getBannedUsers(); // Fetch the updated banned users list
    return response.data; // Return updated list
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to ban user");
  }
});

// Clear Reports
export const clearReportsAction = createAsyncThunk(ADMIN_CLEAR_REPORTS, async (userId, thunkAPI) => {
  try {
    const response = await clearReports(userId);
    return response.data; // Make sure the backend returns the updated user object
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to clear reports");
  }
});
export const getBannedUsersAction = createAsyncThunk(ADMIN_GET_BANNED_USERS, async (userId, thunkAPI) => {
  try {
    const response = await getBannedUsers(); // ✅ Add await
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch banned users");
  }
});
export const unBanUserAction = createAsyncThunk(ADMIN_UNBAN_USER, async (userId, thunkAPI) => {
  try {
    const response = await unbanUser(userId);
    return response.data; // Make sure the backend returns the updated user object
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to clear reports");
  }
});

