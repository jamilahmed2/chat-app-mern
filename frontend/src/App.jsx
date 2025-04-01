import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserDashboard from './pages/UserDashboard';
import ChatPage from './pages/Chat';
import UserProfile from './components/UserProfile';
import NotFound from './pages/NotFound';
import VerifyOTP from './pages/VerifyOTP';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AlertNotification from './components/AlertNotification';
import { useSelector } from 'react-redux';

// Create a wrapper component to handle header visibility
const HeaderWrapper = () => {
  const location = useLocation();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  // Define paths where header should be hidden
  const noHeaderPaths = [
    '/chats',
    '/dashboard',
    '/user-dashboard'
  ];

  // Check if current path starts with any of the noHeaderPaths
  const shouldHideHeader = noHeaderPaths.some(path =>
    location.pathname.startsWith(path)
  );

  return shouldHideHeader ? null : <Header />;
};

const App = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const { error, successMessage } = useSelector((state) => state.auth);

  return (
    <>
      <Router>
        <div className="home-container">
          {error && <AlertNotification message={error} type="error" />}
          {successMessage && <AlertNotification message={successMessage} type="success" />}
          <div className="home-layout">
            <HeaderWrapper />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/dashboard"
                element={
                  user ? (
                    user.role === "admin" ? <Dashboard /> : <Navigate to="/" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/user-dashboard"
                element={
                  user ? (
                    user.role === "user" ? <UserDashboard /> : <Navigate to="/" />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
              <Route path="/verify-OTP" element={<VerifyOTP />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {user ? (
                <>
                  <Route path="/chats" element={<ChatPage />} />
                  <Route path="/chats/:userId" element={<ChatPage />} />
                  <Route path="/users/:id" element={<UserProfile />} />
                </>
              ) : null}
              <Route
                path="/users/:id"
                element={user ? <UserProfile /> : <Navigate to="/" replace />}
              />

              <Route
                path="/login"
                element={!user ? <Login /> : user.role === "admin" ? <Navigate to="/dashboard" /> : <Navigate to="/user-dashboard" />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </Router>
    </>
  );
};

export default App;

