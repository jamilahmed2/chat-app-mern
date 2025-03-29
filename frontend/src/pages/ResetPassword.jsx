import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordAction } from "../actions/authActions";
import { useNavigate,useLocation } from "react-router-dom";
import { useEffect } from "react";

const ResetPassword = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoading, error, successMessage } = useSelector((state) => state.auth);
    const { register, handleSubmit } = useForm();
    // Get email from navigation state
    const email = location.state?.email;

    // If no email is found, redirect to OTP page
    useEffect(() => {
        if (!email) {
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

    // Don't render anything while redirecting
    if (!email) return null;
    const onSubmit = (data) => {
        const requestData = { ...data, email };
        // console.log("Reset Password Data:", data); // Debugging
        dispatch(resetPasswordAction(requestData)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                navigate("/login");
            }
        });
    };


    return (
        <>
            <div style={styles.container}>
                <h2 style={styles.heading}>Reset Password</h2>
                {error && <p style={styles.error}>{error}</p>}
                {successMessage && <p style={styles.success}>{successMessage}</p>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* <input
                        type="email"
                        {...register("email", { required: true })}
                        placeholder="Enter your email"
                        style={styles.input}
                    /> */}
                    <input
                        type="text"
                        {...register("otp", { required: true })}
                        placeholder="Enter OTP"
                        style={styles.input}
                    />
                    <input
                        type="password"
                        {...register("newPassword", { required: true })}
                        placeholder="Enter new password"
                        style={styles.input}
                    />
                    <button
                        type="submit"
                        style={styles.button}
                        disabled={isLoading}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </>
    );
};

const styles = {
    container: {
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        backgroundColor: "grey",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        textAlign: "center"
    },
    heading: {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "15px"
    },
    input: {
        width: "94%",
        padding: "10px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px"
    },
    button: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
    },
    error: {
        color: "red",
        marginBottom: "10px"
    },
    success: {
        color: "green",
        marginBottom: "10px"
    }
};

export default ResetPassword;
