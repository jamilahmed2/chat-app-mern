import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, setTempEmail } from "../reducers/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { IoLogoOctocat, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import AlertNotification from '../components/AlertNotification';

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [role, setRole] = useState("user");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading, error, successMessage } = useSelector((state) => state.auth);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(registerUser({ name, email, password, role })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                dispatch(setTempEmail(email)); // Store email in Redux instead of localStorage
                setOtpSent(true);
                navigate("/verify-OTP");
            }
        });
    };

    // Check if user is already logged in and redirect
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role === "admin") {
                navigate("/", { replace: true });  // Use replace to prevent looping
            }
        }
    }, [navigate]);
    return (
        <div className="home-container">
            {error && <AlertNotification message={error} type="error" />}
            {successMessage && <AlertNotification message={successMessage} type="success" />}
          
                {/* Main Content */}
                <main className="home-content">
                    <div className="content-container">
                        <div className="register-form-container">
                            <div className="register-form-wrapper">
                                <h2 className="register-title">Create an Account</h2>
                                <form onSubmit={handleSubmit} className="register-form">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            placeholder="Enter your name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>

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
                                            placeholder="Create a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="register-button"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Creating Account..." : "Register"}
                                    </button>
                                </form>

                                <div className="register-footer">
                                    <p>Already have an account? <Link to="/login">Login</Link></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            
        </div>
    );
};

export default Register;
