import { createSlice } from '@reduxjs/toolkit';
import { getMessagesAction, sendMessageAction, deleteMessageAction } from '../actions/chatActions';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        messages: [],
        activeChat: null,
        loading: false,
        error: null
    },
    reducers: {
        setActiveChat: (state, action) => {
            state.activeChat = action.payload;
        },
        clearChat: (state) => {
            state.messages = [];
            state.activeChat = null;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        }
    },
    extraReducers: (builder) => {
        // Get Messages
        builder.addCase(getMessagesAction.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getMessagesAction.fulfilled, (state, action) => {
            state.loading = false;
            state.messages = action.payload;
        });
        builder.addCase(getMessagesAction.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });

        // Send Message
        builder.addCase(sendMessageAction.fulfilled, (state, action) => {
            state.messages.push(action.payload);
        });
        builder.addCase(sendMessageAction.rejected, (state, action) => {
            state.error = action.payload;
        });

        // Delete Message
        builder.addCase(deleteMessageAction.fulfilled, (state, action) => {
            state.messages = state.messages.filter(msg => msg._id !== action.payload);
        });
    }
});

export { getMessagesAction, sendMessageAction, deleteMessageAction };
export const { setActiveChat, clearChat, addMessage } = chatSlice.actions;
export default chatSlice.reducer;