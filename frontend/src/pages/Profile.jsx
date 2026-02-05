import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Profile.css';

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

    if (loading) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>My Profile</h1>
                <p>Manage your account settings</p>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="profile-content">
                {/* Profile Picture Section */}
                <div className="profile-card profile-picture-section">
                    <div className="profile-picture-wrapper">
                        {profile?.profile_picture ? (
                            <img
                                src={`http://127.0.0.1:8000${profile.profile_picture}`}
                                alt="Profile"
                                className="profile-picture"
                            />
                        ) : (
                            <div className="profile-picture-placeholder">
                                {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <label className="upload-btn">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                hidden
                            />
                            📷 Change Photo
                        </label>
                    </div>
                    <div className="profile-basic-info">
                        <h2>{profile?.full_name}</h2>
                        <p>{profile?.email}</p>
                    </div>
                </div>

                {/* Profile Details Section */}
                <div className="profile-card">
                    <div className="card-header">
                        <h3>Profile Details</h3>
                        {!isEditing && (
                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="profile-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Currency</label>
                                <select
                                    value={defaultCurrency}
                                    onChange={(e) => setDefaultCurrency(e.target.value)}
                                >
                                    {currencies.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="profile-details">
                            <div className="detail-row">
                                <span className="label">Full Name</span>
                                <span className="value">{profile?.full_name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Email</span>
                                <span className="value">{profile?.email}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Mobile Number</span>
                                <span className="value">{profile?.mobile_number || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Default Currency</span>
                                <span className="value">{profile?.default_currency || 'INR'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password Section */}
                <div className="profile-card">
                    <div className="card-header">
                        <h3>Password</h3>
                        {!showPasswordForm && (
                            <button className="btn btn-secondary" onClick={() => setShowPasswordForm(true)}>
                                Change Password
                            </button>
                        )}
                    </div>

                    {showPasswordForm && (
                        <form onSubmit={handleChangePassword} className="profile-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
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
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Update Password</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="profile-card danger-zone">
                    <div className="card-header">
                        <h3>Danger Zone</h3>
                    </div>
                    <p>Deactivating your account will log you out and prevent future logins.</p>
                    <button className="btn btn-danger" onClick={handleDeactivateAccount}>
                        Deactivate Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
