import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { DELETE_ALL_NOTIFICATION, DELETE_NOTIFICATION, GET_NOTIFICATIONS, MARK_AS_READ } from '../actionTypes/actionTypes';
import { deleteAllNotifications, deleteNotification, getNotifications, markNotificationAsRead } from '../api/api';

// Async Actions
export const getNotificationsAction = createAsyncThunk(
    GET_NOTIFICATIONS,
    async (_, thunkAPI) => {
        try {
            const { data } = await getNotifications();
            return data;
          } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
          }
    }
);

export const markNotificationAsReadAction = createAsyncThunk(
    MARK_AS_READ,
    async (notificationId, thunkAPI) => {
        try {
            await markNotificationAsRead(notificationId);
            return notificationId;
          } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
          }
    }
);

export const deleteNotificationAction = createAsyncThunk(
    DELETE_NOTIFICATION,
    async (notificationId, thunkAPI) => {
        try {
            await deleteNotification(notificationId);
            return notificationId;
        } catch (error) {
            console.error('Delete notification error:', error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
        }
    }
);

export const deleteAllNotificationsAction = createAsyncThunk(
    DELETE_ALL_NOTIFICATION,
    async (_, thunkAPI) => {
        try {
            const { data } = await deleteAllNotifications();
            return data;
        } catch (error) {
            console.error('Delete all notifications error:', error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete all notifications');
        }
    }
);
