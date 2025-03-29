import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../reducers/authSlice";
import { Link, useNavigate } from "react-router-dom";

// Add these styles in a separate CSS file or use inline styles
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
    },
    form: {
        backgroundColor: 'grey',
        padding: '24px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '320px'
    },
    title: {
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '16px'
    },
    error: {
        color: 'red'
    },
    input: {
        width: '100%',
        padding: '8px',
        marginBottom: '8px',
        border: '1px solid #ddd'
    },
    button: {
        width: '100%',
        padding: '8px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        cursor: 'pointer'
    }
};

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error } = useSelector((state) => state.auth);

   
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
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Login</h2>
                {error && <p style={styles.error}>{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    style={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    style={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Link to="/forgot-password" style={{ marginBottom: '16px', display: 'block', color: 'white' }}>Forgot Password</Link>
                <Link to="/register" style={{ marginBottom: '16px', display: 'block', color: 'white' }}>Don't have an account?</Link>
                <button style={styles.button} type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
};

export default Login;
