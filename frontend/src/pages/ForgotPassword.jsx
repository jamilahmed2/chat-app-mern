import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPasswordAction } from "../reducers/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import AlertNotification from '../components/AlertNotification';

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error, passwordResetEmailSent } = useSelector((state) => state.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(forgotPasswordAction(email)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                navigate("/reset-password", { state: { email } });
            }
        });
    };

    return (
        <div className="home-container">
            {error && <AlertNotification message={error} type="error" />}
            {passwordResetEmailSent && <AlertNotification message="Email sent successfully!" type="success" />}
           

                {/* Main Content */}
                <main className="home-content">
                    <div className="content-container">
                        <div className="forgot-password-container">
                            <div className="forgot-password-wrapper">
                                <h2 className="forgot-password-title">Forgot Password</h2>
                                <p className="forgot-password-subtitle">Enter your email address to reset your password.</p>
                                
                                <form onSubmit={handleSubmit} className="forgot-password-form">
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="Enter your email" 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="forgot-password-button"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Sending..." : "Reset Password"}
                                    </button>
                                </form>
                                
                                <div className="forgot-password-footer">
                                    <p>Remember your password? <Link to="/login">Back to Login</Link></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            
        </div>
    );
};

export default ForgotPassword;
