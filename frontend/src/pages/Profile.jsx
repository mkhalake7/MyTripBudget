import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Profile.css';
import { FiUser, FiMail, FiPhone, FiDollarSign, FiLock, FiTrash2, FiCamera, FiEdit3, FiX, FiCheck } from 'react-icons/fi';

const Profile = () => {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form states
    const [fullName, setFullName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [defaultCurrency, setDefaultCurrency] = useState('INR');

    // Password form states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
            setFullName(response.data.full_name || '');
            setMobileNumber(response.data.mobile_number || '');
            setDefaultCurrency(response.data.default_currency || 'INR');
        } catch (error) {
            showMessage('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/users/me', {
                full_name: fullName,
                mobile_number: mobileNumber,
                default_currency: defaultCurrency
            });
            setProfile(response.data);
            setIsEditing(false);
            showMessage('Profile updated successfully!', 'success');
        } catch (error) {
            showMessage(error.response?.data?.detail || 'Failed to update profile', 'error');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        try {
            await api.post('/users/me/password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showMessage('Password changed successfully!', 'success');
        } catch (error) {
            showMessage(error.response?.data?.detail || 'Failed to change password', 'error');
        }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/users/me/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(response.data);
            showMessage('Profile picture updated!', 'success');
        } catch (error) {
            showMessage(error.response?.data?.detail || 'Failed to upload picture', 'error');
        }
    };

    const handleDeactivateAccount = async () => {
        if (!window.confirm('Are you sure you want to deactivate your account? You will be logged out and won\'t be able to log back in.')) {
            return;
        }
        try {
            await api.delete('/users/me');
            showMessage('Account deactivated', 'success');
            setTimeout(() => logout(), 1500);
        } catch (error) {
            showMessage('Failed to deactivate account', 'error');
        }
    };

    if (loading) return (
        <div className="profile-container">
            <div className="loading-shimmer">Loading your profile...</div>
        </div>
    );

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="header-badge">Account Settings</div>
                <h1>Personal Profile</h1>
                <p>Manage your account preferences and security settings.</p>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.type === 'success' ? <FiCheck /> : <FiX />}
                    {message.text}
                </div>
            )}

            <div className="profile-grid">
                {/* Left Column: Basic Info & Avatar */}
                <div className="profile-sidebar">
                    <div className="profile-card avatar-card">
                        <div className="avatar-wrapper">
                            {profile?.profile_picture ? (
                                <img
                                    src={`http://127.0.0.1:8000${profile.profile_picture}`}
                                    alt="Profile"
                                    className="profile-avatar-img"
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <label className="avatar-upload-label">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePictureUpload}
                                    hidden
                                />
                                <FiCamera />
                            </label>
                        </div>
                        <div className="avatar-info">
                            <h2>{profile?.full_name}</h2>
                            <p>{profile?.email}</p>
                        </div>
                    </div>

                    <div className="profile-card danger-card">
                        <h3>Danger Zone</h3>
                        <p>Once you deactivate your account, there is no going back. Please be certain.</p>
                        <button className="btn-danger-lite" onClick={handleDeactivateAccount}>
                            <FiTrash2 /> Deactivate Account
                        </button>
                    </div>
                </div>

                {/* Right Column: Detailed Settings */}
                <div className="profile-main">
                    <div className="profile-card settings-card">
                        <div className="card-header-flex">
                            <div className="card-title">
                                <FiUser className="title-icon" />
                                <h3>Personal Details</h3>
                            </div>
                            {!isEditing && (
                                <button className="btn-edit-text" onClick={() => setIsEditing(true)}>
                                    <FiEdit3 /> Edit
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="premium-form">
                                <div className="form-group-grid">
                                    <div className="form-group">
                                        <label><FiUser /> Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><FiPhone /> Mobile Number</label>
                                        <input
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label><FiDollarSign /> Default Currency</label>
                                        <select
                                            value={defaultCurrency}
                                            onChange={(e) => setDefaultCurrency(e.target.value)}
                                        >
                                            {currencies.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-footer">
                                    <button type="submit" className="btn-premium">Save Changes</button>
                                    <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="details-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Full Name</span>
                                    <span className="info-value">{profile?.full_name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Email Address</span>
                                    <span className="info-value">{profile?.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Mobile Number</span>
                                    <span className="info-value">{profile?.mobile_number || 'Not provided'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Default Currency</span>
                                    <span className="info-value">{profile?.default_currency || 'INR'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="profile-card settings-card">
                        <div className="card-header-flex">
                            <div className="card-title">
                                <FiLock className="title-icon" />
                                <h3>Security</h3>
                            </div>
                            {!showPasswordForm && (
                                <button className="btn-edit-text" onClick={() => setShowPasswordForm(true)}>
                                    Change Password
                                </button>
                            )}
                        </div>

                        {showPasswordForm ? (
                            <form onSubmit={handleChangePassword} className="premium-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group-grid">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-footer">
                                    <button type="submit" className="btn-premium">Update Password</button>
                                    <button type="button" className="btn-ghost" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <p className="security-text">Your password was last changed some time ago. We recommend regular updates for better security.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
