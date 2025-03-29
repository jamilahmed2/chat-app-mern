import { createAsyncThunk } from '@reduxjs/toolkit';
import { DELETE_MESSAGE, GET_MESSAGES, SEND_MESSAGE } from '../actionTypes/actionTypes';
import { deleteMessage, getMessages, sendMessage } from '../api/api';

export const getMessagesAction = createAsyncThunk(
    GET_MESSAGES,
    async (userId, thunkAPI) => {
        try {
            const response = await getMessages(userId);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
        }
    }
);

export const sendMessageAction = createAsyncThunk(
    SEND_MESSAGE,
    async ({ receiver, message }, thunkAPI) => {
        try {
            const response = await sendMessage({ receiver, message })
            return response.data.newMessage;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to send message');
        }
    }
);

export const deleteMessageAction = createAsyncThunk(
    DELETE_MESSAGE,
    async (messageId, thunkAPI) => {
        try {
            await deleteMessage(messageId)
            return messageId;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete message');
        }
    }
);