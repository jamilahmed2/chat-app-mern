import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordAction } from "../actions/authActions";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { useEffect } from "react";
import AlertNotification from '../components/AlertNotification';

const ResetPassword = () => {
    const [formData, setFormData] = useState({
        otp: '',
        newPassword: ''
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const { otp, newPassword } = formData;
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoading, error, successMessage } = useSelector((state) => state.auth);
    
    // Get email from navigation state
    const email = location.state?.email;

    // If no email is found, redirect to OTP page
    useEffect(() => {
        if (!email) {
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!otp || !newPassword) {
            return;
        }
        
        const requestData = { otp, newPassword, email };
        dispatch(resetPasswordAction(requestData)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                navigate("/login");
            }
        });
    };

    // Don't render anything while redirecting
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
                        <div className="reset-password-container">
                            <div className="reset-password-wrapper">
                                <h2 className="reset-password-title">Reset Password</h2>
                                <p className="reset-password-subtitle">
                                    Enter the verification code sent to your email and create a new password.
                                </p>
                                
                                <form onSubmit={handleSubmit} className="reset-password-form">
                                    <div className="form-group">
                                        <label htmlFor="otp">Verification Code (OTP)</label>
                                        <input
                                            type="text"
                                            id="otp"
                                            name="otp"
                                            placeholder="Enter the verification code" 
                                            value={otp} 
                                            onChange={onChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            placeholder="Create a new password" 
                                            value={newPassword} 
                                            onChange={onChange} 
                                            required 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="reset-password-button"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Resetting Password..." : "Reset Password"}
                                    </button>
                                </form>
                                
                                <div className="reset-password-footer">
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

export default ResetPassword;
