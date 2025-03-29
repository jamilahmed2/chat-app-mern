import { createAsyncThunk } from "@reduxjs/toolkit";
import { acceptFriendRequest, declineFriendRequest, getFriendReuests, getFriends, removeFriend, sendFriendRequest } from "../api/api";// Import your axios instance
import {
    SEND_FRIEND_REQUEST,
    ACCEPT_FRIEND_REQUEST,
    DECLINE_FRIEND_REQUEST,
    GET_FRIEND_REQUESTS,
    GET_FRIENDS,
    REMOVE_FRIEND
} from '../actionTypes/actionTypes';

// ✅ Send Friend Request
export const sendFriendRequestAction = createAsyncThunk(
    SEND_FRIEND_REQUEST,
    async (recipientId, thunkAPI) => {
        try {
            const response = await sendFriendRequest({ recipientId });
            return { 
                ...response.data,
                recipientId // Include recipient ID for state updates
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error sending friend request');
        }
    }
);

// ✅ Accept Friend Request
export const acceptFriendRequestAction = createAsyncThunk(
    ACCEPT_FRIEND_REQUEST,
    async ({ requestId, friendId }, thunkAPI) => {
        try {
            const response = await acceptFriendRequest({ requestId });
            return { 
                ...response.data,
                requestId, // Include request ID for removing from list
                friendId // Include friend ID for updating UI
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error accepting friend request');
        }
    }
);

// ✅ Decline Friend Request
export const declineFriendRequestAction = createAsyncThunk(
    DECLINE_FRIEND_REQUEST,
    async (requestId, thunkAPI) => {
        try {
            await declineFriendRequest({ requestId });
            return { requestId }; // Returning ID to remove from state
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error declining friend request');
        }
    }
);

// ✅ Get Friend Requests
export const getFriendRequestsAction = createAsyncThunk(
    GET_FRIEND_REQUESTS,
    async (_, thunkAPI) => {
        try {
            const response = await getFriendReuests();
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching friend requests');
        }
    }
);

// ✅ Get Friends List
export const getFriendsAction = createAsyncThunk(
    GET_FRIENDS,
    async (_, thunkAPI) => {
        try {
            const response = await getFriends();
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error fetching friends');
        }
    }
);

// ✅ Remove Friend
export const removeFriendAction = createAsyncThunk(
    REMOVE_FRIEND,
    async (friendId, thunkAPI) => {
        try {
            await removeFriend({ friendId });
            return friendId;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Error removing friend');
        }
    }
);