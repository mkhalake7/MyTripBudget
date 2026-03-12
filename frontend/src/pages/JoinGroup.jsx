import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css'; // Reuse Auth styles

const JoinGroup = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const [inviteInfo, setInviteInfo] = useState(None);
    const [loading, setLoading] = useState(True);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        password: '',
        confirm_password: ''
    });

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const response = await api.get(`/invitations/verify/${token}`);
                setInviteInfo(response.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Invalid or expired invitation link');
            } finally {
                setLoading(False);
            }
        };
        verifyToken();
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleJoinExisting = async () => {
        try {
            await api.post(`/invitations/join/${token}`);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to join group');
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await api.post(`/invitations/claim/${token}`, {
                full_name: formData.full_name,
                password: formData.password
            });
            // Auto login with the returned token
            localStorage.setItem('token', response.data.access_token);
            window.location.href = '/dashboard'; // Hard reload to refresh context
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to claim account');
        }
    };

    if (loading) return <div className="loading">Checking invitation...</div>;

    if (error) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="error-text">Invitation Error</h2>
                    <p>{error}</p>
                    <button className="auth-button" onClick={() => navigate('/')}>Return Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Join Group</h2>
                <p className="invite-text">
                    <strong>{inviteInfo.inviter_name}</strong> invited you to join <strong>{inviteInfo.group_name}</strong>
                </p>

                {user ? (
                    <div className="logged-in-join">
                        <p>You are logged in as <strong>{user.email}</strong></p>
                        {user.email === inviteInfo.email ? (
                            <button className="auth-button" onClick={handleJoinExisting}>Accept Invitation & Join</button>
                        ) : (
                            <p className="error-text">This invitation was sent to {inviteInfo.email}. Please logout and use the correct account.</p>
                        )}
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleClaim}>
                        <p className="small-text">Create an account to join the group and start tracking expenses.</p>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={inviteInfo.email} disabled className="disabled-input" />
                        </div>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a password"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                required
                                placeholder="Confirm your password"
                            />
                        </div>
                        <button type="submit" className="auth-button">Create Account & Join Group</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default JoinGroup;
