import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllUsersAction, deleteUserAction, uploadAdminProfileImageAction, updateAdminNameAction, updateAdminPasswordAction, updateAdminEmailAction, getReportedUsersAction, banUserAction, clearReportsAction, getBannedUsersAction, unBanUserAction,  setTempEmail, logoutUserAction, getAllUsersHomeAction } from "../reducers/authSlice";


const AdminDashboard = () => {
    const { user, totalUsers, reportedUsers, bannedUsers, loading, error } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (user && user.role === "admin") {
            // console.log("Admin logged in, fetching users");
            dispatch(getAllUsersAction());
            dispatch(getReportedUsersAction());
            dispatch(getBannedUsersAction());
        }
    }, [user, dispatch]);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);
    // profile image
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // File size validation (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage("File size must be less than 5MB");
                return;
            }

            // File type validation
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
                setMessage("File must be an image (JPEG, PNG, or GIF)");
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
            return;
        }

        try {
            const formData = new FormData();
            formData.append('profileImage', selectedFile);

            const result = await dispatch(uploadAdminProfileImageAction(formData));

            if (result.meta.requestStatus === "fulfilled") {
                setMessage("Profile image updated successfully");
                setSelectedFile(null);
                setPreview(null);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Error uploading image");
        }
    };
    const handleUpdateName = async (e) => {
        e.preventDefault();
        dispatch(updateAdminNameAction({ name }));
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        // console.log("Updating email for:", email);

        // Fix: Pass email as an object
        dispatch(updateAdminEmailAction({ email })).then((res) => {
            // console.log("Response from updateAdminEmailAction:", res);
            if (res.meta.requestStatus === "fulfilled") {
                dispatch(setTempEmail(email))
                navigate("/verify-email");
            }
        });
    };

    const handleBanUser = async (userId) => {
        await dispatch(banUserAction(userId));
        dispatch(getBannedUsersAction()); // Refresh banned users
        dispatch(getReportedUsersAction()); // Refresh reported users so banned users stay in the list
    };


    const handleUnbanUser = (userId) => {
        dispatch(unBanUserAction(userId)).then(() => {
            dispatch(getBannedUsersAction()); // Refresh banned users list
        });
    };

    const handleClearReports = async (userId) => {
        await dispatch(clearReportsAction(userId));
        dispatch(getReportedUsersAction());
    };



    const handlePasswordChange = (e) => {
        e.preventDefault();
        dispatch(updateAdminPasswordAction({ currentPassword, newPassword })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
            }
        });
    };

    const handleDeleteUser = (userId) => {
        if (userId === user._id && user.role === "admin") {
            alert("You cannot delete your own account!");
            return;
        }

        if (window.confirm("Are you sure you want to delete this user?")) {
            dispatch(deleteUserAction(userId));
        }
    };

    if (user?.role !== "admin") {
        return <h1 style={styles.accessDenied}>Access Denied! Admins Only</h1>;
    }

    const handleLogout = () => {
        dispatch(logoutUserAction()).then(() => {
            dispatch(getAllUsersHomeAction())
            navigate('/');
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={styles.logoutButton}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                    Logout
                </button>
            </div>

            <p style={styles.welcomeText}>Welcome, <strong>{user.name}</strong></p>
            <p style={styles.emailText}>Email: {user.email}</p>

            {error && <p style={styles.error}>{error}</p>}
            {message && <p style={styles.success}>{message}</p>}

            <div style={styles.imageUploadSection}>
                {user?.profileImage && (
                    <img
                        src={user.profileImage}
                        alt="Current Profile"
                        style={styles.profileImage}
                    />
                )}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                />
                {preview && (
                    <img
                        src={preview}
                        alt="Preview"
                        style={styles.previewImage}
                    />
                )}
                <button
                    onClick={handleUpload}
                    style={{
                        ...styles.uploadButton,
                        ...(loading ? styles.buttonDisabled : {})
                    }}
                    disabled={!selectedFile || loading}
                >
                    {loading ? (
                        <span>Uploading...</span>
                    ) : (
                        "Upload Image"
                    )}
                </button>
            </div>

            <div style={styles.statsSection}>
                <h2>User Management</h2>
                <p>Total Users: {totalUsers?.length || 0}</p>

                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <div style={styles.userListContainer}>
                        {Array.isArray(totalUsers) && totalUsers.length > 0 ? (
                            <ul style={styles.userList}>
                                {totalUsers.map((user) => (
                                    <li key={user._id} style={styles.userItem}>
                                        <strong>{user.name}</strong> - {user.email} ({user.role})
                                        {user.role !== "admin" && (
                                            <button onClick={() => handleDeleteUser(user._id)} style={styles.deleteButton}>
                                                Delete
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No users found</p>
                        )}
                    </div>
                )}
            </div>

            <div>
                <h2>Reported Users</h2>
                {Array.isArray(reportedUsers) && reportedUsers.length > 0 ? (
                    reportedUsers.map((user) => (
                        <div key={user._id}>
                            {user.name} ({user.email})
                            <button
                                onClick={() => handleBanUser(user._id)}
                                disabled={bannedUsers.some(banned => banned._id === user._id)}
                            >
                                {bannedUsers.some(banned => banned._id === user._id) ? "Banned" : "Ban"}
                            </button>
                            <button onClick={() => handleClearReports(user._id)}>Clear Reports</button>
                        </div>
                    ))
                ) : (
                    <p>No reported users</p>
                )}
            </div>


            <div>
                <h2>Banned Users</h2>
                {bannedUsers.length > 0 ? (
                    bannedUsers.map((user) => (
                        <div key={user._id}>
                            {user.name} ({user.email})
                            <button onClick={() => handleUnbanUser(user._id)}>Unban</button>
                        </div>
                    ))
                ) : (
                    <p>No banned users</p>
                )}
            </div>


            <form onSubmit={handleUpdateName}>
                <label>Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Name"}
                </button>
            </form>

            <form onSubmit={handleUpdateEmail}>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Email"}
                </button>
            </form>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChange} style={styles.form}>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    style={styles.input}
                    required
                />
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    style={styles.input}
                    required
                />
                <button type="submit" style={styles.updateButton} disabled={loading}>
                    {loading ? "Changing..." : "Change Password"}
                </button>
            </form>
        </div>
    );
};

// Styles Object
const styles = {
    container: {
        maxWidth: "600px",
        margin: "40px auto",
        padding: "24px",
        backgroundColor: "#2d3748",
        color: "#f9fafb",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        textAlign: "center",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
    },
    title: {
        fontSize: "24px",
        fontWeight: "bold",
    },
    logoutButton: {
        backgroundColor: "#ef4444",
        color: "white",
        padding: "8px 16px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    welcomeText: {
        fontSize: "18px",
    },
    emailText: {
        fontSize: "16px",
        color: "#d1d5db",
    },
    userListContainer: {
        maxHeight: "200px",
        overflowY: "auto",
        marginTop: "10px",
        padding: "10px",
        backgroundColor: "#1f2937",
        borderRadius: "4px",
    },
    userList: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
    },
    userItem: {
        padding: "8px 0",
        borderBottom: "1px solid #4b5563",
    },
    error: {
        color: "red",
        marginTop: "10px",
    },
    success: {
        color: "green",
        marginTop: "10px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "20px",
    },
    input: {
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
    }, imageUploadSection: {
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
    },
    profileImage: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        marginBottom: '10px'
    },
    previewImage: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover'
    },
    fileInput: {
        width: '100%',
        padding: '8px',
        backgroundColor: '#4a5568',
        borderRadius: '4px',
        color: 'white'
    },
    uploadButton: {
        width: '100%',
        padding: '8px',
        backgroundColor: '#48bb78',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '8px'
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
        cursor: 'not-allowed',
        opacity: 0.7
    },
    updateButton: {
        backgroundColor: "#3b82f6",
        color: "white",
        padding: "10px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    accessDenied: {
        color: "red",
        textAlign: "center",
        marginTop: "20px",
    },
};

export default AdminDashboard;
