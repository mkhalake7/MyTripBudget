import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiEdit2, FiLogOut, FiShield, FiSave, FiX } from 'react-icons/fi';
import './Dashboard.css';
import './GroupDetails.css';

const GroupDetails = () => {
    const { groupId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [balances, setBalances] = useState([]);
    const [members, setMembers] = useState([]);

    // Edit Group State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCategory, setEditCategory] = useState('Trip');
    const [editCurrency, setEditCurrency] = useState('INR');

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [message, setMessage] = useState('');
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [splitType, setSplitType] = useState('EQUAL');
    const [customSplits, setCustomSplits] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['Trip', 'Home', 'Office', 'Friends', 'Other'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

    const handleAddExpense = async (e) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) {
            console.log("Already submitting, ignoring duplicate request");
            return;
        }

        // Validation for custom splits
        if (splitType === 'EXACT') {
            const total = customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
            if (Math.abs(total - parseFloat(amount)) > 0.01) {
                setMessage(`Split amounts must sum to ${amount}. Current total: ${total.toFixed(2)}`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
        } else if (splitType === 'PERCENTAGE') {
            const total = customSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
            if (Math.abs(total - 100) > 0.01) {
                setMessage(`Percentages must sum to 100. Current total: ${total.toFixed(2)}%`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
        }

        setIsSubmitting(true);
        console.log("Submitting expense...");

        try {
            const payload = {
                description: desc,
                amount: parseFloat(amount),
                group_id: parseInt(groupId),
                payer_id: parseInt(payerId),
                split_type: splitType,
                date: expenseDate
            };

            // Add splits for EXACT and PERCENTAGE
            if (splitType !== 'EQUAL' && customSplits.length > 0) {
                payload.splits = customSplits.map(split => ({
                    user_id: parseInt(split.user_id),
                    amount: parseFloat(split.amount)
                }));
            }

            console.log("Posting expense with payload:", payload);
            await api.post('/expenses/', payload);
            console.log("Expense posted successfully");

            setDesc('');
            setAmount('');
            setPayerId('');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setSplitType('EQUAL');
            setCustomSplits([]);
            fetchBalances(); // Refresh balances
            fetchExpenses(); // Refresh expenses list
            setMessage('Expense added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error adding expense", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            setMessage(error.response?.data?.detail || 'Failed to add expense.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchGroupDetails = async () => {
        try {
            const response = await api.get(`/groups/${groupId}`);
            setGroup(response.data);
            setEditName(response.data.name);
            setEditDesc(response.data.description || '');
            setEditCategory(response.data.category || 'Trip');
            setEditCurrency(response.data.currency || 'INR');
        } catch (error) {
            console.error("Error fetching group details", error);
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

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/groups/${groupId}`, {
                name: editName,
                description: editDesc,
                category: editCategory,
                currency: editCurrency
            });
            fetchGroupDetails();
            setIsEditing(false);
            setMessage('Group updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to update group.');
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            await api.post(`/groups/${groupId}/leave`);
            navigate('/dashboard');
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Failed to leave group.');
        }
    };

    const [expenses, setExpenses] = useState([]);

    const fetchExpenses = async () => {
        try {
            const response = await api.get(`/expenses/group/${groupId}`);
            console.log("Fetched expenses for group:", groupId, response.data);
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
        fetchGroupDetails();
        fetchMembers();
        fetchBalances();
        fetchExpenses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                {isEditing ? (
                    <form onSubmit={handleUpdateGroup} className="edit-group-inline-form">
                        <div className="form-row" style={{ marginBottom: '10px' }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Group Name"
                                required
                                style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                            />
                            <div className="action-buttons">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-icon" title="Cancel">
                                    <FiX />
                                </button>
                                <button type="submit" className="btn-icon success" title="Save">
                                    <FiSave />
                                </button>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description"
                            className="description-input"
                        />
                        <div className="form-row" style={{ marginTop: '10px' }}>
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)}>
                                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </form>
                ) : (
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h2 style={{ margin: 0 }}>{group?.name || 'Loading...'}</h2>
                            <span className="badge category-badge">{group?.category || 'Trip'}</span>
                            <span className="badge currency-badge">{group?.currency || 'INR'}</span>
                            {user?.id === group?.admin_id && (
                                <button onClick={() => setIsEditing(true)} className="btn-edit-icon" title="Edit Group">
                                    <FiEdit2 />
                                </button>
                            )}
                        </div>
                        <p style={{ color: '#9ca3af', margin: 0 }}>{group?.description}</p>
                    </div>
                )}

                <div className="header-actions">
                    <Link to="/dashboard" className="back-right">
                        <FiArrowLeft style={{ marginRight: 8 }} /> Back
                    </Link>
                    {group && user?.id !== group?.admin_id && (
                        <button onClick={handleLeaveGroup} className="btn-leave" title="Leave Group">
                            <FiLogOut /> Leave
                        </button>
                    )}
                </div>
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
                            1954
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                            {members.map(member => {
                                const balanceData = balances.find(b => b.user_id === member.id);
                                const balance = balanceData ? balanceData.balance : 0;
                                const debts = balanceData ? balanceData.debts : [];

                                return (
                                    <li key={member.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>{member.full_name || member.email}</span>
                                                {group?.admin_id === member.id && (
                                                    <span className="badge admin-badge" title="Group Admin">
                                                        <FiShield style={{ marginRight: '4px' }} /> Admin
                                                    </span>
                                                )}
                                            </div>
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
                            onChange={(e) => {
                                setAmount(e.target.value);
                                // Reset custom splits when amount changes
                                if (splitType !== 'EQUAL') {
                                    setCustomSplits(members.map(m => ({ user_id: m.id, amount: '' })));
                                }
                            }}
                            required
                            step="0.01"
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
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <select
                            value={splitType}
                            onChange={(e) => {
                                const newType = e.target.value;
                                setSplitType(newType);
                                if (newType !== 'EQUAL') {
                                    setCustomSplits(members.map(m => ({ user_id: m.id, amount: '' })));
                                } else {
                                    setCustomSplits([]);
                                }
                            }}
                            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="EQUAL">Equal Split</option>
                            <option value="EXACT">Exact Amounts</option>
                            <option value="PERCENTAGE">Percentage</option>
                        </select>

                        {splitType !== 'EQUAL' && (
                            <div style={{ marginBottom: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                                    {splitType === 'EXACT' ? 'Enter amount for each member:' : 'Enter percentage for each member:'}
                                </h4>
                                {members.map((member, idx) => (
                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                                        <label style={{ flex: 1, fontSize: '0.85rem' }}>{member.full_name || member.email}:</label>
                                        <input
                                            type="number"
                                            placeholder={splitType === 'EXACT' ? '0.00' : '0'}
                                            value={customSplits[idx]?.amount || ''}
                                            onChange={(e) => {
                                                const newSplits = [...customSplits];
                                                newSplits[idx] = { user_id: member.id, amount: e.target.value };
                                                setCustomSplits(newSplits);
                                            }}
                                            step={splitType === 'EXACT' ? '0.01' : '1'}
                                            style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        />
                                        {splitType === 'PERCENTAGE' && <span style={{ fontSize: '0.85rem' }}>%</span>}
                                    </div>
                                ))}
                                {splitType === 'EXACT' && (
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                                        Total: ${customSplits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0).toFixed(2)} / ${amount || '0.00'}
                                    </div>
                                )}
                                {splitType === 'PERCENTAGE' && (
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                                        Total: {customSplits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0).toFixed(2)}% / 100%
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="expenses-list-section" style={{ marginTop: '2rem' }}>
                <div className="group-card" style={{ cursor: 'default', padding: '20px', marginTop: '20px' }}>
                    <div className="group-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h3 style={{ color: 'white' }}>Expenses</h3>
                    </div>
                    {expenses.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                            <p>No expenses yet. Add your first expense above!</p>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {expenses.map(expense => {
                                const expenseDate = new Date(expense.created_at);
                                const formattedDate = expenseDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });

                                return (
                                    <li key={expense.id} style={{
                                        marginBottom: '12px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        transition: 'all 0.2s ease',
                                        cursor: 'default'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '1.05rem',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    marginBottom: '4px'
                                                }}>
                                                    {expense.description}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: '#9ca3af',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span>Paid by <span style={{ color: '#d1d5db', fontWeight: '500' }}>{expense.payer_name}</span></span>
                                                    <span style={{ color: '#4b5563' }}>•</span>
                                                    <span>{formattedDate}</span>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold',
                                                color: '#10b981',
                                                marginLeft: '16px'
                                            }}>
                                                ${expense.amount.toFixed(2)}
                                            </div>
                                        </div>
                                        {expense.split_type && (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: '#6b7280',
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                <span style={{
                                                    background: 'rgba(139, 92, 246, 0.2)',
                                                    color: '#a78bfa',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '500',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {expense.split_type}
                                                </span>
                                            </div>
                                        )}
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
