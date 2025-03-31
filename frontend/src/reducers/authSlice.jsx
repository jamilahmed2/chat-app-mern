import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    loginUser,
    logoutUserAction,
    registerUser,
    verifyOTPAction,
    forgotPasswordAction,
    resendOTPAction,
    resetPasswordAction
} from "../actions/authActions.jsx";
import {
    updateAdminNameAction,
    updateAdminEmailAction,
    verifyEmailOTPAction,
    updateAdminPasswordAction,
    getAllUsersAction,
    deleteUserAction,
    getReportedUsersAction,
    banUserAction,
    clearReportsAction,
    getBannedUsersAction,
    unBanUserAction,
    adminEmailResendOTPAction,
    uploadAdminProfileImageAction,
    getBlockedUsersInfoAction,
    adminUnblockUserAction,
    adminGetBlockedUsersAction,
    adminGetBlockStatusAction
} from '../actions/adminActions.jsx'
import {
    updateUserPasswordAction,
    userEmailResendOTPAction,
    updateUserNameAction,
    updateUserEmailAction,
    userEmailOTPAction,
    uploadProfileImageAction,
    getAllUsersHomeAction,
    blockUserAction,
    unblockUserAction,
    reportUserAction,
    getUserAction
} from '../actions/userActions.jsx'
import {
    acceptFriendRequestAction,
    declineFriendRequestAction,
    getFriendRequestsAction,
    getFriendsAction,
    removeFriendAction,
    sendFriendRequestAction
} from "../actions/friendActions.jsx";

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    isAuthenticated: !!localStorage.getItem("user"),
    isLoading: false,
    totalUsers: [],
    reportedUsers: [],
    bannedUsers: [],
    blockedUsersInfo: [],
    friends: [],
    friendRequests: [],
    otpVerified: false,
    tempEmail: null,
    passwordResetEmailSent: false,
    error: null,
    successMessage: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        updatedAdmin: (state, action) => {
            state.user = action.payload; // Update admin data in Redux state
        },
        updatedUser: (state, action) => {
            state.user = action.payload; // Update user data in Redux state
        },
        setTempEmail: (state, action) => {
            state.tempEmail = action.payload;
        },
        updateFriendRequests: (state, action) => {
            state.friendRequests = action.payload;
        },
        updateFriendshipStatus: (state, action) => {
            const { userId, status } = action.payload;

            // Update in totalUsers
            state.totalUsers = state.totalUsers.map(user => {
                if (user._id === userId) {
                    return {
                        ...user,
                        isFriend: status === 'friend',
                        isPending: status === 'pending',
                        isReceived: status === 'received'
                    };
                }
                return user;
            });

            // Update friends list if necessary
            if (status === 'removed' && state.friends.length) {
                state.friends = state.friends.filter(friend => {
                    const friendId = friend.requester._id === state.user._id
                        ? friend.recipient._id
                        : friend.requester._id;
                    return friendId !== userId;
                });
            }
        },
        getUser: (state, action) => {
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.totalUsers = [];
            state.reportedUsers = [];
            state.friends = [];
            state.friendRequests = [];
            state.isAuthenticated = false;
            localStorage.removeItem("user");
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.successMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
                localStorage.setItem("user", JSON.stringify(action.payload));
            })
            .addCase(logoutUserAction.fulfilled, (state) => {
                state.user = null;
                state.totalUsers = [];
                state.reportedUsers = [];
                state.friends = [];
                state.friendRequests = [];
                state.isAuthenticated = false;
                localStorage.removeItem("user");
            })
            .addCase(logoutUserAction.rejected, (state, action) => {
                state.error = action.error.message;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(verifyOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.otpVerified = true;
                state.isAuthenticated = true;

                if (action.payload?.user) {
                    // Store the complete user object including the token
                    state.user = action.payload.user;

                    // Make sure the token is included in what's stored in localStorage
                    // If token is directly in response, add it to the user object
                    if (action.payload.token && !action.payload.user.token) {
                        action.payload.user.token = action.payload.token;
                    }

                    localStorage.setItem("user", JSON.stringify(action.payload.user));
                } else if (action.payload) {
                    // Handle case where the payload itself is the user object
                    state.user = action.payload;
                    localStorage.setItem("user", JSON.stringify(action.payload));
                } else {
                    console.error("No user data received in OTP verification response.");
                }
            })

            .addCase(verifyOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(forgotPasswordAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(forgotPasswordAction.fulfilled, (state) => {
                state.isLoading = false;
                state.passwordResetEmailSent = true;
            })
            .addCase(forgotPasswordAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(resetPasswordAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resetPasswordAction.fulfilled, (state) => {
                state.isLoading = false;
                state.passwordResetEmailSent = false; // Reset state after successful reset
                state.successMessage = "Password reset successful. Please log in!";
            })
            .addCase(resetPasswordAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Get all users at home page
            .addCase(getAllUsersHomeAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllUsersHomeAction.fulfilled, (state, action) => {
                state.isLoading = false;
                
                state.totalUsers = Array.isArray(action.payload.users) ? action.payload.users : [];
            })
            .addCase(getAllUsersHomeAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // ✅ Send Friend Request - improve optimistic updates
            .addCase(sendFriendRequestAction.pending, (state, action) => {
                // Optimistic update
                const recipientId = action.meta.arg;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === recipientId) {
                        return {
                            ...user,
                            isPending: true,
                            isFriend: false,
                            isReceived: false
                        };
                    }
                    return user;
                });
            })
            .addCase(sendFriendRequestAction.fulfilled, (state, action) => {
                // Ensure data is properly updated with server response
                const { recipientId } = action.payload;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === recipientId) {
                        return {
                            ...user,
                            isPending: true,
                            isFriend: false,
                            isReceived: false
                        };
                    }
                    return user;
                });
            })
            .addCase(sendFriendRequestAction.rejected, (state, action) => {
                // Revert optimistic update on failure
                const recipientId = action.meta.arg;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === recipientId) {
                        return {
                            ...user,
                            isPending: false,
                            isFriend: false,
                            isReceived: false
                        };
                    }
                    return user;
                });
                state.error = action.payload;
            })

            // ✅ Accept Friend Request
            .addCase(acceptFriendRequestAction.pending, (state, action) => {
                // Optimistic update for accept
                const { friendId } = action.meta.arg;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === friendId) {
                        return {
                            ...user,
                            isFriend: true,
                            isPending: false,
                            isReceived: false
                        };
                    }
                    return user;
                });
            })
            .addCase(acceptFriendRequestAction.fulfilled, (state, action) => {
                const { friendId, requestId } = action.payload;

                // Update the friendRequests list
                state.friendRequests = state.friendRequests.filter(req => req._id !== requestId);

                // Update friend status in totalUsers
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === friendId) {
                        return {
                            ...user,
                            isFriend: true,
                            isPending: false,
                            isReceived: false
                        };
                    }
                    return user;
                });

                // Make sure friends list is updated
                if (!state.friends.some(friend =>
                    friend.requester._id === friendId ||
                    friend.recipient._id === friendId
                )) {
                    // Add to friends list if not already present
                    state.friends.push({
                        _id: requestId,
                        requester: { _id: friendId },
                        recipient: { _id: state.user._id },
                        status: 'accepted'
                    });
                }
            })
            .addCase(acceptFriendRequestAction.rejected, (state, action) => {
                // Revert optimistic update on failure
                const { friendId } = action.meta.arg;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === friendId) {
                        return {
                            ...user,
                            isFriend: false,
                            isPending: false,
                            isReceived: true
                        };
                    }
                    return user;
                });
                state.error = action.payload;
            })

            // ✅ Decline Friend Request
            .addCase(declineFriendRequestAction.pending, (state, action) => {
                // Optimistic update
                const { requestId } = action.meta.arg;
                state.friendRequests = state.friendRequests.filter(req => req._id !== requestId);
            })
            .addCase(declineFriendRequestAction.fulfilled, (state, action) => {
                // Already removed in pending state
            })
            .addCase(declineFriendRequestAction.rejected, (state, action) => {
                // We would revert here, but since we're declining 
                // and don't have the original request data, we'll just
                // refresh the friends list instead
                // dispatch(getFriendRequestsAction());
                state.error = action.payload;
            })

            // ✅ Get Friend Requests
            .addCase(getFriendRequestsAction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFriendRequestsAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.friendRequests = action.payload;

                // Update isReceived status in totalUsers
                if (state.totalUsers.length && action.payload.length) {
                    const requestersIds = action.payload.map(req => req.requester._id);

                    state.totalUsers = state.totalUsers.map(user => {
                        if (requestersIds.includes(user._id)) {
                            return {
                                ...user,
                                isReceived: true,
                                isPending: false,
                                isFriend: false
                            };
                        }
                        return user;
                    });
                }
            })
            .addCase(getFriendRequestsAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ✅ Get Friends List
            .addCase(getFriendsAction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getFriendsAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.friends = action.payload;

                // Update isFriend status in totalUsers
                if (state.totalUsers.length && action.payload.length) {
                    const currentUserId = state.user._id;
                    const friendIds = action.payload.map(friendship => {
                        return friendship.requester._id === currentUserId
                            ? friendship.recipient._id
                            : friendship.requester._id;
                    });

                    state.totalUsers = state.totalUsers.map(user => {
                        if (friendIds.includes(user._id)) {
                            return {
                                ...user,
                                isFriend: true,
                                isPending: false,
                                isReceived: false
                            };
                        }
                        return user;
                    });
                }
            })
            .addCase(getFriendsAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // ✅ Remove Friend
            .addCase(removeFriendAction.pending, (state, action) => {
                // Optimistic update
                const friendId = action.meta.arg;
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === friendId) {
                        return {
                            ...user,
                            isFriend: false,
                            isPending: false,
                            isReceived: false
                        };
                    }
                    return user;
                });

                // Remove from friends list
                if (state.friends.length) {
                    state.friends = state.friends.filter(friendship => {
                        const otherUserId = friendship.requester._id === state.user._id
                            ? friendship.recipient._id
                            : friendship.requester._id;
                        return otherUserId !== friendId;
                    });
                }
            })
            .addCase(removeFriendAction.fulfilled, (state, action) => {
                // Already updated in pending case
            })
            .addCase(removeFriendAction.rejected, (state, action) => {
                const friendId = action.meta.arg;
                // Revert on failure by refreshing data
                // dispatch(getFriendsAction());
                state.error = action.payload;
            })

            // Get User
            .addCase(getUserAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUserAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(getUserAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // User Profile image
            .addCase(uploadProfileImageAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(uploadProfileImageAction.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.user) {
                    state.user.profileImage = action.payload.profileImage;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            })
            .addCase(uploadProfileImageAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            //  Update user Name
            .addCase(updateUserNameAction.fulfilled, (state, action) => {
                state.isLoading = false;

                if (state.user) {
                    state.user = { ...state.user, name: action.payload.user.name }; // ✅ Ensure existing user object is updated
                    localStorage.setItem("user", JSON.stringify(state.user)); // ✅ Store in localStorage for persistence
                }

                state.message = action.payload.message; //  Store success message for UI feedback
            })

            // Update user Email (Triggers OTP)
            .addCase(updateUserEmailAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.message = action.payload.message;
                state.tempEmail = action.payload.tempEmail || action.meta.arg.email;
            })
            // resend user email otp
            .addCase(userEmailResendOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = null; // Clear previous success messages
            })
            .addCase(userEmailResendOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.successMessage = action.payload.message; //  Store success message
            })
            .addCase(userEmailResendOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // user email verify
            .addCase(userEmailOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(userEmailOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;

                if (action.payload?.success) {
                    // Update the user in state
                    if (action.payload.user) {
                        state.user = action.payload.user;
                        localStorage.setItem("user", JSON.stringify(action.payload.user));
                    }
                    // Clear the temporary email
                    state.tempEmail = null;
                }
            })
            .addCase(userEmailOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // admi profile image upload
            .addCase(uploadAdminProfileImageAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(uploadAdminProfileImageAction.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.user) {
                    state.user.profileImage = action.payload.profileImage;
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            })
            .addCase(uploadAdminProfileImageAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // resend admin email otp
            .addCase(adminEmailResendOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = null; // Clear previous success messages
            })
            .addCase(adminEmailResendOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.successMessage = action.payload.message; //  Store success message
            })
            .addCase(adminEmailResendOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            .addCase(resendOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = null; // Clear previous success messages
            })
            .addCase(resendOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.successMessage = action.payload.message; //  Store success message
            })
            .addCase(resendOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            //  Update Admin Name
            .addCase(updateAdminNameAction.fulfilled, (state, action) => {
                state.isLoading = false;

                if (state.user) {
                    state.user = { ...state.user, name: action.payload.user.name }; // ✅ Ensure existing user object is updated
                    localStorage.setItem("user", JSON.stringify(state.user)); // ✅ Store in localStorage for persistence
                }

                state.message = action.payload.message; //  Store success message for UI feedback
            })



            //  Update Admin Email (Triggers OTP)
            .addCase(updateAdminEmailAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.message = action.payload.message;
                state.tempEmail = action.payload.tempEmail || action.meta.arg.email;
            })

            // admin emai lverify
            .addCase(verifyEmailOTPAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyEmailOTPAction.fulfilled, (state, action) => {
                state.isLoading = false;

                if (action.payload?.success) {
                    // Update the user in state
                    if (action.payload.user) {
                        state.user = action.payload.user;
                        localStorage.setItem("user", JSON.stringify(action.payload.user));
                    }
                    // Clear the temporary email
                    state.tempEmail = null;
                }
            })
            .addCase(verifyEmailOTPAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // get all users
            .addCase(getAllUsersAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllUsersAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.totalUsers = Array.isArray(action.payload.users) ? action.payload.users : [];
            })
            .addCase(getAllUsersAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get Reported Users
            .addCase(getReportedUsersAction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getReportedUsersAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.reportedUsers = Array.isArray(action.payload) ? action.payload : []; // ✅ Ensure it's an array
            })

            .addCase(getReportedUsersAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Clear Reports
            .addCase(clearReportsAction.fulfilled, (state, action) => {
                state.reportedUsers = state.reportedUsers.filter(user => user._id !== action.payload._id);
            })
            // ban user
            .addCase(banUserAction.fulfilled, (state, action) => {
                state.bannedUsers = action.payload || []; // Update the banned users array
                state.reportedUsers = state.reportedUsers.filter(user =>
                    !action.payload.some(banned => banned._id === user._id)
                );
                state.totalUsers = state.totalUsers.map(user =>
                    action.payload.some(banned => banned._id === user._id) ? { ...user, isBanned: true } : user
                );
            })



            .addCase(getBannedUsersAction.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBannedUsersAction.fulfilled, (state, action) => {
                // console.log("Banned Users API Response:", action.payload); // Debugging
                state.isLoading = false;
                state.bannedUsers = action.payload || []; // Ensure it's always an array
            })
            .addCase(getBannedUsersAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // unban user
            .addCase(unBanUserAction.fulfilled, (state, action) => {
                state.bannedUsers = state.bannedUsers.filter(user => user._id !== action.meta.arg);
                state.totalUsers = state.totalUsers.map(user =>
                    user._id === action.meta.arg ? { ...user, isBanned: false } : user
                );
            })



            .addCase(deleteUserAction.fulfilled, (state, action) => {
                state.totalUsers = state.totalUsers.filter(user => user._id !== action.payload);
            })
            .addCase(deleteUserAction.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Block User
            .addCase(blockUserAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(blockUserAction.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.user) {
                    state.user.blockedUsers = [...(state.user.blockedUsers || []), action.payload.userId];
                }
                // Update blocked status in the totalUsers list
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === action.payload.userId) {
                        return {
                            ...user,
                            isBlocked: true
                        };
                    }
                    return user;
                });
            })
            .addCase(blockUserAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Unblock User
            .addCase(unblockUserAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(unblockUserAction.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.user) {
                    state.user.blockedUsers = state.user.blockedUsers.filter(
                        id => id !== action.payload.userId
                    );
                }
                // Update blocked status in the totalUsers list
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === action.payload.userId) {
                        return {
                            ...user,
                            isBlocked: false
                        };
                    }
                    return user;
                });
            })
            .addCase(unblockUserAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Report User
            .addCase(reportUserAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(reportUserAction.fulfilled, (state, action) => {
                state.isLoading = false;
                // Optional: Update UI to indicate the user has been reported
                state.totalUsers = state.totalUsers.map(user => {
                    if (user._id === action.payload.userId) {
                        return {
                            ...user,
                            isReported: true
                        };
                    }
                    return user;
                });
            })
            
            .addCase(reportUserAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Get Blocked Users Info
            .addCase(getBlockedUsersInfoAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getBlockedUsersInfoAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.blockedUsersInfo = action.payload.blockedUsersInfo || [];
            })
            .addCase(getBlockedUsersInfoAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Admin Unblock User
            .addCase(adminUnblockUserAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(adminUnblockUserAction.fulfilled, (state, action) => {
                state.isLoading = false;

                // Find the blocker in blockedUsersInfo
                const { userId, targetUserId } = action.payload;

                state.blockedUsersInfo = state.blockedUsersInfo.map(blockInfo => {
                    if (blockInfo.blocker.id === userId) {
                        return {
                            ...blockInfo,
                            blockedUsers: blockInfo.blockedUsers.filter(
                                user => user._id !== targetUserId
                            )
                        };
                    }
                    return blockInfo;
                });

                // Remove any entries with empty blockedUsers array
                state.blockedUsersInfo = state.blockedUsersInfo.filter(
                    blockInfo => blockInfo.blockedUsers.length > 0
                );
            })
            .addCase(adminUnblockUserAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Admin Get Blocked Users
            .addCase(adminGetBlockedUsersAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(adminGetBlockedUsersAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.allBlockedUsers = action.payload.data;
                state.error = null;
            })
            .addCase(adminGetBlockedUsersAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Admin Get Block Status
            .addCase(adminGetBlockStatusAction.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(adminGetBlockStatusAction.fulfilled, (state, action) => {
                state.isLoading = false;
                state.blockStatus = action.payload.data;
                state.error = null;
            })
            .addCase(adminGetBlockStatusAction.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

    },
});
export {
    registerUser,
    loginUser,
    updateAdminPasswordAction,
    updateUserPasswordAction,
    getAllUsersAction,
    getAllUsersHomeAction,
    deleteUserAction,
    resendOTPAction,
    adminEmailResendOTPAction,
    verifyOTPAction,
    forgotPasswordAction,
    resetPasswordAction,
    getReportedUsersAction,
    banUserAction,
    clearReportsAction,
    getBannedUsersAction,
    unBanUserAction,
    uploadAdminProfileImageAction,
    updateAdminNameAction,
    updateAdminEmailAction,
    verifyEmailOTPAction,
    userEmailResendOTPAction,
    updateUserNameAction,
    updateUserEmailAction,
    userEmailOTPAction,
    uploadProfileImageAction,
    acceptFriendRequestAction,
    getFriendRequestsAction,
    getFriendsAction,
    removeFriendAction,
    sendFriendRequestAction,
    declineFriendRequestAction,
    logoutUserAction,
    getBlockedUsersInfoAction,
    adminUnblockUserAction,
    adminGetBlockedUsersAction,
    adminGetBlockStatusAction, 
    blockUserAction, 
    unblockUserAction,
    reportUserAction,
    getUserAction
};
export const { logout, setTempEmail, updateFriendshipStatus, updateFriendRequests } = authSlice.actions;
export default authSlice.reducer;

// Add a new action to clear the error message
export const clearAuthError = createAsyncThunk(
    'auth/clearAuthError',
    async (_, thunkAPI) => {
        return;
    }
);
