import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { FiUsers, FiClock, FiSmartphone, FiCheckCircle } from 'react-icons/fi';

const Home = () => {
    return (
        <div className="home-container mesh-gradient">
            {/* Navigation */}
            <nav className="home-nav glass">
                <div className="nav-logo">
                    <img src="/vita.svg" alt="MyTripBudget" className="logo-img" />
                    <span className="logo-text">MyTripBudget</span>
                </div>
                <div className="nav-auth">
                    <Link to="/login" className="nav-link-login">Log in</Link>
                    <Link to="/register" className="btn-signup">Sign up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1>The easiest way to split the bill</h1>
                    <p>
                        Whether it's for a group trip, a night out with friends, or shared household expenses,
                        MyTripBudget makes managing shared costs effortless. No fees, no ads, no limits.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-hero-primary">Get started for free</Link>
                    </div>
                </div>
                <div className="hero-image-container">
                    <img
                        src="/assets/hero.png"
                        alt="MyTripBudget App"
                        className="hero-img"
                    />
                </div>
            </header>

            {/* Features Section */}
            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon"><FiClock /></div>
                    <h3>Sync in seconds</h3>
                    <p>Everyone in the group can see the expenses and balances updated in real-time.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><FiUsers /></div>
                    <h3>Whoever you're with</h3>
                    <p>Perfect for travelers, roommates, couples, or anyone sharing costs.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><FiSmartphone /></div>
                    <h3>Mobile Ready</h3>
                    <p>Access your budgets anywhere. Plan your next move even while on the go.</p>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section">
                <div className="trust-content">
                    <h2>Everything adds, everyone knows</h2>
                    <div className="trust-items">
                        <div className="trust-item">
                            <FiCheckCircle className="check-icon" />
                            <span>Stay on top of who's even</span>
                        </div>
                        <div className="trust-item">
                            <FiCheckCircle className="check-icon" />
                            <span>No more awkward "who owes who" moments</span>
                        </div>
                        <div className="trust-item">
                            <FiCheckCircle className="check-icon" />
                            <span>Clear, transparent settlement history</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} MyTripBudget. Built for travelers.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
