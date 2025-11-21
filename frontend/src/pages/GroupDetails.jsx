import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiArrowLeft } from 'react-icons/fi';
import './Dashboard.css'; // Import styles for grid and cards

const GroupDetails = () => {
    const { groupId } = useParams();
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
                        <div className="group-card-header">
                            <h3>Members List</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                            {members.map(member => (
                                <li key={member.id} style={{ padding: '8px 0' }}>
                                    {member.full_name || member.email}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

        </div>
    );
};

export default GroupDetails;
