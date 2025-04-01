import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../reducers/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import AlertNotification from '../components/AlertNotification';
import Header from "../components/Header";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error, successMessage } = useSelector((state) => state.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser({ email, password })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                const userData = res.payload;
    
                if (userData.isVerified === false) {
                    alert(userData.message);
                    // localStorage.setItem("userEmail", userData.email);
                    localStorage.removeItem("user");
                    navigate("/verify-OTP", { state: { email } });
                } else {
                    // localStorage.removeItem("userEmail");
                    localStorage.setItem("user", JSON.stringify(userData));
                    navigate("/");
                }
            }
        });
    };

    return (
        <div className="home-container">
            {error && <AlertNotification message={error} type="error" />}
            {successMessage && <AlertNotification message={successMessage} type="success" />}
        

                {/* Main Content */}
                <main className="home-content">
                    <div className="content-container">
                        <div className="login-form-container">
                            <div className="login-form-wrapper">
                                <h2 className="login-title">Login to Your Account</h2>
                                <form onSubmit={handleSubmit} className="login-form">
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
                                    
                                    <div className="form-group">
                                        <label htmlFor="password">Password</label>
                                        <input
                                            type="password"
                                            id="password"
                                            placeholder="Enter your password" 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    
                                    <div className="forgot-password">
                                        <Link to="/forgot-password">Forgot Password?</Link>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="login-button"
                                        disabled={loading}
                                    >
                                        {loading ? "Logging in..." : "Login"}
                                    </button>
                                </form>
                                
                                <div className="login-footer">
                                    <p>Don't have an account? <Link to="/register">Register</Link></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
        </div>
    );
};

export default Login;
