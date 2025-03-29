import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../reducers/authSlice";
import notificationReducer from '../reducers/notificationSlice'
import chatReducer from '../reducers/chatSlice'


export const store = configureStore({
    reducer: {
        auth: authReducer,
        notifications: notificationReducer,
        chat: chatReducer
    },
});

export default store;