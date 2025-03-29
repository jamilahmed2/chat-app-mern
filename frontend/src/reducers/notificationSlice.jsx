import { createSlice } from "@reduxjs/toolkit";
import { getNotificationsAction, markNotificationAsReadAction, deleteNotificationAction, deleteAllNotificationsAction } from "../actions/notificationActions";

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        loading: false,
        error: null
    },
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
        },
        clearNotificationError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get notifications
            .addCase(getNotificationsAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getNotificationsAction.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload;
            })
            .addCase(getNotificationsAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Mark as read
            .addCase(markNotificationAsReadAction.fulfilled, (state, action) => {
                const notification = state.notifications.find(n => n._id === action.payload);
                if (notification) {
                    notification.read = true;
                }
            })
            .addCase(markNotificationAsReadAction.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Delete notification
            .addCase(deleteNotificationAction.pending, (state) => {
                state.error = null;
            })
            .addCase(deleteNotificationAction.fulfilled, (state, action) => {
                state.notifications = state.notifications.filter(
                    n => n._id !== action.payload
                );
            })
            .addCase(deleteNotificationAction.rejected, (state, action) => {
                state.error = action.payload;
            })
            // Delete all notifications
            .addCase(deleteAllNotificationsAction.pending, (state) => {
                state.error = null;
            })
            .addCase(deleteAllNotificationsAction.fulfilled, (state) => {
                state.notifications = [];
            })
            .addCase(deleteAllNotificationsAction.rejected, (state, action) => {
                state.error = action.payload;
            });
    }
});
export { getNotificationsAction, markNotificationAsReadAction, deleteNotificationAction, deleteAllNotificationsAction }
export const { addNotification,clearNotificationError  } = notificationSlice.actions;
export default notificationSlice.reducer;