
import React, { useRef } from 'react';
import { Download, Upload, HardDriveDownload, AlertTriangle, FileUp } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const DataManagement: React.FC = () => {
    const { allUsers, allDeposits, allWithdrawals, allSupportTickets, systemSettings, tradeSettings } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const backupData = {
            users: allUsers,
            deposits: allDeposits,
            withdrawals: allWithdrawals,
            tickets: allSupportTickets,
            systemSettings,
            tradeSettings,
            notifications: JSON.parse(localStorage.getItem('crypto_notifications') || '[]'),
            currencies: JSON.parse(localStorage.getItem('crypto_currencies') || '[]'),
            subscribers: JSON.parse(localStorage.getItem('cryptoSubscribers') || '[]'),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crypto-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                if (confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) {
                    if(json.users) localStorage.setItem('crypto_users', JSON.stringify(json.users));
                    if(json.deposits) localStorage.setItem('crypto_deposits', JSON.stringify(json.deposits));
                    if(json.withdrawals) localStorage.setItem('crypto_withdrawals', JSON.stringify(json.withdrawals));
                    if(json.tickets) localStorage.setItem('crypto_tickets', JSON.stringify(json.tickets));
                    if(json.systemSettings) localStorage.setItem('crypto_system_settings', JSON.stringify(json.systemSettings));
                    if(json.tradeSettings) localStorage.setItem('crypto_trade_settings', JSON.stringify(json.tradeSettings));
                    if(json.notifications) localStorage.setItem('crypto_notifications', JSON.stringify(json.notifications));
                    if(json.currencies) localStorage.setItem('crypto_currencies', JSON.stringify(json.currencies));
                    if(json.subscribers) localStorage.setItem('cryptoSubscribers', JSON.stringify(json.subscribers));
                    
                    alert('Data restored successfully! The page will now reload.');
                    window.location.reload();
                }
            } catch (error) {
                alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // Reset input
        if (e.target) e.target.value = '';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Data Management</h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Backup and Restore your platform data.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Export Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <HardDriveDownload size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Export Database</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Save a local copy of your data</p>
                        </div>
                    </div>
                    
                    <div className="flex-grow">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                            Download a JSON file containing the current state of your platform data, including:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500 dark:text-gray-400 pl-2">
                                <li>User Accounts & Balances</li>
                                <li>Deposit & Withdrawal Logs</li>
                                <li>System & Trade Settings</li>
                                <li>Support Tickets</li>
                            </ul>
                        </p>
                    </div>

                    <button 
                        onClick={handleExport}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Download size={20} /> Download JSON Backup
                    </button>
                </div>

                {/* Import Section */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col h-full">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                            <FileUp size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Import Database</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Restore from a backup file</p>
                        </div>
                    </div>
                    
                    <div className="flex-grow">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    <strong>Warning:</strong> Importing a database will overwrite all current data. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                            Select a valid JSON backup file to restore your platform data. The page will reload automatically upon successful import.
                        </p>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />

                    <button 
                        onClick={handleImportClick}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Upload size={20} /> Upload Backup File
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
