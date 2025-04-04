import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL + "/api",
  timeout: 10000,
});

// Attach Authorization Token to Every Request
API.interceptors.request.use((req) => {
  const user = localStorage.getItem("user");
  if (user) {
    req.headers.Authorization = `Bearer ${JSON.parse(user).token}`;
  }
  return req;
});

// Auth API Calls
export const login = (userData) => API.post("/auth/login", userData);
export const register = (userData) => API.post("/auth/register", userData);
export const verifyOTP = (otpData) => API.post("/auth/verify-otp", otpData);
export const resendOTP = (email) => API.post("/auth/resend-otp", { email });
export const forgotPassword = (email) => API.post("/auth/forgot-password", { email });
export const resetPassword = (resetData) => API.post("/auth/reset-password", resetData);
export const logout = () => API.post('/auth/logout', {});


// User API Calls
export const getUser = (id) => API.get(`/users/get-user/${id}`);
export const getAllUsersHome = () => API.get("/users/get-all-users");
export const updateUserProfile = (userData) => API.put("/users/update-profile", userData);
export const updatePassword = (passwordData) => API.put("/users/update-password", passwordData);
export const updateUserName = (nameData) => API.put("/users/update-user-name", nameData);
export const updateUserEmail = (email) => API.put("/users/update-user-email", email);
export const userEmailResendOTP = (email) => API.post("/users/resend-user-email-otp", { email });
export const verifyUserEmailOTP = (verificationData) => API.post("/users/verify-user-email", verificationData);
export const uploadUserProfileImage = (formData) => API.post('/users/upload-user-profile-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const blockUser = (userId) => API.post('/users/block', { userId });
export const unblockUser = (userId) => API.post('/users/unblock', { userId });
export const reportUser = (data) => API.post('/users/report', data);


// Admin API Calls

export const getAllUsers = () => API.get("/admin/getAllUsers");
export const uploadAdminProfileImage = (formData) => API.post('/admin/upload-admin-profile-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adminEmailResendOTP = (email) => API.post("/admin/resend-email-otp", { email });
export const getBannedUsers = () => API.get("/admin/getBannedUsers");
export const getReportedUsers = () => API.get("/admin/reported-users");
export const banUser = (userId) => API.put(`/admin/ban/${userId}`);
export const clearReports = (userId) => API.put(`/admin/clear-reports/${userId}`);
export const unbanUser = (userId) => API.put(`/admin/unban/${userId}`);
export const deleteUser = (id) => API.delete(`/admin/deleteUser/${id}`);
export const updateAdminName = (nameData) => API.put("/admin/update-name", nameData);
export const updateAdminEmail = (email) => API.put("/admin/update-email", email);
export const verifyEmailOTP = (verificationData) => API.post("/admin/verify-email", verificationData);
export const updateAdminPassword = (passwordData) => API.put("/admin/updateAdminPassword", passwordData);
export const getBlockedUsersInfo = () => API.get("/admin/blocked-users");


// friend api call
export const sendFriendRequest = (data) => API.post("/friends/send", data);
export const acceptFriendRequest = (data) => API.post("/friends/accept", data);
export const declineFriendRequest = (data) => API.post("/friends/decline", data);
export const getFriendReuests = () => API.get("/friends/requests");
export const getFriends = () => API.get("/friends/list");
export const removeFriend = (data) => API.post("/friends/remove", data);
// notification api call
export const getNotifications = () => API.get("/notifications");
export const markNotificationAsRead = () => API.put(`/notifications/${notificationId}/read`);
export const deleteNotification = (notificationId) => API.delete(`/notifications/${notificationId}`);
export const deleteAllNotifications = () => API.delete('/notifications/all');

// Message
export const getMessages = (userId) => API.get(`/chats/${userId}`);
// export const sendMessage = (data) => API.post('/chats/send', data);
export const deleteMessage = (messageId) => API.delete(`/chats/${messageId}`);
export const sendMessage = (data) => {
  if (data instanceof FormData) {
    return API.post('/chats/send', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  } else {
    return API.post('/chats/send', data);
  }
};
export const markMessagesAsDelivered = (senderId) =>
  API.put(`/chats/delivered/${senderId}`);
export const markMessagesAsRead = (senderId) => API.put(`/chats/read/${senderId}`);
export const getUnreadMessageCounts = () => API.get('/chats/unread-counts');

export const addReaction = (messageId, emoji) => 
  API.post(`/chats/${messageId}/reactions`, { emoji });

export const removeReaction = (messageId) => 
  API.delete(`/chats/${messageId}/reactions`);
// Admin blocked users endpoints
export const adminGetBlockedUsers = () => API.get("/admin/admin-blocked-users");
export const adminGetBlockStatus = (userId, targetUserId) => API.get(`/admin/admin-block-status/${userId}/${targetUserId}`);
export const adminUnblockUser = (data) => API.post("/admin/admin-unblock-user", data);

export default API;