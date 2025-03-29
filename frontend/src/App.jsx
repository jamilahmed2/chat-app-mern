import './App.css'
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'
import Home from './pages/Home'
import { useDispatch, useSelector } from 'react-redux'
import UserDashboard from './pages/UserDashboard'
import VerifyOTP from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import socket from './utils/socket';
import { useEffect } from 'react'
import { addNotification } from './reducers/notificationSlice'
import ChatPage from './pages/Chat'

function App() {

  const dispatch =useDispatch();
  const { user } = useSelector((state) => state.auth);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      socket.on('newNotification', (notification) => {
        useDispatch(addNotification(notification));
      });
    }

    return () => {
      socket.off('newNotification');
    };
  }, [dispatch]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Protected Routes Based on Role */}
          <Route
            path="/dashboard"
            element={
              user ? (
                user.role === "admin" ? <Dashboard /> : <Navigate to="/" />
              ) : (
                <Navigate to="/login" /> // Redirect if not logged in
              )
            }
          />
          <Route
            path="/user-dashboard"
            element={
              user ? (
                user.role === "user" ? <UserDashboard /> : <Navigate to="/" />
              ) : (
                <Navigate to="/login" /> // Redirect if not logged in
              )
            }
          />

          {/* Auth Routes */}
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route path="/verify-OTP" element={<VerifyOTP />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/chats/:userId" element={<ChatPage />} />

          <Route
            path="/login"
            element={!user ? <Login /> : user.role === "admin" ? <Navigate to="/dashboard" /> : <Navigate to="/user-dashboard" />}
          />

          {/* Redirect unknown routes to Home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
