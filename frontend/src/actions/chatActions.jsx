import { createAsyncThunk } from '@reduxjs/toolkit';
import { ADD_REACTION, DELETE_MESSAGE, GET_MESSAGES,  GET_UNREAD_MESSAGE_COUNTS,  MESSAGE_MARK_AS_DELIVERED,  MESSAGE_MARK_AS_READ,  REMOVE_REACTION,  SEND_MESSAGE } from '../actionTypes/actionTypes';
import { addReaction, deleteMessage, getMessages, getUnreadMessageCounts, markMessagesAsDelivered, markMessagesAsRead, removeReaction, sendMessage } from '../api/api';

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
    async ({ receiver, message, media }, thunkAPI) => {
        try {
            // Create FormData if media is present
            if (media) {
                const formData = new FormData();
                formData.append('receiver', receiver);
                if (message) formData.append('message', message);
                formData.append('media', media);
                
                const response = await sendMessage(formData);
                return response.data.newMessage;
            } else {
                // Regular text message
                const response = await sendMessage({ receiver, message });
                return response.data.newMessage;
            }
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

export const getUnreadCountsAction = createAsyncThunk(
    GET_UNREAD_MESSAGE_COUNTS,
    async (_, thunkAPI) => {
        try {
            // console.log("Fetching unread counts");
            const response = await getUnreadMessageCounts();
            // console.log("Unread counts response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching unread counts:", error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch unread counts');
        }
    }
);

export const markAsDeliveredAction = createAsyncThunk(
    MESSAGE_MARK_AS_DELIVERED,
    async (senderId, thunkAPI) => {
        try {
            await markMessagesAsDelivered(senderId);
            return senderId;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark messages as delivered');
        }
    }
);

export const markMessageAsReadAction = createAsyncThunk(
    MESSAGE_MARK_AS_READ,
    async (senderId, thunkAPI) => {
        try {
            // console.log("Marking messages as read for sender:", senderId);
            const response = await markMessagesAsRead(senderId);
            // console.log("Mark as read response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error marking messages as read:", error);
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
        }
    }
);

export const addReactionAction = createAsyncThunk(
    ADD_REACTION,
    async ({ messageId, emoji }, thunkAPI) => {
        try {
            const response = await addReaction(messageId, emoji);
            return response.data.updatedMessage;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add reaction');
        }
    }
);

export const removeReactionAction = createAsyncThunk(
    REMOVE_REACTION,
    async (messageId, thunkAPI) => {
        try {
            const response = await removeReaction(messageId);
            return response.data.updatedMessage;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to remove reaction');
        }
    }
);