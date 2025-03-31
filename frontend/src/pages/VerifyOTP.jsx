import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTPAction, resendOTPAction, setTempEmail } from "../reducers/authSlice";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import AlertNotification from '../components/AlertNotification';

const VerifyOTP = () => {
    const [otp, setOtp] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loadingType, setLoadingType] = useState(null);
    
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoading, error, successMessage } = useSelector((state) => state.auth);
    
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

        const result = await dispatch(verifyOTPAction(requestData));

        if (result.meta.requestStatus === "fulfilled") {
            dispatch(setTempEmail(null)); // Clear temp email after verification
            navigate("/");
        }
    };

    const handleResendOTP = async () => {
        setLoadingType("resend"); // Mark resend action
        await dispatch(resendOTPAction(email));
        setLoadingType(null); // Reset after action completes
    };

    // Don't render anything if there's no email
    if (!email) return null;

    return (
        <div className="home-container">
            {error && <AlertNotification message={error} type="error" />}
            {successMessage && <AlertNotification message={successMessage} type="success" />}
            <div className="home-layout">
                {/* Header/Navbar */}
                <header className="home-header">
                    <div className="header-container">
                        <div className="header-logo">
                            <IoLogoOctocat />
                            <span>Social Chat</span>
                        </div>
                        
                        {/* Hamburger Menu Button (Mobile Only) */}
                        <button 
                            className="hamburger-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMobileMenuOpen(!mobileMenuOpen);
                            }}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <IoCloseOutline /> : <IoMenuOutline />}
                        </button>
                        
                        {/* Navigation - Desktop */}
                        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                            <ul className="nav-list">
                                <li className="nav-item">
                                    <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="home-content">
                    <div className="content-container">
                        <div className="verify-otp-container">
                            <div className="verify-otp-wrapper">
                                <h2 className="verify-otp-title">Verify OTP</h2>
                                <p className="verify-otp-subtitle">
                                    Enter the verification code sent to your email address.
                                </p>
                                
                                <form onSubmit={handleSubmit} className="verify-otp-form">
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
                                        className="verify-otp-button"
                                        disabled={isLoading && loadingType === "verify"}
                                    >
                                        {isLoading && loadingType === "verify" ? "Verifying..." : "Verify OTP"}
                                    </button>
                                </form>
                                
                                <div className="verify-otp-actions">
                                    <button 
                                        className="resend-otp-button"
                                        onClick={handleResendOTP}
                                        disabled={isLoading && loadingType === "resend"}
                                    >
                                        {isLoading && loadingType === "resend" ? "Sending..." : "Resend OTP"}
                                    </button>
                                </div>
                                
                                <div className="verify-otp-footer">
                                    <p>Remember your password? <Link to="/login">Back to Login</Link></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default VerifyOTP;
