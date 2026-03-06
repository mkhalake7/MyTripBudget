import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';

import { FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupCategory, setNewGroupCategory] = useState('Trip');
    const [newGroupCurrency, setNewGroupCurrency] = useState(user?.default_currency || 'INR');
    const [message, setMessage] = useState('');

    const categories = ['Trip', 'Home', 'Office', 'Friends', 'Other'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

    const [summary, setSummary] = useState({ total_balance: 0, owed_to_you: 0, you_owe: 0, group_summaries: [] });

    const fetchDashboardData = async () => {
        try {
            const [groupsRes, summaryRes] = await Promise.all([
                api.get('/groups/'),
                api.get('/expenses/summary')
            ]);
            setGroups(groupsRes.data);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                setMessage('Not authenticated - please log in.');
            } else {
                setMessage(`Failed to load data.`);
            }
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const createGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups/', {
                name: newGroupName,
                description: newGroupDescription,
                category: newGroupCategory,
                currency: newGroupCurrency
            });
            setNewGroupName('');
            setNewGroupDescription('');
            setNewGroupCategory('Trip');
            setNewGroupCurrency('INR');
            fetchDashboardData();
            setMessage('Group created successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error creating group", error);
            setMessage('Failed to create group.');
        }
    };

    const deleteGroup = async (e, groupId) => {
        e.preventDefault();
        if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            try {
                await api.delete(`/groups/${groupId}`);
                fetchDashboardData();
                setMessage('Group deleted successfully.');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error("Error deleting group", error);
                setMessage('Failed to delete group.');
            }
        }
    };

    const getGroupBalance = (groupId) => {
        const groupSummary = summary.group_summaries.find(s => s.group_id === groupId);
        return groupSummary ? groupSummary.balance : 0;
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-summary">
                <div className="summary-card">
                    <span className="summary-label">Total balance</span>
                    <span className={`summary-value ${summary.total_balance >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(summary.total_balance, user?.default_currency || 'INR', true)}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">You are owed</span>
                    <span className="summary-value positive">
                        {formatCurrency(summary.owed_to_you, user?.default_currency || 'INR')}
                    </span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">You owe</span>
                    <span className="summary-value orange">
                        {formatCurrency(summary.you_owe, user?.default_currency || 'INR')}
                    </span>
                </div>
            </div>

            <div className="dashboard-header">
                <h2>Your Groups</h2>
            </div>
            {/* ... rest of the form ... */}

            <div className="create-group-section">
                <form onSubmit={createGroup} className="create-group-form">
                    <div className="form-row">
                        <select
                            value={newGroupCategory}
                            onChange={(e) => setNewGroupCategory(e.target.value)}
                            className="category-select"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={newGroupCurrency}
                            onChange={(e) => setNewGroupCurrency(e.target.value)}
                            className="currency-select"
                        >
                            {currencies.map(curr => (
                                <option key={curr} value={curr}>{curr}</option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Enter new group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Enter group description (optional)..."
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        className="description-input"
                    />
                    <button type="submit" className="btn btn-primary">Create Group</button>
                </form>
                {message && <div className="message success">{message}</div>}
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't joined any groups yet. Create one to get started!</p>
                </div>
            ) : (
                <div className="groups-grid">
                    {groups.map(group => (
                        <Link to={`/groups/${group.id}`} key={group.id} className="group-card">
                            <div className="group-card-header">
                                <h3>{group.name}</h3>
                                <button
                                    className="btn-delete-icon"
                                    onClick={(e) => deleteGroup(e, group.id)}
                                    title="Delete Group"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                            <div className="group-badges">
                                <span className="badge category-badge">{group.category || 'Trip'}</span>
                                <span className="badge currency-badge">{group.currency || 'INR'}</span>
                            </div>
                            <div className="group-card-balance">
                                {getGroupBalance(group.id) > 0 ? (
                                    <span className="balance-text positive">you are owed <strong>{formatCurrency(getGroupBalance(group.id), group.currency)}</strong></span>
                                ) : getGroupBalance(group.id) < 0 ? (
                                    <span className="balance-text orange">you owe <strong>{formatCurrency(Math.abs(getGroupBalance(group.id)), group.currency)}</strong></span>
                                ) : (
                                    <span className="balance-text settled">no expenses</span>
                                )}
                            </div>
                            <p>{group.description || 'No description'}</p>
                            <div className="group-meta">
                                <span>Created: {new Date(group.created_at).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
