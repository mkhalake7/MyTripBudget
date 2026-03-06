import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './RecentActivity.css';
import { FiActivity, FiClock, FiDollarSign, FiUserPlus, FiArrowRight } from 'react-icons/fi';
import { formatRelativeTime } from '../utils/formatters';

const RecentActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            const response = await api.get('/expenses/activities');
            setActivities(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching activities", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'EXPENSE_ADDED':
                return { icon: <FiDollarSign />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'PAYMENT_MADE':
                return { icon: <FiClock />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'MEMBER_JOINED':
                return { icon: <FiUserPlus />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
            default:
                return { icon: <FiActivity />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
        }
    };

    if (loading) return (
        <div className="activity-page-container">
            <div className="loading-shimmer">Loading your activity feed...</div>
        </div>
    );

    return (
        <div className="activity-page-container">
            <div className="activity-page-header">
                <div className="header-badge">Updates</div>
                <h1>Recent Activity</h1>
                <p>Stay updated with all the latest splits and joins across your groups.</p>
            </div>

            <div className="activity-feed">
                {activities.length === 0 ? (
                    <div className="empty-activity">
                        <div className="empty-icon-wrapper">
                            <FiActivity size={32} />
                        </div>
                        <h3>No activity yet</h3>
                        <p>When you add expenses or settle debts, they'll appear right here!</p>
                    </div>
                ) : (
                    activities.map((activity) => {
                        const { icon, color, bg } = getActivityIcon(activity.type);
                        return (
                            <div key={activity.id} className="activity-feed-item">
                                <div className="activity-feed-icon" style={{ color: color, background: bg }}>
                                    {icon}
                                </div>
                                <div className="activity-feed-content">
                                    <div className="activity-main">
                                        <span className="activity-feed-desc">{activity.description}</span>
                                        <div className="activity-feed-meta">
                                            <span className="activity-feed-group">{activity.group_name}</span>
                                            <span className="dot">•</span>
                                            <span className="activity-feed-time">
                                                {formatRelativeTime(activity.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <FiArrowRight className="activity-arrow" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
