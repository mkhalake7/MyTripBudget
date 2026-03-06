import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLayout, FiActivity, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    <FiMenu />
                </button>
                <div className="mobile-logo">
                    <img src="/vita.svg" alt="Logo" style={{ height: '32px' }} />
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/vita.svg" alt="MyTripBudget Logo" style={{ height: '80px' }} />
                    <button className="close-sidebar" onClick={closeSidebar}>
                        <FiX />
                    </button>
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                        <FiLayout className="nav-icon" /> Dashboard
                    </NavLink>
                    <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                        <FiActivity className="nav-icon" /> Recent Activity
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
                        <FiUser className="nav-icon" /> Profile
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
                        <FiLogOut />
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
