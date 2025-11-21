import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft } from 'react-icons/fi';
import './Dashboard.css'; // Import styles for grid and cards

const GroupDetails = () => {
    const { groupId } = useParams();
    const [balances, setBalances] = useState([]);
    const [members, setMembers] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [message, setMessage] = useState('');

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/groups/${groupId}/members`);
            setMembers(response.data);
        } catch (error) {
            console.error("Error fetching members", error);
        }
    };

    const fetchBalances = async () => {
        try {
            const response = await api.get(`/expenses/group/${groupId}/balances`);
            setBalances(response.data);
        } catch (error) {
            console.error("Error fetching balances", error);
        }
    };

    const getMemberBalance = (memberId) => {
        // Assuming balances API returns a list of objects with user_id and balance
        // Adjust based on actual API response structure. 
        // If balances is a list of { user_id: 1, balance: 50.0 }, find by user_id.
        // If members have IDs, match them.
        // Based on previous context, balances might be linked by user_id or email.
        // Let's try to find a match.
        const balanceObj = balances.find(b => b.user_id === memberId);
        return balanceObj ? balanceObj.balance : 0;
    };

    const addMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${groupId}/members?email=${newMemberEmail}`);
            setNewMemberEmail('');
            fetchMembers();
            setMessage('Member added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error adding member", error);
            setMessage('Failed to add member. User might not exist or is already in group.');
        }
    };

    useEffect(() => {
        fetchMembers();
        fetchBalances();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Group Details</h2>
                <Link to="/dashboard" className="back-right">
                    <FiArrowLeft style={{ marginRight: 8 }} /> Back to Dashboard
                </Link>
            </div>

            <div className="create-member-section">
                <h3>Add New Member</h3>
                <form onSubmit={addMember} className="create-group-form">
                    <input
                        type="text"
                        placeholder="Enter new member email..."
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary">Add Member</button>
                </form>
                {message && <div className="message success" style={{ marginTop: '10px' }}>{message}</div>}
            </div>

            <div className="members-section" style={{ marginTop: '2rem' }}>

                {members.length === 0 ? (
                    <div className="empty-state">
                        <p>No members in this group yet.</p>
                    </div>
                ) : (
                    <div className="group-card" style={{ cursor: 'default', padding: '20px', maxWidth: '50%' }}>
                        <div className="group-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h3 >Members List</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                            {members.map(member => {
                                const balance = getMemberBalance(member.id);
                                return (
                                    <li key={member.id} style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{member.full_name || member.email}</span>
                                        <span style={{ color: balance > 0 ? 'green' : balance < 0 ? 'red' : 'gray', fontWeight: 'bold' }}>
                                            {balance === 0 ? 'Settled' : `${balance > 0 ? '+' : ''}${balance.toFixed(2)}`}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

        </div>
    );
};

export default GroupDetails;
