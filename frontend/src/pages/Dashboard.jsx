import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllUsersAction, deleteUserAction, uploadAdminProfileImageAction, updateAdminNameAction, updateAdminPasswordAction, updateAdminEmailAction, getReportedUsersAction, banUserAction, clearReportsAction, getBannedUsersAction, unBanUserAction, setTempEmail, logoutUserAction, getAllUsersHomeAction, getBlockedUsersInfoAction, adminUnblockUserAction, adminGetBlockedUsersAction } from "../reducers/authSlice";
import socket from "../utils/socket";
import AlertNotification from "../components/AlertNotification";

const AdminDashboard = () => {
    const { user, totalUsers, reportedUsers, bannedUsers, blockedUsersInfo, loading, error } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("users"); // Default tab
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (user && user.role === "admin") {
            dispatch(getAllUsersAction());
            dispatch(getReportedUsersAction());
            dispatch(getBannedUsersAction());
            dispatch(getBlockedUsersInfoAction());
        }
    }, [user, dispatch]);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".profile-dropdown-container")) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // profile image
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // File size validation (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage("File size must be less than 5MB");
                setTimeout(() => setMessage(""), 3000);
                return;
            }

            // File type validation
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
                setMessage("File must be an image (JPEG, PNG, or GIF)");
                setTimeout(() => setMessage(""), 3000);
                return;
            }

            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setMessage("Please select a file first");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('profileImage', selectedFile);

            const result = await dispatch(uploadAdminProfileImageAction(formData));

            if (result.meta.requestStatus === "fulfilled") {
                setMessage("Profile image updated successfully");
                setTimeout(() => setMessage(""), 3000);
                setSelectedFile(null);
                setPreview(null);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Error uploading image");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        dispatch(updateAdminNameAction({ name })).then(res => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Name updated successfully");
                setTimeout(() => setMessage(""), 3000);
            }
        });
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        dispatch(updateAdminEmailAction({ email })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                dispatch(setTempEmail(email));
                navigate("/verify-email");
            }
        });
    };

    const handleBanUser = async (userId) => {
        await dispatch(banUserAction(userId));
        setMessage("User banned successfully");
        setTimeout(() => setMessage(""), 3000);
        dispatch(getBannedUsersAction()); // Refresh banned users
        dispatch(getReportedUsersAction()); // Refresh reported users
    };

    const handleUnbanUser = (userId) => {
        dispatch(unBanUserAction(userId)).then(() => {
            setMessage("User unbanned successfully");
            setTimeout(() => setMessage(""), 3000);
            dispatch(getBannedUsersAction()); // Refresh banned users list
        });
    };

    const handleClearReports = async (userId) => {
        await dispatch(clearReportsAction(userId));
        setMessage("Reports cleared successfully");
        setTimeout(() => setMessage(""), 3000);
        dispatch(getReportedUsersAction());
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        dispatch(updateAdminPasswordAction({ currentPassword, newPassword })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Password updated successfully");
                setTimeout(() => setMessage(""), 3000);
                setCurrentPassword("");
                setNewPassword("");
            }
        });
    };

    const handleDeleteUser = (userId) => {
        if (userId === user._id && user.role === "admin") {
            setMessage("You cannot delete your own account!");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        if (window.confirm("Are you sure you want to delete this user?")) {
            dispatch(deleteUserAction(userId)).then(() => {
                setMessage("User deleted successfully");
                setTimeout(() => setMessage(""), 3000);
            });
        }
    };

    const handleLogout = () => {
        // Disconnect socket before logout
        if (socket && socket.connected) {
            socket.disconnect();
        }
        
        dispatch(logoutUserAction()).then(() => {
            navigate('/');
        });
    };

    const handleAdminUnblockUser = (userId, targetUserId) => {
        if (window.confirm("Are you sure you want to unblock this user?")) {
            dispatch(adminUnblockUserAction({ userId, targetUserId }));
        }
    };

    if (user?.role !== "admin") {
    return (
            <div className="dashboard-container">
                <div className="dashboard-layout">
                    <div className="content-card" style={{margin: "auto", textAlign: "center", padding: "50px"}}>
                        <h1 style={{color: "var(--red-600)"}}>Access Denied! Admins Only</h1>
                <button
                            onClick={() => navigate('/')}
                            style={{
                                backgroundColor: "var(--emerald-500)",
                                color: "var(--white)",
                                padding: "10px 20px",
                                border: "none",
                                borderRadius: "4px",
                                marginTop: "20px",
                                cursor: "pointer"
                            }}
                        >
                            Return to Home
                </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Notification */}
            {message && <AlertNotification message={message} type="success" />}
            {error && <AlertNotification message={error} type="error" />}

            {/* Main Layout */}
            <div className="dashboard-layout">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <div className="sidebar-header">
                        <h2><i className="ri-admin-line"></i> Admin Dashboard</h2>
                    </div>
                    <ul className="sidebar-menu">
                        <li className={activeTab === "users" ? "active" : ""}>
                            <button onClick={() => setActiveTab("users")}>
                                <i className="ri-user-line"></i> User Management
                            </button>
                        </li>
                        <li className={activeTab === "reported" ? "active" : ""}>
                            <button onClick={() => setActiveTab("reported")}>
                                <i className="ri-flag-line"></i> Reported Users
                                {reportedUsers.length > 0 && (
                                    <span style={{
                                        backgroundColor: "var(--red-500)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        marginLeft: "auto"
                                    }}>
                                        {reportedUsers.length}
                                    </span>
                                )}
                            </button>
                        </li>
                        <li className={activeTab === "banned" ? "active" : ""}>
                            <button onClick={() => setActiveTab("banned")}>
                                <i className="ri-forbid-line"></i> Banned Users
                                {bannedUsers.length > 0 && (
                                    <span style={{
                                        backgroundColor: "var(--red-500)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        marginLeft: "auto"
                                    }}>
                                        {bannedUsers.length}
                                    </span>
                                )}
                            </button>
                        </li>
                        <li className={activeTab === "blocked" ? "active" : ""}>
                            <button onClick={() => setActiveTab("blocked")}>
                                <i className="ri-user-unfollow-line"></i> Blocked Users
                                {blockedUsersInfo?.length > 0 && (
                                    <span style={{
                                        backgroundColor: "var(--amber-500)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                        marginLeft: "auto"
                                    }}>
                                        {blockedUsersInfo.length}
                                    </span>
                                )}
                            </button>
                        </li>
                        <li className={activeTab === "profile" ? "active" : ""}>
                            <button onClick={() => setActiveTab("profile")}>
                                <i className="ri-user-settings-line"></i> Profile Settings
                            </button>
                        </li>
                        <li className={activeTab === "security" ? "active" : ""}>
                            <button onClick={() => setActiveTab("security")}>
                                <i className="ri-lock-password-line"></i> Security
                            </button>
                        </li>
                        <li className="profile-dropdown-container">
                <button
                                className="profile-button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <img 
                                    src={user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                    alt="" 
                                />
                            </button>
                            {isDropdownOpen && (
                                <ul className="profile-dropdown">
                                    <li><button onClick={() => setActiveTab("profile")}><i className="ri-user-line"></i> Profile</button></li>
                                    <li><button onClick={handleLogout}><i className="ri-logout-box-line"></i> Logout</button></li>
                                </ul>
                            )}
                        </li>
                    </ul>
                </aside>

                {/* Content Area */}
                <main className="dashboard-content">
                    {/* Users Tab */}
                    {activeTab === "users" && (
                        <div className="content-card">
                            <div className="card-header">
                <h2>User Management</h2>
                <p>Total Users: {totalUsers?.length || 0}</p>
                            </div>

                            <div style={{padding: "20px"}}>
                {loading ? (
                                    <div style={{textAlign: "center", padding: "20px"}}>
                    <p>Loading users...</p>
                                    </div>
                                ) : (
                                    <div style={{
                                        maxHeight: "500px",
                                        overflowY: "auto",
                                        backgroundColor: "var(--slate-50)",
                                        borderRadius: "8px"
                                    }}>
                                        <table style={{
                                            width: "100%",
                                            borderCollapse: "collapse"
                                        }}>
                                            <thead>
                                                <tr style={{
                                                    backgroundColor: "var(--slate-200)",
                                                    textAlign: "left"
                                                }}>
                                                    <th style={{padding: "10px"}}>Name</th>
                                                    <th style={{padding: "10px"}}>Email</th>
                                                    <th style={{padding: "10px"}}>Role</th>
                                                    <th style={{padding: "10px"}}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                        {Array.isArray(totalUsers) && totalUsers.length > 0 ? (
                                                    totalUsers.map((user) => (
                                                        <tr key={user._id} style={{
                                                            borderBottom: "1px solid var(--slate-200)"
                                                        }}>
                                                            <td style={{padding: "10px"}}>{user.name}</td>
                                                            <td style={{padding: "10px"}}>{user.email}</td>
                                                            <td style={{padding: "10px"}}>{user.role}</td>
                                                            <td style={{padding: "10px"}}>
                                        {user.role !== "admin" && (
                                                                    <button 
                                                                        onClick={() => handleDeleteUser(user._id)} 
                                                                        style={{
                                                                            backgroundColor: "var(--red-500)",
                                                                            color: "white",
                                                                            border: "none",
                                                                            padding: "6px 12px",
                                                                            borderRadius: "4px",
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >
                                                Delete
                                            </button>
                                        )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{padding: "20px", textAlign: "center"}}>
                                                            No users found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                    </div>
                )}
            </div>
                        </div>
                    )}
                    
                    {/* Reported Users Tab */}
                    {activeTab === "reported" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Reported Users</h2>
                                <p>Users with reports: {reportedUsers?.length || 0}</p>
            </div>

                            <div style={{padding: "20px"}}>
                                {loading ? (
                                    <div style={{textAlign: "center", padding: "20px"}}>
                                        <p>Loading reported users...</p>
                                    </div>
                                ) : (
            <div>
                {Array.isArray(reportedUsers) && reportedUsers.length > 0 ? (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                                gap: "20px"
                                            }}>
                                                {reportedUsers.map((user) => (
                                                    <div key={user._id} style={{
                                                        backgroundColor: "var(--slate-50)",
                                                        borderRadius: "8px",
                                                        padding: "16px",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                                    }}>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            marginBottom: "10px"
                                                        }}>
                                                            <img 
                                                                src={user.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                                                alt="" 
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    borderRadius: "50%",
                                                                    marginRight: "10px"
                                                                }}
                                                            />
                                                            <div>
                                                                <h3 style={{margin: "0", fontSize: "16px"}}>{user.name}</h3>
                                                                <p style={{margin: "0", fontSize: "14px", color: "var(--slate-500)"}}>{user.email}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            backgroundColor: "var(--red-50)",
                                                            padding: "10px",
                                                            borderRadius: "6px",
                                                            marginBottom: "15px"
                                                        }}>
                                                            <h4 style={{margin: "0 0 5px 0", fontSize: "14px", color: "var(--red-700)"}}>
                                                                Reports: {user.reports.length}
                                                            </h4>
                                                            <div style={{
                                                                maxHeight: "120px",
                                                                overflowY: "auto"
                                                            }}>
                            {user.reports.map((report, index) => (
                                                                    <div key={report._id || index} style={{
                                                                        padding: "8px",
                                                                        borderBottom: index < user.reports.length - 1 ? "1px solid var(--red-100)" : "none"
                                                                    }}>
                                                                        <p style={{margin: "0 0 5px 0", fontSize: "13px", fontWeight: "500"}}>
                                                                            Reason: {report.reason}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{
                                                            display: "flex",
                                                            gap: "10px"
                                                        }}>
                            <button
                                onClick={() => handleBanUser(user._id)}
                                disabled={bannedUsers.some(banned => banned._id === user._id)}
                                                                style={{
                                                                    flex: "1",
                                                                    padding: "8px",
                                                                    backgroundColor: bannedUsers.some(banned => banned._id === user._id) ? "var(--slate-400)" : "var(--red-500)",
                                                                    color: "white",
                                                                    border: "none",
                                                                    borderRadius: "4px",
                                                                    cursor: bannedUsers.some(banned => banned._id === user._id) ? "not-allowed" : "pointer"
                                                                }}
                                                            >
                                                                {bannedUsers.some(banned => banned._id === user._id) ? "Banned" : "Ban User"}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleClearReports(user._id)}
                                                                style={{
                                                                    flex: "1",
                                                                    padding: "8px",
                                                                    backgroundColor: "var(--slate-300)",
                                                                    border: "none",
                                                                    borderRadius: "4px",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                Clear Reports
                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: "center",
                                                padding: "30px",
                                                backgroundColor: "var(--slate-50)",
                                                borderRadius: "8px"
                                            }}>
                                                <p>No reported users</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Banned Users Tab */}
                    {activeTab === "banned" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Banned Users</h2>
                                <p>Currently banned: {bannedUsers?.length || 0}</p>
            </div>

                            <div style={{padding: "20px"}}>
                                {loading ? (
                                    <div style={{textAlign: "center", padding: "20px"}}>
                                        <p>Loading banned users...</p>
                                    </div>
                                ) : (
            <div>
                {bannedUsers.length > 0 ? (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                                gap: "20px"
                                            }}>
                                                {bannedUsers.map((user) => (
                                                    <div key={user._id} style={{
                                                        backgroundColor: "var(--slate-50)",
                                                        borderRadius: "8px",
                                                        padding: "16px",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                                    }}>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            marginBottom: "15px"
                                                        }}>
                                                            <img 
                                                                src={user.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                                                alt="" 
                                                                style={{
                                                                    width: "40px",
                                                                    height: "40px",
                                                                    borderRadius: "50%",
                                                                    marginRight: "10px"
                                                                }}
                                                            />
                                                            <div>
                                                                <h3 style={{margin: "0", fontSize: "16px"}}>{user.name}</h3>
                                                                <p style={{margin: "0", fontSize: "14px", color: "var(--slate-500)"}}>{user.email}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => handleUnbanUser(user._id)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "8px",
                                                                backgroundColor: "var(--emerald-500)",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius: "4px",
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            Unban User
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: "center",
                                                padding: "30px",
                                                backgroundColor: "var(--slate-50)",
                                                borderRadius: "8px"
                                            }}>
                                                <p>No banned users</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Blocked Users Tab */}
                    {activeTab === "blocked" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Blocked Users Information</h2>
                                <p>Showing who blocked who: {blockedUsersInfo?.length || 0}</p>
                            </div>

                            <div style={{padding: "20px"}}>
                                {loading ? (
                                    <div style={{textAlign: "center", padding: "20px"}}>
                                        <p>Loading blocked users...</p>
                                    </div>
                                ) : (
                                    <div>
                                        {Array.isArray(blockedUsersInfo) && blockedUsersInfo.length > 0 ? (
                                            <div className="blocked-users-list">
                                                {blockedUsersInfo.map((blockInfo, index) => (
                                                    <div key={index} className="blocked-user-item">
                                                        <div className="blocker-info">
                                                            <h3>{blockInfo.blocker.name}</h3>
                                                            <p>Email: {blockInfo.blocker.email}</p>
                                                            <p>Has blocked {blockInfo.blockedUsers.length} users</p>
                                                        </div>
                                                        <div className="blocked-users-list">
                                                            {blockInfo.blockedUsers.map((user, userIndex) => (
                                                                <div key={userIndex} className="blocked-user-detail">
                                                                    <h4>{user.name}</h4>
                                                                    <p>Email: {user.email}</p>
                                                                    <button 
                                                                        className="unblock-btn"
                                                                        onClick={() => handleAdminUnblockUser(blockInfo.blocker.id, user._id)}
                                                                    >
                                                                        Unblock
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{
                                                textAlign: "center",
                                                padding: "30px",
                                                backgroundColor: "var(--slate-50)",
                                                borderRadius: "8px"
                                            }}>
                                                <p>No blocked users found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Profile Settings Tab */}
                    {activeTab === "profile" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Profile Information</h2>
                                <p>Update your personal information</p>
                            </div>
                            
                            <div className="profile-section">
                                <div className="profile-info">
                                    <div className="profile-avatar">
                                        <img 
                                            src={preview || user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                            alt="Profile" 
                                        />
                                        <div className="upload-overlay">
                                            <label htmlFor="profile-upload">
                                                <i className="ri-camera-line"></i>
                                            </label>
                                            <input 
                                                id="profile-upload" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleFileChange} 
                                                style={{display: 'none'}}
                                            />
                                        </div>
            </div>

                                    {selectedFile && (
                                        <button 
                                            onClick={handleUpload}
                                            className="upload-button"
                                            disabled={loading}
                                        >
                                            {loading ? "Uploading..." : "Upload Image"}
                                        </button>
                                    )}
                                    
                                    <div className="user-details">
                                        <h3>{user?.name}</h3>
                                        <p>{user?.email}</p>
                                    </div>
                                </div>
                                
                                <div className="profile-forms">
                                    <form onSubmit={handleUpdateName} className="update-form">
                                        <div className="form-group">
                                            <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                                                placeholder="Update your name"
                                                required
                />
                                        </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Name"}
                </button>
            </form>

                                    <form onSubmit={handleUpdateEmail} className="update-form">
                                        <div className="form-group">
                                            <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Update your email"
                                                required
                />
                                        </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Email"}
                </button>
            </form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Security Tab */}
                    {activeTab === "security" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Security Settings</h2>
                                <p>Update your password</p>
                            </div>
                            
                            <form onSubmit={handlePasswordChange} className="password-form" style={{padding: "20px"}}>
                                <div className="form-group">
                                    <label>Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                    required
                />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                    required
                />
                                </div>
                                <button type="submit" disabled={loading}>
                                    {loading ? "Updating..." : "Change Password"}
                </button>
            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
