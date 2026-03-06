import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiEdit2, FiLogOut, FiShield, FiSave, FiX, FiPlus, FiActivity, FiDollarSign, FiUsers } from 'react-icons/fi';
import './Dashboard.css';
import './GroupDetails.css';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customSplits, setCustomSplits] = useState([]);

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [message, setMessage] = useState('');
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [payerId, setPayerId] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [splitType, setSplitType] = useState('EQUAL');
    const [activities, setActivities] = useState([]);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settlePayeeId, setSettlePayeeId] = useState('');
    const [settleAmount, setSettleAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('General');
    const [expenseNotes, setExpenseNotes] = useState('');

    const categories = ['Trip', 'Home', 'Couple', 'Other'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
    const expenseCategories = ['General', 'Food', 'Transport', 'Rent', 'Utilities', 'Entertainment', 'Other'];

    const handleAddExpense = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

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

        try {
            const payload = {
                description: desc,
                amount: parseFloat(amount),
                group_id: parseInt(groupId),
                payer_id: parseInt(payerId),
                split_type: splitType,
                category: expenseCategory,
                notes: expenseNotes,
                date: expenseDate
            };

            if (splitType !== 'EQUAL' && customSplits.length > 0) {
                payload.splits = customSplits.map(split => ({
                    user_id: parseInt(split.user_id),
                    amount: parseFloat(split.amount)
                }));
            }

            await api.post('/expenses/', payload);

            setDesc('');
            setAmount('');
            setPayerId('');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setSplitType('EQUAL');
            setCustomSplits([]);
            setExpenseCategory('General');
            setExpenseNotes('');

            refreshAllData();
            setMessage('Expense added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error adding expense", error);
            setMessage(error.response?.data?.detail || 'Failed to add expense.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSettleUp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses/settle', {
                group_id: parseInt(groupId),
                payee_id: parseInt(settlePayeeId),
                amount: parseFloat(settleAmount)
            });
            setIsSettleModalOpen(false);
            setSettlePayeeId('');
            setSettleAmount('');
            refreshAllData();
            setMessage('Settlement recorded!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Failed to record settlement.');
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await api.get(`/expenses/activities?group_id=${groupId}`);
            setActivities(response.data);
        } catch (error) {
            console.error("Error fetching activities", error);
        }
    };

    const refreshAllData = () => {
        fetchGroupDetails();
        fetchMembers();
        fetchBalances();
        fetchExpenses();
        fetchActivities();
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
        if (members.length > 0 && customSplits.length === 0) {
            setCustomSplits(members.map(m => ({ user_id: m.id, amount: '' })));
        }
    }, [members, balances, customSplits.length]);

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
        refreshAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    return (
        <div className="group-details-page-premium">
            {isSettleModalOpen && (
                <div className="modal-overlay-premium">
                    <div className="modal-content-premium">
                        <div className="modal-header-premium">
                            <h3>Settle Up</h3>
                            <button onClick={() => setIsSettleModalOpen(false)} className="btn-close-modal"><FiX /></button>
                        </div>
                        <form onSubmit={handleSettleUp} className="premium-settle-form">
                            <div className="input-group">
                                <label>Who did you pay?</label>
                                <select
                                    value={settlePayeeId}
                                    onChange={(e) => setSettlePayeeId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a member</option>
                                    {members.filter(m => m.id !== user.id).map(m => (
                                        <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Amount Paid</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={settleAmount}
                                    onChange={(e) => setSettleAmount(e.target.value)}
                                    required
                                    step="0.01"
                                />
                            </div>
                            <button type="submit" className="btn-confirm-settle">Save Settlement</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="group-header-premium">
                {isEditing ? (
                    <form onSubmit={handleUpdateGroup} className="edit-group-inline-form-premium">
                        <div className="edit-header-row">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Group Name"
                                required
                                className="edit-name-input"
                            />
                            <div className="header-action-btns">
                                <button type="button" onClick={() => setIsEditing(false)} className="icon-btn-cancel" title="Cancel">
                                    <FiX />
                                </button>
                                <button type="submit" className="icon-btn-save" title="Save">
                                    <FiSave />
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Add a description..."
                            className="edit-desc-textarea"
                        />
                        <div className="edit-meta-row">
                            <div className="select-wrapper">
                                <label>Category</label>
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="select-wrapper">
                                <label>Currency</label>
                                <select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)}>
                                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="group-info-main">
                        <div className="header-top-row">
                            <div className="title-area">
                                <h1>{group?.name || 'Loading...'}</h1>
                                <div className="badge-group">
                                    <span className="premium-badge category">{group?.category || 'Trip'}</span>
                                    <span className="premium-badge currency">{group?.currency || 'INR'}</span>
                                </div>
                                {user?.id === group?.admin_id && (
                                    <button onClick={() => setIsEditing(true)} className="edit-trigger" title="Edit Group">
                                        <FiEdit2 />
                                    </button>
                                )}
                            </div>
                            <div className="header-actions-premium">
                                <button
                                    onClick={() => setIsSettleModalOpen(true)}
                                    className="btn-premium-settle"
                                >
                                    Settle Up
                                </button>
                                <Link to="/dashboard" className="btn-back-premium">
                                    <FiArrowLeft /> Dashboard
                                </Link>
                                {group && user?.id !== group?.admin_id && (
                                    <button onClick={handleLeaveGroup} className="btn-leave-premium" title="Leave Group">
                                        <FiLogOut /> Leave
                                    </button>
                                )}
                            </div>
                        </div>
                        {group?.description && <p className="group-description-text">{group?.description}</p>}
                    </div>
                )}
            </div>

            {message && <div className={`status-msg-premium ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

            <div className="group-details-grid-premium">
                {/* Left Column: Members & Add Member */}
                <div className="grid-column members-col">
                    <div className="premium-card">
                        <div className="card-header-premium">
                            <FiUsers className="header-icon" />
                            <h3>Members</h3>
                        </div>

                        <div className="add-member-inline-premium">
                            <form onSubmit={addMember}>
                                <input
                                    type="email"
                                    placeholder="Add by email..."
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    required
                                />
                                <button type="submit"><FiPlus /></button>
                            </form>
                        </div>

                        {members.length === 0 ? (
                            <div className="empty-state-small">No members yet</div>
                        ) : (
                            <div className="members-scroll-area">
                                {members.map(member => {
                                    const balanceData = balances.find(b => b.user_id === member.id);
                                    const balance = balanceData ? balanceData.balance : 0;
                                    const debts = balanceData ? balanceData.debts : [];

                                    return (
                                        <div key={member.id} className="member-row-premium">
                                            <div className="member-main-info">
                                                <div className="member-identity">
                                                    <span className="member-name">{member.full_name || member.email}</span>
                                                    {group?.admin_id === member.id && (
                                                        <span className="admin-tag"><FiShield /></span>
                                                    )}
                                                </div>
                                                <div className={`member-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                                                    {balance === 0 ? 'Settled' : formatCurrency(balance, group?.currency, true)}
                                                </div>
                                            </div>

                                            {debts.length > 0 && (
                                                <div className="member-debts-list">
                                                    {debts.map((debt, idx) => (
                                                        <div key={idx} className="debt-detail">
                                                            {debt.debtor_id === member.id ? (
                                                                <>Owes {debt.creditor_name.split(' ')[0]}: <span>{formatCurrency(debt.amount, group?.currency)}</span></>
                                                            ) : (
                                                                <>Gets from {debt.debtor_name.split(' ')[0]}: <span>{formatCurrency(debt.amount, group?.currency)}</span></>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Column: Add Expense & Expenses List */}
                <div className="grid-column main-col">
                    <div className="premium-card highlight-card">
                        <div className="card-header-premium">
                            <FiDollarSign className="header-icon" />
                            <h3>Add Expense</h3>
                        </div>
                        <form onSubmit={handleAddExpense} className="premium-expense-form">
                            <div className="form-row-multi">
                                <div className="input-field main">
                                    <input
                                        type="text"
                                        placeholder="What was it for?"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-field amount">
                                    <span className="curr-sym">{group?.currency}</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            if (splitType !== 'EQUAL') {
                                                setCustomSplits(members.map(m => ({ user_id: m.id, amount: '' })));
                                            }
                                        }}
                                        required
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row-multi">
                                <div className="select-field">
                                    <label>Paid by</label>
                                    <select value={payerId} onChange={(e) => setPayerId(e.target.value)} required>
                                        <option value="">Select payer</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="select-field">
                                    <label>Category</label>
                                    <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                                        {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row-multi">
                                <div className="date-field">
                                    <label>Date</label>
                                    <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                                </div>
                                <div className="select-field">
                                    <label>Split Type</label>
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
                                    >
                                        <option value="EQUAL">Split Equally</option>
                                        <option value="EXACT">Exact Amounts</option>
                                        <option value="PERCENTAGE">Percentages</option>
                                    </select>
                                </div>
                            </div>

                            {splitType !== 'EQUAL' && (
                                <div className="custom-splits-area">
                                    <h4>{splitType === 'EXACT' ? 'Individual Amounts' : 'Percentage Share'}</h4>
                                    <div className="splits-grid">
                                        {members.map((member, idx) => (
                                            <div key={member.id} className="split-row">
                                                <span>{member.full_name?.split(' ')[0] || member.email.split('@')[0]}</span>
                                                <div className="split-input-wrap">
                                                    <input
                                                        type="number"
                                                        value={customSplits[idx]?.amount || ''}
                                                        onChange={(e) => {
                                                            const newSplits = [...customSplits];
                                                            newSplits[idx] = { user_id: member.id, amount: e.target.value };
                                                            setCustomSplits(newSplits);
                                                        }}
                                                        placeholder="0"
                                                    />
                                                    {splitType === 'PERCENTAGE' && <i>%</i>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-add-expense-premium" disabled={isSubmitting}>
                                {isSubmitting ? 'Adding...' : <><FiPlus /> Add Expense</>}
                            </button>
                        </form>
                    </div>

                    <div className="premium-card">
                        <div className="card-header-premium">
                            <FiActivity className="header-icon" />
                            <h3>Expenses</h3>
                        </div>
                        <div className="expenses-list-premium">
                            {expenses.length === 0 ? (
                                <div className="empty-state-large">No expenses recorded yet.</div>
                            ) : (
                                expenses.map(expense => (
                                    <div key={expense.id} className="expense-item-premium">
                                        <div className="exp-main">
                                            <div className="exp-info">
                                                <span className="exp-desc">{expense.description}</span>
                                                <div className="exp-meta">
                                                    <span className="exp-cat">{expense.category}</span>
                                                    <span className="exp-payer">Paid by {expense.payer_name}</span>
                                                    <span className="exp-date">{new Date(expense.date || expense.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="exp-amount">
                                                {formatCurrency(expense.amount, group?.currency)}
                                            </div>
                                        </div>
                                        {expense.notes && <p className="exp-notes">{expense.notes}</p>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="grid-column activity-col">
                    <div className="premium-card">
                        <div className="card-header-premium">
                            <FiActivity className="header-icon" />
                            <h3>Activity</h3>
                        </div>
                        <div className="activity-list-premium">
                            {activities.length === 0 ? (
                                <div className="empty-state-small">No activity logs</div>
                            ) : (
                                activities.map(activity => (
                                    <div key={activity.id} className="activity-item-premium">
                                        <p>{activity.description}</p>
                                        <span>{formatRelativeTime(activity.created_at)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDetails;
