import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { userEmailResendOTPAction, setTempEmail, verifyEmailOTPAction, userEmailOTPAction ,adminEmailResendOTPAction} from "../reducers/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const VerifyEamil = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [loadingType, setLoadingType] = useState(null);
    const { user, isLoading, error } = useSelector((state) => state.auth);
    const { register, handleSubmit } = useForm();

    const { tempEmail } = useSelector((state) => state.auth);
    const email = location.state?.email || tempEmail; // Get email from Redux

    useEffect(() => {
        if (!tempEmail) {
            navigate("/");
        }
    }, [email, navigate]);


    const onSubmit = async (data) => {
        setLoadingType("verify");
        const requestData = { ...data, email };
        // console.log("verify email mai data check", requestData)
        let result;
        if (user?.role === "admin") {
            // console.log("admin email verify")
            result = await dispatch(verifyEmailOTPAction(requestData));
        } else if (user?.role === "user") {
            // console.log("user email verify")
            result = await dispatch(userEmailOTPAction(requestData));
        } else if (result.meta.requestStatus === "fulfilled") {
            dispatch(setTempEmail(null)); // Clear temp email after verification
            navigate("/");
        } else {
            window.alert("verify email error")
        }
    };

    const handleResendOTP = async () => {
        setLoadingType("resend"); // Mark resend action
        if (user?.role === "admin") {
            await dispatch(adminEmailResendOTPAction(email)); // Ensure the correct email is sent
        } else if (user?.role === "user") {
            await dispatch(userEmailResendOTPAction(email)); // Ensure the correct email is sent
        }
        setLoadingType(null); // Reset after action completes
    };

    return (
        <>

            <div style={styles.container}>
                <h2 style={styles.title}>Verify Email </h2>
                {error && <p style={styles.errorText}>{error}</p>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <input
                        type="text"
                        {...register("otp", { required: true })}
                        placeholder="Enter OTP"
                        style={styles.input}
                    />
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(isLoading && loadingType === "verify" ? styles.buttonDisabled : {}),
                        }}
                        disabled={isLoading && loadingType === "verify"}
                    >
                        {isLoading && loadingType === "verify" ? "Verifying..." : "Verify"}
                    </button>


                    <button
                        style={{
                            ...styles.button,
                            ...styles.resendButton,
                            ...(isLoading && loadingType === "resend" ? styles.buttonDisabled : {}),
                        }}
                        onClick={handleResendOTP}
                        disabled={isLoading && loadingType === "resend"}
                    >
                        {isLoading && loadingType === "resend" ? "Resending..." : "Send OTP"}
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
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
        borderRadius: "8px",
        textAlign: "center",
    },
    title: {
        fontSize: "20px",
        fontWeight: "bold",
        marginBottom: "10px",
    },
    input: {
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        fontSize: "16px",
    },
    button: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "16px",
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
        cursor: "not-allowed",
    },
    errorText: {
        color: "red",
        marginBottom: "10px",
    },
    resendButton: {
        marginTop: "10px",
        backgroundColor: "#28a745",
    }
};

export default VerifyEamil;
