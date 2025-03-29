import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom'
import {  updateUserEmailAction, updateUserNameAction, updateUserPasswordAction, setTempEmail, uploadProfileImageAction, logoutUserAction, getAllUsersHomeAction } from "../reducers/authSlice.jsx";

const UserDashboard = () => {
    const { user, loading, error } = useSelector((state) => state.auth);
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

            const result = await dispatch(uploadProfileImageAction(formData));

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
        dispatch(updateUserNameAction({ name }));
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        // console.log("Updating email for:", email);

        // Fix: Pass email as an object
        dispatch(updateUserEmailAction({ email })).then((res) => {
            // console.log("Response from updateAdminEmailAction:", res);
            if (res.meta.requestStatus === "fulfilled") {
                dispatch(setTempEmail(email))
                navigate("/verify-email");
            }
        });
    };
    // Handle password change
    const handlePasswordChange = (e) => {
        e.preventDefault();
        dispatch(updateUserPasswordAction({ currentPassword, newPassword })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Password updated successfully");
                setCurrentPassword("");
                setNewPassword("");
            }
        });
    };

    // Handle logout
      const handleLogout = () => {
            dispatch(logoutUserAction()).then(() => {
                dispatch(getAllUsersHomeAction())
                navigate('/');
            });
        };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>User Profile</h2>
            {user && (
                <div style={{ marginBottom: '20px', color: 'white' }}>
                    <p>Name: <strong>{user.name}</strong> </p>
                    <p>Email: {user.email}</p>
                </div>
            )}            {loading && <p>Loading...</p>}
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

            {/* Update Name & Email Form */}
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
            <h3 style={styles.subtitle}>Change Password</h3>
            <form onSubmit={handlePasswordChange} style={styles.form}>
                <input
                    type="password"
                    placeholder="Current Password"
                    style={styles.input}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="New Password"
                    style={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button type="submit" style={styles.updateButton} disabled={loading}>
                    {loading ? "Changing..." : "Change Password"}
                </button>
            </form>

            {/* Logout Button */}
            <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
            </button>
        </div>
    );
};

// Styles Object
const styles = {
    container: {
        maxWidth: "400px",
        margin: "40px auto",
        padding: "24px",
        backgroundColor: "#2d3748",
        color: "#f9fafb",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        textAlign: "center",
    },
    title: {
        fontSize: "24px",
        fontWeight: "bold",
        marginBottom: "16px",
    },
    subtitle: {
        fontSize: "20px",
        fontWeight: "bold",
        marginTop: "24px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "16px",
    },
    input: {
        width: "100%",
        padding: "8px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        marginBottom: "8px",
    },
    updateButton: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    imageUploadSection: {
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
    logoutButton: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "16px",
    },
    error: {
        color: "red",
        marginTop: "10px",
    },
    success: {
        color: "green",
        marginTop: "10px",
    },
};

export default UserDashboard;