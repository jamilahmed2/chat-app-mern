import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    userEmailResendOTPAction,
    setTempEmail,
    verifyEmailOTPAction,
    userEmailOTPAction,
    adminEmailResendOTPAction
} from "../reducers/authSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import AlertNotification from '../components/AlertNotification';

const VerifyEmail = () => {
    const [otp, setOtp] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loadingType, setLoadingType] = useState(null);

    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isLoading, error, successMessage } = useSelector((state) => state.auth);

    const { tempEmail } = useSelector((state) => state.auth);
    const email = location.state?.email || tempEmail; // Get email from Redux

    useEffect(() => {
        if (!email) {
            navigate("/");
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp) {
            return;
        }

        setLoadingType("verify");
        const requestData = { otp, email };

        let result;
        if (user?.role === "admin") {
            result = await dispatch(verifyEmailOTPAction(requestData));
        } else if (user?.role === "user") {
            result = await dispatch(userEmailOTPAction(requestData));
        }

        if (result && result.meta.requestStatus === "fulfilled") {
            dispatch(setTempEmail(null)); // Clear temp email after verification
            navigate("/");
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

    // Don't render anything if there's no email
    if (!email) return null;

    return (
        <div className="home-container">
            {error && <AlertNotification message={error} type="error" />}
            {successMessage && <AlertNotification message={successMessage} type="success" />}


            {/* Main Content */}
            <main className="home-content">
                <div className="content-container">
                    <div className="verify-email-container">
                        <div className="verify-email-wrapper">
                            <h2 className="verify-email-title">Verify Email Address</h2>
                            <p className="verify-email-subtitle">
                                Enter the verification code sent to your email address to complete the verification process.
                            </p>

                            <form onSubmit={handleSubmit} className="verify-email-form">
                                <div className="form-group">
                                    <label htmlFor="otp">Verification Code (OTP)</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        placeholder="Enter the verification code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="verify-email-button"
                                    disabled={isLoading && loadingType === "verify"}
                                >
                                    {isLoading && loadingType === "verify" ? "Verifying..." : "Verify Email"}
                                </button>
                            </form>

                            <div className="verify-email-actions">
                                <button
                                    className="resend-otp-button"
                                    onClick={handleResendOTP}
                                    disabled={isLoading && loadingType === "resend"}
                                >
                                    {isLoading && loadingType === "resend" ? "Sending..." : "Resend Verification Code"}
                                </button>
                            </div>

                            <div className="verify-email-footer">
                                <p>Remember your password? <Link to="/login">Back to Login</Link></p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

        </div>
    );
};

export default VerifyEmail;
