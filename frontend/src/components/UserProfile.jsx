import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAction } from '../reducers/authSlice';
import { IoArrowBackOutline } from 'react-icons/io5';

const UserProfile = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: currentUser,isLoggedIn } = useSelector((state) => state.auth);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                const result = await dispatch(getUserAction(id)).unwrap();
                setUserDetails(result);
            } catch (err) {
                // setError(err.message || 'Failed to load user details');
                navigate('/', {replace: true})
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, [dispatch, id]);


    if (loading) return <div className="profile-container"><div className="loading">Loading user details...</div></div>;
    if (error) return <div className="profile-container"><div className="error-message">{error}</div></div>;
    if (!userDetails) return <div className="profile-container"><div className="not-found">User not found</div></div>;

    return (
        <div className="profile-container">
            <div className="profile-header">
                <Link to="/" className="back-button">
                    <IoArrowBackOutline /> Back to Home
                </Link>
                <h1 className='page-nav'>{userDetails.name} Profile</h1>
            </div>

            <div className="profile-card">
                <div className="profile-image-container">
                    <img
                        src={userDetails.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"}
                        alt={`${userDetails.name}'s profile`}
                        className="profile-image"
                    />
                    <div className="user-status">
                        <span className={`status-indicator ${userDetails.status === 'online' ? 'online' : 'offline'}`}></span>
                        <span className="status-text">{userDetails.status || 'offline'}</span>
                    </div>
                </div>

                <div className="profile-details">
                    <h2>{userDetails.name}</h2>
                    <p className="email">{userDetails.email}</p>

                    {currentUser && currentUser._id !== userDetails._id && (
                        <div className="profile-actions">
                            {/* You can add friend actions, chat button, etc. here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;