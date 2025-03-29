export const AUTH_LOGIN = "auth/login";
export const AUTH_LOGOUT = "auth/logout";
export const AUTH_REGISTER = "auth/register";
export const AUTH_VERIFY_OTP = "auth/verify-otp";
export const AUTH_FORGOT_PASSWORD = "auth/forgot-password";
export const AUTH_RESEND_OTP = "auth/resend-otp";
export const AUTH_RESET_PASSWORD = "auth/reset-password";

export const USER_PROFILE_UPDATE = "users/update-profile";
export const USER_PASSWORD_UPDATE = "users/update-password";
export const USER_NAME_UPDATE = "users/update-user-name"; 
export const USER_EMAIL_UPDATE = "users/update-user-email"; 
export const USER_VERIFY_EMAIL_OTP ="users/verify-user-email"
export const USER_EMAIL_RESEND_OTP ="users/resend-user-email-otp"
export const USER_UPLOAD_PROFILE_IMAGE = "users/upload-profile-image";
export const GET_ALL_USERS = "users/get-all-users"

export const ADMIN_GET_ALL_USERS = "admin/getAllUsers"
export const ADMIN_DELETE_USER = "admin/deleteUser"
export const ADMIN_UPLOAD_PROFILE_IMAGE = "admin/upload-admin-profile-image"
export const ADMIN_NAME_UPDATE = "admin/update-name"; 
export const ADMIN_EMAIL_UPDATE = "admin/update-email"; 
export const ADMIN_VERIFY_EMAIL_OTP ="admin/verify-email"
export const ADMIN_EMAIL_RESEND_OTP ="admin/resend-email-otp"
export const ADMIN_PASSWORD_UPDATE = "admin/passwordUpdate";

export const ADMIN_GET_REPORTED_USERS = "admin/reported-users";
export const ADMIN_CLEAR_REPORTS = "admin/clear-reports";
export const ADMIN_BAN_USER = "admin/ban";
export const ADMIN_UNBAN_USER = "admin/unban";
export const ADMIN_GET_BANNED_USERS = "admin/getBannedUsers";

export const SEND_FRIEND_REQUEST = 'friends/send';
export const ACCEPT_FRIEND_REQUEST = 'friends/accept';
export const DECLINE_FRIEND_REQUEST = 'friends/decline';
export const GET_FRIEND_REQUESTS = 'friends/requests';
export const GET_FRIENDS = 'friends/list';
export const REMOVE_FRIEND = 'friends/remove';

export const GET_NOTIFICATIONS = 'notifications/getAll';
export const MARK_AS_READ = 'notifications/markAsRead';
export const DELETE_NOTIFICATION = 'notifications/delete';
export const DELETE_ALL_NOTIFICATION = 'notifications/deleteAll';

// export const GET_MESSAGES = 'chats';
// export const SEND_MESSAGE = 'chats/send';
// export const DELETE_MESSAGE = 'chats/delete';
// Add these with your other action types
export const GET_MESSAGES = 'chat/getMessages';
export const SEND_MESSAGE = 'chat/sendMessage';
export const DELETE_MESSAGE = 'chat/deleteMessage';