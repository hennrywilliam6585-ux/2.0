
import React, { useState } from 'react';
import type { CryptoCurrency } from '../../types';
import { Plus, Search, X, Power } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const CryptoCurrencyList: React.FC = () => {
    const { cryptoCurrencies, addCrypto, toggleCryptoStatus } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCrypto, setNewCrypto] = useState<Omit<CryptoCurrency, 'status'>>({
        icon: '',
        name: '',
        symbol: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCrypto(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewCrypto = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCrypto.name && newCrypto.symbol && newCrypto.icon) {
            if (cryptoCurrencies.some(c => c.symbol.toUpperCase() === newCrypto.symbol.toUpperCase())) {
                alert('A cryptocurrency with this symbol already exists.');
                return;
            }
            addCrypto({ ...newCrypto, symbol: newCrypto.symbol.toUpperCase() });
            setIsModalOpen(false);
            setNewCrypto({ icon: '', name: '', symbol: '' });
        } else {
            alert('Please fill all fields.');
        }
    };

    const filteredCryptoList = cryptoCurrencies.filter(crypto =>
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Crypto Currency List</h2>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Name, Symbol..."
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
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Crypto</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Symbol</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {filteredCryptoList.map((crypto) => (
                                <tr key={crypto.symbol} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <img src={crypto.icon} alt={crypto.name} className="h-8 w-8" />
                                            <span>{crypto.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">{crypto.symbol}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${crypto.status === 'Enabled' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {crypto.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleCryptoStatus(crypto.symbol)}
                                                className={`${crypto.status === 'Enabled' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900' : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'} px-3 py-1 rounded-md flex items-center gap-1 text-sm`}
                                            >
                                                <Power size={14} /> {crypto.status === 'Enabled' ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add New Crypto Currency</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddNewCrypto}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <input type="text" name="name" value={newCrypto.name} onChange={handleInputChange} placeholder="e.g., Solana" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
                                    <input type="text" name="symbol" value={newCrypto.symbol} onChange={handleInputChange} placeholder="e.g., SOL" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon URL</label>
                                    <input type="text" name="icon" value={newCrypto.icon} onChange={handleInputChange} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="w-auto bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary/90 transition duration-300">
                                    Add Crypto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default CryptoCurrencyList;
