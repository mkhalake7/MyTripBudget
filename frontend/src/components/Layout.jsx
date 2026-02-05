import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="logo">
                    <img src="/vita.svg" alt="MyTripBudget Logo" style={{ height: '120px' }} />
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span>📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span>👤</span> Profile
                    </NavLink>
                </nav>

                <div className="user-section">
                    <div className="user-avatar">
                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.full_name}</div>
                        <div className="user-email">{user?.email}</div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                        🚪
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
