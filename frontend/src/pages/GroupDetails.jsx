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
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState('');

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses/', {
                description: desc,
                amount: parseFloat(amount),
                group_id: parseInt(groupId),
                payer_id: parseInt(payerId),
                split_type: 'EQUAL' // Defaulting to EQUAL for now
            });
            setDesc('');
            setAmount('');
            setPayerId('');
            fetchBalances(); // Refresh balances
            fetchExpenses(); // Refresh expenses list
            setMessage('Expense added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error adding expense", error);
            setMessage('Failed to add expense.');
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/groups/${groupId}/members`);
            setMembers(response.data);
        } catch (error) {
            console.error("Error fetching members", error);
        }
    };

    const [expenses, setExpenses] = useState([]);

    const fetchExpenses = async () => {
        try {
            const response = await api.get(`/expenses/group/${groupId}`);
            setExpenses(response.data);
        } catch (error) {
            console.error("Error fetching expenses", error);
        }
    };

    const fetchBalances = async () => {
        try {
            const response = await api.get(`/expenses/balances/${groupId}`);
            setBalances(response.data);
        } catch (error) {
            console.error("Error fetching balances", error);
        }
    };


    useEffect(() => {
        console.log("Members state:", members);
        console.log("Balances state:", balances);
    }, [members, balances]);

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
        fetchExpenses();
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

            <div className="members-section" style={{ marginTop: '2rem', display: 'flex', gap: '20px' }}>
                {members.length === 0 ? (
                    <div className="empty-state" style={{ flex: 1 }}>
                        <p>No members in this group yet.</p>
                    </div>
                ) : (
                    <div className="group-card" style={{ cursor: 'default', padding: '20px', flex: 1 }}>
                        <div className="group-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h3>Members List</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                            {members.map(member => {
                                const balanceData = balances.find(b => b.user_id === member.id);
                                const balance = balanceData ? balanceData.balance : 0;
                                const debts = balanceData ? balanceData.debts : [];

                                return (
                                    <li key={member.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>{member.full_name || member.email}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                {balance === 0 ? (
                                                    <span style={{ color: '#6b7280' }}>Settled</span>
                                                ) : (
                                                    <>
                                                        <span style={{ color: balance > 0 ? '#10b981' : '#ef4444' }}>
                                                            {balance > 0 ? '+' : '-'}${Math.abs(balance).toFixed(2)}
                                                        </span>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        {debts.length > 0 && (
                                            <div style={{ fontSize: '0.9rem', marginLeft: '12px' }}>
                                                {debts.map((debt, idx) => {
                                                    const isDebtor = debt.debtor_id === member.id;
                                                    const amountColor = isDebtor ? '#ef4444' : '#10b981';
                                                    return (
                                                        <div key={idx} style={{
                                                            color: 'white',
                                                            padding: '3px 0',
                                                            fontWeight: '500'
                                                        }}>
                                                            {isDebtor ? (
                                                                <>↑ Owes {debt.creditor_name}: <span style={{ color: amountColor }}>${debt.amount.toFixed(2)}</span></>
                                                            ) : (
                                                                <>↓ Gets back from {debt.debtor_name}: <span style={{ color: amountColor }}>${debt.amount.toFixed(2)}</span></>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <div className="group-card" style={{ cursor: 'default', padding: '20px', flex: 1 }}>
                    <div className="group-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h3>Add Expense</h3>
                    </div>
                    <form onSubmit={handleAddExpense} className="create-group-form" style={{ flexDirection: 'column' }}>
                        <input
                            type="text"
                            placeholder="Description"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            required
                            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <select
                            value={payerId}
                            onChange={(e) => setPayerId(e.target.value)}
                            required
                            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">Select Payer</option>
                            {members.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.full_name || member.email}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Expense</button>
                    </form>
                </div>
            </div>

            <div className="expenses-list-section" style={{ marginTop: '2rem' }}>
                <div className="group-card" style={{ cursor: 'default', padding: '20px' }}>
                    <div className="group-card-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h3>Expenses List</h3>
                    </div>
                    {expenses.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No expenses recorded yet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                            {expenses.map(expense => {
                                const payer = members.find(m => m.id === expense.payer_id);
                                return (
                                    <li key={expense.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>{expense.description}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                Paid by {payer ? (payer.full_name || payer.email) : 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#333' }}>
                                            ${expense.amount.toFixed(2)}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

        </div>
    );
};

export default GroupDetails;
