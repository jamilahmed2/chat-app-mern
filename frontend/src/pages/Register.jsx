import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser,setTempEmail  } from "../reducers/authSlice";
import { Link, useNavigate } from "react-router-dom";



const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpSent, setOtpSent] = useState(false); 
    const [role, setRole] = useState("user");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error } = useSelector((state) => state.auth);


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
    }, []);


    

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Register</h2>
                {error && <p style={styles.error}>{error}</p>}
                <input type="text" placeholder="Name" style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Link to="/login" style={{ color:"white",}}>Already have an account? Login</Link>
                <button style={styles.button} type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
};

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
        border: '1px solid #ccc'
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

export default Register;
