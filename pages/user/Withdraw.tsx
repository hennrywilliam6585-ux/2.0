
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../AuthContext';

interface WithdrawalMethod {
    name: string;
    logo: string;
    min: number;
    max: number;
    charge: string; // As a string for display e.g., "5.00 USD + 1.0%"
    processingTime: string;
}

const withdrawalMethods: WithdrawalMethod[] = [
    { name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg', min: 10, max: 10000, charge: '1.00 USD + 2.5%', processingTime: '1-2 Hours' },
    { name: 'Bank Transfer', logo: 'https://img.icons8.com/fluency/48/000000/bank.png', min: 50, max: 100000, charge: '5.00 USD + 0.00%', processingTime: '2-3 Days' },
    { name: 'Bitcoin', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', min: 25, max: 50000, charge: '0.00 USD + 0.5%', processingTime: '30-60 Minutes' },
    { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', min: 10, max: 10000, charge: '1.50 USD + 2.0%', processingTime: 'Instant' },
    { name: 'Ethereum', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', min: 25, max: 50000, charge: '0.00 USD + 0.5%', processingTime: '10-20 Minutes' },
    { name: 'Litecoin', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/ltc.svg', min: 5, max: 25000, charge: '0.00 USD + 0.5%', processingTime: '10-20 Minutes' },
];

const Withdraw: React.FC = () => {
    const { user, allWithdrawals, requestWithdrawal } = useAuth();
    const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);
    const [amount, setAmount] = useState('');
    const [withdrawalInfo, setWithdrawalInfo] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const userWithdrawalHistory = allWithdrawals
        .filter(w => w.userId === user?.id)
        .sort((a, b) => new Date(b.initiated).getTime() - new Date(a.initiated).getTime());
        
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleProceed = () => {
        const parsedAmount = parseFloat(amount);
        if (user && user.availableBalance < parsedAmount) {
            showNotification('error', 'Insufficient balance for this withdrawal amount.');
            return;
        }
        if (selectedMethod && amount) {
            setIsModalOpen(true);
        }
    };
    
    const calculateCharges = () => {
        if (!selectedMethod || !amount) return { charge: 0, receivable: 0 };
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) return { charge: 0, receivable: 0 };

        let fixedCharge = 0;
        let percentCharge = 0;

        const chargeParts = selectedMethod.charge.split('+').map(p => p.trim());
        if (chargeParts[0].includes('USD')) {
            fixedCharge = parseFloat(chargeParts[0].replace('USD', ''));
        }
        if (chargeParts.length > 1 && chargeParts[1].includes('%')) {
            percentCharge = parseFloat(chargeParts[1].replace('%', '')) / 100;
        }

        const totalCharge = fixedCharge + (parsedAmount * percentCharge);
        const receivable = parsedAmount - totalCharge;

        return {
            charge: totalCharge,
            receivable: receivable
        };
    };

    const { charge, receivable } = calculateCharges();

    const handleConfirmRequest = async () => {
        if (!selectedMethod || !amount || !withdrawalInfo) {
            showNotification('error', 'Please fill in all required fields.');
            return;
        }

        const parsedAmount = parseFloat(amount);
        const result = await requestWithdrawal({
            method: selectedMethod.name,
            logo: selectedMethod.logo,
            amount: parsedAmount,
            charge: charge,
            finalAmount: receivable,
            userWithdrawalInfo: withdrawalInfo,
        });

        showNotification(result.success ? 'success' : 'error', result.message);
        setIsModalOpen(false);
        setAmount('');
        setWithdrawalInfo('');
        setSelectedMethod(null);
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Withdraw Money</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                    {withdrawalMethods.map(method => (
                        <div 
                            key={method.name}
                            onClick={() => setSelectedMethod(method)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${selectedMethod?.name === method.name ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'}`}
                        >
                            <img src={method.logo} alt={method.name} className="h-12 w-12 mx-auto mb-2 object-contain" />
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{method.name}</p>
                        </div>
                    ))}
                </div>

                {selectedMethod && (
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">You have selected <span className="text-primary">{selectedMethod.name}</span></p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                                    />
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                                    <p>Limit: ${selectedMethod.min.toFixed(2)} - ${selectedMethod.max.toFixed(2)}</p>
                                    <p>Charge: {selectedMethod.charge}</p>
                                    <p>Processing Time: {selectedMethod.processingTime}</p>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleProceed}
                                    disabled={!amount || parseFloat(amount) < selectedMethod.min || parseFloat(amount) > selectedMethod.max}
                                    className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-primary/90 transition duration-300 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    Request Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Withdrawal History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Method | Trx</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Initiated</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {userWithdrawalHistory.length > 0 ? userWithdrawalHistory.map((log) => (
                                <tr key={log.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{log.method}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{log.id}</div>
                                    </td>
                                    <td className="py-3 px-4">{new Date(log.initiated).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    <td className="py-3 px-4 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(log.amount)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                            log.status === 'Successful' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            log.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No withdrawal history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && selectedMethod && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Confirm Withdrawal Request</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                             <img src={selectedMethod.logo} alt={selectedMethod.name} className="h-16 w-16 mx-auto mb-4 object-contain" />
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">You are about to withdraw funds via {selectedMethod.name}.</p>
                            
                             <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 text-left bg-gray-50 dark:bg-slate-700/50 p-4 rounded-md">
                                <li className="flex justify-between"><span>Requested Amount:</span> <strong>${parseFloat(amount).toFixed(2)}</strong></li>
                                <li className="flex justify-between"><span>Withdrawal Charge:</span> <strong>${charge.toFixed(2)}</strong></li>
                                <li className="flex justify-between border-t dark:border-slate-600 pt-2 mt-2"><span>You will receive:</span> <strong className="text-primary">${receivable.toFixed(2)}</strong></li>
                            </ul>
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {selectedMethod.name === 'Bitcoin' || selectedMethod.name === 'Ethereum' || selectedMethod.name === 'Litecoin' ? 'Wallet Address' :
                                     selectedMethod.name === 'PayPal' ? 'PayPal Email' :
                                     'Account Details'}
                                </label>
                                <textarea 
                                    rows={3}
                                    value={withdrawalInfo}
                                    onChange={(e) => setWithdrawalInfo(e.target.value)}
                                    placeholder={`Enter your ${selectedMethod.name} details here...`}
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    required
                                ></textarea>
                            </div>

                        </div>
                         <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRequest}
                                disabled={!withdrawalInfo}
                                className="w-auto bg-success text-white font-bold py-2 px-4 rounded-md hover:bg-success/90 transition duration-300 disabled:opacity-50"
                            >
                                Confirm Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Withdraw;
