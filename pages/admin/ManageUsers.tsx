
import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { useAuth } from '../../AuthContext';
import { Plus, Search, X, Trash2, Wallet, Power, Ban, CheckCircle, Gift, AlertTriangle, Edit } from 'lucide-react';

const ManageUsers: React.FC = () => {
    const { allUsers, addUser, deleteUser, modifyUserBalance, addManualDeposit, toggleUserStatus, giveBonus, updateUserData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        fullName: '',
        email: '',
        password: '',
        availableBalance: 0,
    });
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // Balance Modal State
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceAction, setBalanceAction] = useState<'add' | 'subtract'>('add');

    // Bonus Modal State
    const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
    const [selectedUserForBonus, setSelectedUserForBonus] = useState<User | null>(null);
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusRemark, setBonusRemark] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string, name: string } | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        mobile: '',
        address: '',
        state: '',
        zip: '',
        country: ''
    });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const openDeleteModal = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        e.preventDefault();
        setUserToDelete({ id: user.id, name: user.fullName });
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        const result = await deleteUser(userToDelete.id);
        showNotification(result.success ? 'success' : 'error', result.message);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleToggleStatus = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        e.preventDefault();
        toggleUserStatus(userId);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setNewUser(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleAddNewUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.fullName || !newUser.email || !newUser.password) {
            showNotification('error', 'Please fill all required fields.');
            return;
        }
        if (newUser.password.length < 8) {
            showNotification('error', 'Password must be at least 8 characters long.');
            return;
        }

        const result = await addUser(newUser);
        showNotification(result.success ? 'success' : 'error', result.message);
        
        if (result.success) {
            setIsModalOpen(false);
            setNewUser({ fullName: '', email: '', password: '', availableBalance: 0 });
        }
    };

    const openBalanceModal = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedUserForBalance(user);
        setBalanceAmount('');
        setBalanceAction('add');
        setIsBalanceModalOpen(true);
    };

    const handleBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForBalance || !balanceAmount) return;

        const amount = parseFloat(balanceAmount);
        if (isNaN(amount) || amount <= 0) {
            showNotification('error', 'Please enter a valid positive amount.');
            return;
        }

        let result;
        if (balanceAction === 'add') {
            // Use addManualDeposit to generate a log
            result = await addManualDeposit(selectedUserForBalance.id, amount);
        } else {
            // Subtract
            result = await modifyUserBalance(selectedUserForBalance.id, -amount);
        }

        showNotification(result.success ? 'success' : 'error', result.message);

        if (result.success) {
            setIsBalanceModalOpen(false);
            setSelectedUserForBalance(null);
        }
    };

    const openBonusModal = (e: React.MouseEvent, user: User) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedUserForBonus(user);
        setBonusAmount('');
        setBonusRemark('Loyalty Bonus');
        setIsBonusModalOpen(true);
    };

    const handleBonusSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForBonus || !bonusAmount) return;
        const amount = parseFloat(bonusAmount);
        if (isNaN(amount) || amount <= 0) {
            showNotification('error', 'Invalid amount');
            return;
        }
        const result = await giveBonus(selectedUserForBonus.id, amount, bonusRemark);
        showNotification(result.success ? 'success' : 'error', result.message);
        setIsBonusModalOpen(false);
    };

    const openEditModal = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedUserForEdit(user);
        setEditFormData({
            fullName: user.fullName || '',
            mobile: user.mobile || '',
            address: user.address || '',
            state: user.state || '',
            zip: user.zip || '',
            country: user.country || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForEdit) return;

        const result = await updateUserData(selectedUserForEdit.id, editFormData);
        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) {
            setIsEditModalOpen(false);
            setSelectedUserForEdit(null);
        }
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const filteredUsers = allUsers.filter(user =>
        user.role !== 'admin' && (
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <>
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Manage Users</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, Email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none"
                            />
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90">
                            <Plus size={18} /> Add New
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Balance</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {filteredUsers.map((user) => {
                                const isBanned = user.status === 'Banned';
                                const statusLabel = isBanned ? 'Banned' : 'Active';
                                
                                return (
                                <tr key={user.id} className={`border-b border-gray-200 dark:border-slate-700 transition-colors ${isBanned ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=4f46e5&color=fff&size=40`} alt={user.fullName} className="h-10 w-10 rounded-full" />
                                            <div>
                                                <span className="font-medium">{user.fullName}</span>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                {user.joinedAt && <p className="text-xs text-gray-400 mt-0.5">Joined: {new Date(user.joinedAt).toLocaleDateString()}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user.availableBalance)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${!isBanned ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => openEditModal(e, user)} className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-3 py-1 rounded-md flex items-center gap-1 text-sm hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button onClick={(e) => openBalanceModal(e, user)} className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300 px-3 py-1 rounded-md flex items-center gap-1 text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors">
                                                <Wallet size={14} /> Balance
                                            </button>
                                            <button onClick={(e) => openBonusModal(e, user)} className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 px-3 py-1 rounded-md flex items-center gap-1 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors">
                                                <Gift size={14} /> Bonus
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => handleToggleStatus(e, user.id)}
                                                className={`${!isBanned ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'} px-3 py-1 rounded-md flex items-center gap-1 text-sm`}
                                            >
                                                <Power size={14} /> {!isBanned ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => openDeleteModal(e, user)}
                                                className="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 px-3 py-1 rounded-md flex items-center gap-1 text-sm hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add New User</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddNewUser}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input type="text" name="fullName" value={newUser.fullName} onChange={handleInputChange} placeholder="e.g., John Doe" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input type="email" name="email" value={newUser.email} onChange={handleInputChange} placeholder="e.g., user@example.com" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                    <input type="password" name="password" value={newUser.password} onChange={handleInputChange} placeholder="Min. 8 characters" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Balance</label>
                                    <input type="number" name="availableBalance" value={newUser.availableBalance} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="w-auto bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary/90 transition duration-300">
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUserForEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Edit User Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input type="text" name="fullName" value={editFormData.fullName} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Read Only)</label>
                                    <input type="email" value={selectedUserForEdit.email} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                    <input type="text" name="mobile" value={editFormData.mobile} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <input type="text" name="address" value={editFormData.address} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                        <input type="text" name="state" value={editFormData.state} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip</label>
                                        <input type="text" name="zip" value={editFormData.zip} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                    <input type="text" name="country" value={editFormData.country} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Balance Modal */}
            {isBalanceModalOpen && selectedUserForBalance && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Manage Balance</h3>
                            <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBalanceSubmit}>
                            <div className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedUserForBalance.availableBalance)}
                                    </p>
                                    <p className="text-sm text-primary font-medium mt-1">{selectedUserForBalance.fullName}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setBalanceAction('add')}
                                        className={`py-2 px-4 rounded-md font-medium border ${balanceAction === 'add' ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        Add (+)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setBalanceAction('subtract')}
                                        className={`py-2 px-4 rounded-md font-medium border ${balanceAction === 'subtract' ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400'}`}
                                    >
                                        Subtract (-)
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={balanceAmount}
                                            onChange={(e) => setBalanceAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                            required
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsBalanceModalOpen(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="w-auto bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary/90 transition duration-300">
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Give Bonus Modal */}
            {isBonusModalOpen && selectedUserForBonus && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Send Bonus</h3>
                            <button onClick={() => setIsBonusModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBonusSubmit}>
                            <div className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{selectedUserForBonus.fullName}</p>
                                    <p className="text-xs text-gray-500">{selectedUserForBonus.email}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bonus Amount</label>
                                    <input
                                        type="number"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remark / Message</label>
                                    <input
                                        type="text"
                                        value={bonusRemark}
                                        onChange={(e) => setBonusRemark(e.target.value)}
                                        placeholder="e.g., Loyalty Bonus"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsBonusModalOpen(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                                    Send Bonus
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="bg-red-100 text-red-600 p-3 rounded-full mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Delete User</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Are you sure you want to permanently delete <span className="font-bold text-gray-800 dark:text-gray-200">{userToDelete.name}</span>?
                                <br />
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end">
                             <button 
                                onClick={() => setIsDeleteModalOpen(false)} 
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteUser} 
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold shadow-md transition-colors"
                            >
                                Yes, Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageUsers;
