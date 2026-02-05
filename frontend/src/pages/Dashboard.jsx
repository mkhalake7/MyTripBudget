import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import './Dashboard.css';

import { FiTrash2 } from 'react-icons/fi';

const Dashboard = () => {
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupCategory, setNewGroupCategory] = useState('Trip');
    const [newGroupCurrency, setNewGroupCurrency] = useState('INR');
    const [message, setMessage] = useState('');

    const categories = ['Trip', 'Home', 'Office', 'Friends', 'Other'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

    const fetchGroups = async () => {
        try {
            const response = await api.get('/groups/');
            setGroups(response.data);
        } catch (error) {
            console.error("Error fetching groups", error);
            const status = error.response?.status;
            const detail = error.response?.data?.detail || error.message;
            if (status === 401 || status === 403) {
                setMessage('Not authenticated - please log in.');
            } else {
                setMessage(`Failed to load groups: ${detail}`);
            }
        }
    };

    useEffect(() => {
        // eslint-disable-next-line
        fetchGroups();
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
            fetchGroups();
            setMessage('Group created successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error creating group", error);
            setMessage('Failed to create group.');
        }
    };

    const deleteGroup = async (e, groupId) => {
        e.preventDefault(); // Prevent navigation to group details
        if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            try {
                await api.delete(`/groups/${groupId}`);
                fetchGroups();
                setMessage('Group deleted successfully.');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error("Error deleting group", error);
                setMessage('Failed to delete group.');
            }
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Your Groups</h2>
            </div>

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
