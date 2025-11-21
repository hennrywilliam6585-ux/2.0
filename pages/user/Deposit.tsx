
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../AuthContext';

interface Gateway {
    name: string;
    logo: string;
    min: number;
    max: number;
    charge: string;
}

const gateways: Gateway[] = [
    { name: 'Bitcoin', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', min: 10, max: 50000, charge: '0.00 USD + 0.00%' },
    { name: 'Ethereum', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', min: 20, max: 50000, charge: '0.00 USD + 0.00%' },
    { name: 'Litecoin', logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/ltc.svg', min: 5, max: 25000, charge: '0.00 USD + 0.00%' },
    { name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg', min: 10, max: 10000, charge: '1.00 USD + 2.5%' },
    { name: 'Stripe', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', min: 10, max: 10000, charge: '1.50 USD + 2.0%' },
    { name: 'Bank Transfer', logo: 'https://img.icons8.com/fluency/48/000000/bank.png', min: 50, max: 100000, charge: '5.00 USD + 0.00%' },
];

const Deposit: React.FC = () => {
    const { user, allDeposits, requestDeposit } = useAuth();
    const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
    const [amount, setAmount] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const userDepositHistory = allDeposits
        .filter(d => d.userId === user?.id)
        .sort((a, b) => new Date(b.initiated).getTime() - new Date(a.initiated).getTime());
        
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleProceed = () => {
        if (selectedGateway && amount) {
            setIsModalOpen(true);
        }
    };

    const handleConfirmPayment = async () => {
        if (selectedGateway && amount) {
            const parsedAmount = parseFloat(amount);
            const result = await requestDeposit(selectedGateway.name, selectedGateway.logo, parsedAmount);
            showNotification(result.success ? 'success' : 'error', result.message);
            setIsModalOpen(false);
            setAmount('');
            setSelectedGateway(null);
        }
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Make a Deposit</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                    {gateways.map(gateway => (
                        <div 
                            key={gateway.name}
                            onClick={() => setSelectedGateway(gateway)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${selectedGateway?.name === gateway.name ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-slate-700 hover:border-primary/50'}`}
                        >
                            <img src={gateway.logo} alt={gateway.name} className="h-12 w-12 mx-auto mb-2 object-contain" />
                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{gateway.name}</p>
                        </div>
                    ))}
                </div>

                {selectedGateway && (
                    <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">You have selected <span className="text-primary">{selectedGateway.name}</span></p>
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Limit: ${selectedGateway.min.toFixed(2)} - ${selectedGateway.max.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleProceed}
                                    disabled={!amount || parseFloat(amount) < selectedGateway.min || parseFloat(amount) > selectedGateway.max}
                                    className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-md hover:bg-primary/90 transition duration-300 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Deposit History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Gateway | Trx</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Initiated</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Amount</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {userDepositHistory.length > 0 ? userDepositHistory.map((log) => (
                                <tr key={log.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{log.gateway}</div>
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
                                        No deposit history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && selectedGateway && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Confirm Deposit</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                             <img src={selectedGateway.logo} alt={selectedGateway.name} className="h-16 w-16 mx-auto mb-4 object-contain" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Please send your payment to the address below.</p>

                            <div className="my-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg">
                                 <div className="flex justify-center mb-4">
                                     <svg className="w-32 h-32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path fill="#000" d="M128 26.333a5.333 5.333 0 0 0-5.333 5.334v21.333a5.333 5.333 0 0 0 10.666 0V31.667a5.333 5.333 0 0 0-5.333-5.334ZM75.413 54.08a5.333 5.333 0 0 0-3.77 9.104l15.085 15.085a5.333 5.333 0 0 0 7.54-7.54L79.184 56.03a5.333 5.333 0 0 0-3.77-1.95Zm105.174 0a5.333 5.333 0 0 0-3.77 1.95l-15.085 15.085a5.333 5.333 0 1 0 7.54 7.54l15.085-15.085a5.333 5.333 0 0 0-3.77-9.104ZM54.08 75.413a5.333 5.333 0 0 0-9.104 3.771v21.333a5.333 5.333 0 1 0 10.667 0V79.184a5.333 5.333 0 0 0-1.562-3.77ZM229.667 128a5.333 5.333 0 0 0-5.334-5.333h-21.333a5.333 5.333 0 1 0 0 10.666h21.333A5.333 5.333 0 0 0 229.667 128Zm-47.253 45.92a5.333 5.333 0 1 0-7.54-7.54l-15.085 15.085a5.333 5.333 0 0 0 7.54 7.54l15.085-15.085ZM128 202.667a5.333 5.333 0 0 0 5.333 5.333h21.334a5.333 5.333 0 1 0 0-10.666h-21.334a5.333 5.333 0 0 0-5.333 5.333Zm-52.587-22.346a5.333 5.333 0 0 0-7.54 7.54l15.085 15.085a5.333 5.333 0 1 0 7.54-7.54L75.413 180.32ZM54.08 154.667a5.333 5.333 0 1 0-10.667 0v21.333a5.333 5.333 0 1 0 10.667 0v-21.333Zm-22.346-52.587a5.333 5.333 0 0 0-5.334 5.334v21.333a5.333 5.333 0 1 0 10.666 0v-21.333a5.333 5.333 0 0 0-5.332-5.334Zm127.186 20.747l-21.333-21.333a5.333 5.333 0 1 0-7.54 7.54l21.333 21.333a5.333 5.333 0 0 0 7.54-7.54Zm-65.066 42.666a5.333 5.333 0 1 0 0 10.667H148a5.333 5.333 0 1 0 0-10.667h-26.667Zm-21.334-21.333a5.333 5.333 0 1 0-10.666 0v21.333a5.333 5.333 0 1 0 10.666 0v-21.333Zm53.333 0a5.333 5.333 0 1 0-10.666 0v21.333a5.333 5.333 0 1 0 10.666 0v-21.333Zm-42.666-42.667a5.333 5.333 0 0 0 0 10.667H128a5.333 5.333 0 1 0 0-10.667h-21.333Zm-10.667 21.334a5.333 5.333 0 1 0-10.666 0v21.333a5.333 5.333 0 1 0 10.666 0v-21.333Z"/></svg>
                                 </div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 break-all">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</p>
                            </div>
                            
                             <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 text-left">
                                <li className="flex justify-between"><span>Amount:</span> <strong>${parseFloat(amount).toFixed(2)}</strong></li>
                                <li className="flex justify-between"><span>Charge:</span> <strong>$0.00</strong></li>
                                <li className="flex justify-between"><span>Payable:</span> <strong>${parseFloat(amount).toFixed(2)}</strong></li>
                            </ul>
                        </div>
                         <div className="p-4 bg-gray-50 dark:bg-slate-700/50">
                            <button
                                onClick={handleConfirmPayment}
                                className="w-full bg-success text-white font-bold py-2.5 px-4 rounded-md hover:bg-success/90 transition duration-300"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Deposit;
