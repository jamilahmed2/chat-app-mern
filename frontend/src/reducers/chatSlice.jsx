import { createSlice } from '@reduxjs/toolkit';
import { getMessagesAction, sendMessageAction, deleteMessageAction, getUnreadCountsAction, markAsDeliveredAction, markMessageAsReadAction,addReactionAction,removeReactionAction } from '../actions/chatActions';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        messages: [],
        activeChat: null,
        unreadCounts: {},
        loading: false,
        error: null
    },
    reducers: {
        // setActiveChat: (state, action) => {
        //     state.activeChat = action.payload;
        // },
        setActiveChat: (state, action) => {
            // Only update if the value is different
            if (!state.activeChat || state.activeChat._id !== action.payload?._id) {
                state.activeChat = action.payload;
            }
        },
        clearChat: (state) => {
            state.messages = [];
            state.activeChat = null;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter(msg => msg._id !== action.payload);
        },
        updateMessageStatus: (state, action) => {
            const { messageIds, status } = action.payload;
            // console.log("Updating message status:", { messageIds, status });

            // Make sure we're properly updating each message that matches any of the IDs
            if (messageIds && messageIds.length > 0) {
                state.messages = state.messages.map(msg => {
                    if (messageIds.includes(msg._id)) {
                        console.log(`Updating message ${msg._id} to status: ${status}`);
                        return { ...msg, status };
                    }
                    return msg;
                });
            }
        },
        setUnreadCounts: (state, action) => {
            state.unreadCounts = action.payload;
        },
        updateUnreadCount: (state, action) => {
            const { userId, increment } = action.payload;

            // If userId doesn't exist in unreadCounts, initialize it
            if (!state.unreadCounts[userId]) {
                state.unreadCounts[userId] = 0;
            }

            // Increment or reset based on the action
            if (increment) {
                state.unreadCounts[userId] += 1;
            } else {
                state.unreadCounts[userId] = 0;
            }
        },
        // For updating specific message's status
        updateSingleMessageStatus: (state, action) => {
            const { messageId, status } = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
            if (messageIndex !== -1) {
                state.messages[messageIndex].status = status;
            }
        },

        // Reset unread counts for a specific user
        resetUnreadCount: (state, action) => {
            const userId = action.payload;
            if (state.unreadCounts[userId]) {
                state.unreadCounts[userId] = 0;
            }
        },
        setMessageReactions: (state, action) => {
            const { messageId, reactions } = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
            if (messageIndex !== -1) {
                state.messages[messageIndex].reactions = reactions;
            }
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
        })
        // Get Unread Counts
        builder.addCase(getUnreadCountsAction.fulfilled, (state, action) => {
            state.unreadCounts = action.payload;
        });

        // Mark as Delivered
        builder.addCase(markAsDeliveredAction.fulfilled, (state, action) => {
            // This might be updating messages in your Redux state
            // Logic should match with your API response
        });

        // Mark as Read
        builder.addCase(markMessageAsReadAction.fulfilled, (state, action) => {
            const { senderId, messageIds } = action.payload;

            // Update message status in state
            if (messageIds && messageIds.length > 0) {
                state.messages = state.messages.map(msg =>
                    messageIds.includes(msg._id) ? { ...msg, status: 'read' } : msg
                );
            }

            // Reset unread count for this sender
            if (state.unreadCounts[senderId]) {
                state.unreadCounts[senderId] = 0;
            }
        })
        builder.addCase(addReactionAction.fulfilled, (state, action) => {
            const updatedMessage = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg._id === updatedMessage._id);
            if (messageIndex !== -1) {
                state.messages[messageIndex].reactions = updatedMessage.reactions;
            }
        });
        
        builder.addCase(removeReactionAction.fulfilled, (state, action) => {
            const updatedMessage = action.payload;
            const messageIndex = state.messages.findIndex(msg => msg._id === updatedMessage._id);
            if (messageIndex !== -1) {
                state.messages[messageIndex].reactions = updatedMessage.reactions;
            }
        });
    }
});

export { getMessagesAction, sendMessageAction, deleteMessageAction, getUnreadCountsAction, markAsDeliveredAction, markMessageAsReadAction,addReactionAction,removeReactionAction };
export const { setActiveChat, clearChat, addMessage, removeMessage, updateMessageStatus, updateSingleMessageStatus, resetUnreadCount,updateUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;