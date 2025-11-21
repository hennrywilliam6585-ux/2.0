
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { Search, Check, X, Clock, BarChart, CheckCircle, DollarSign, Loader2, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow">
    <div className="flex items-center gap-4">
      <div className={`text-white p-3 rounded-full`} style={{backgroundColor: color}}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  </div>
);

const AdminDeposits: React.FC = () => {
    const { allDeposits, approveDeposit, rejectDeposit } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | null;
        id: string | null;
        amount: number;
        userName: string;
    }>({
        isOpen: false,
        type: null,
        id: null,
        amount: 0,
        userName: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // Open Modal
    const openApproveModal = (e: React.MouseEvent, id: string, amount: number, userName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmModal({ isOpen: true, type: 'approve', id, amount, userName });
    };

    const openRejectModal = (e: React.MouseEvent, id: string, amount: number, userName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmModal({ isOpen: true, type: 'reject', id, amount, userName });
    };

    const closeConfirmModal = () => {
        if (isProcessing) return;
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    // Execute Action
    const handleConfirmAction = async () => {
        const { type, id } = confirmModal;
        if (!id || !type) return;

        setIsProcessing(true);
        try {
            let result;
            if (type === 'approve') {
                result = await approveDeposit(id);
            } else {
                result = await rejectDeposit(id);
            }
            showNotification(result.success ? 'success' : 'error', result.message);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Error processing deposit:", error);
            showNotification('error', 'An error occurred while processing the request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredDeposits = useMemo(() => {
        return allDeposits
            .filter(deposit =>
                deposit.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deposit.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deposit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                deposit.gateway.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.initiated).getTime() - new Date(a.initiated).getTime());
    }, [allDeposits, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: allDeposits.length,
            pending: allDeposits.filter(d => d.status === 'Pending').length,
            successful: allDeposits.filter(d => d.status === 'Successful').length,
            totalAmount: allDeposits.reduce((sum, d) => d.status === 'Successful' ? sum + d.amount : sum, 0)
        };
    }, [allDeposits]);
    

    return (
        <div className="space-y-6 relative">
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Deposits" value={stats.total.toString()} icon={<BarChart />} color="#4f46e5" />
                <StatCard title="Pending Deposits" value={stats.pending.toString()} icon={<Clock />} color="#f97316" />
                <StatCard title="Successful Deposits" value={stats.successful.toString()} icon={<CheckCircle />} color="#10b981" />
                <StatCard title="Total Deposited" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalAmount)} icon={<DollarSign />} color="#3b82f6" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Deposit Log</h2>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by User, Trx, Gateway..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-primary text-white">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Gateway | Trx</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Initiated</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Amount</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Action</th>
                            </tr>
                        </thead>
                         <tbody className="text-gray-700 dark:text-gray-300">
                            {filteredDeposits.length > 0 ? filteredDeposits.map(d => (
                                <tr key={d.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{d.userName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{d.userEmail}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <img src={d.logo} alt={d.gateway} className="h-6 w-6 object-contain" />
                                            <div className="font-medium">{d.gateway}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{d.id}</div>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{new Date(d.initiated).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    <td className="py-3 px-4 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(d.amount)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            d.status === 'Successful' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            d.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {d.status === 'Pending' ? (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => openApproveModal(e, d.id, d.amount, d.userName)} 
                                                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors shadow-sm text-sm font-bold"
                                                    title="Confirm Deposit"
                                                >
                                                    <Check size={16} /> Confirm
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => openRejectModal(e, d.id, d.amount, d.userName)} 
                                                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors shadow-sm text-sm font-bold"
                                                    title="Decline Deposit"
                                                >
                                                    <X size={16} /> Decline
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Action Taken</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No deposits found.
                                    </td>
                                </tr>
                            )}
                         </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all">
                        <button onClick={closeConfirmModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                        
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className={`p-3 rounded-full mb-4 ${confirmModal.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {confirmModal.type === 'approve' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                {confirmModal.type === 'approve' ? 'Approve Deposit' : 'Reject Deposit'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Are you sure you want to {confirmModal.type} the deposit of 
                                <span className="font-bold text-gray-800 dark:text-gray-200"> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(confirmModal.amount)} </span>
                                for <span className="font-bold text-gray-800 dark:text-gray-200">{confirmModal.userName}</span>?
                            </p>
                            {confirmModal.type === 'reject' && (
                                <p className="text-sm text-red-500 mt-2">This action will cancel the transaction.</p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button 
                                type="button"
                                onClick={closeConfirmModal}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmAction}
                                disabled={isProcessing}
                                className={`flex items-center gap-2 px-4 py-2 text-white rounded-md font-bold shadow-md transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                                    confirmModal.type === 'approve' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                                {confirmModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDeposits;
