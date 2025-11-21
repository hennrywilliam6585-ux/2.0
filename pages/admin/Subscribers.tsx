
import React, { useState, useEffect } from 'react';
import { Search, Trash2, Mail, Send } from 'lucide-react';

interface Subscriber {
    id: number;
    email: string;
    createdAt: string;
}

const INITIAL_SUBSCRIBERS: Subscriber[] = [
    { id: 1, email: 'alex@example.com', createdAt: '2023-01-15 10:00 AM' },
    { id: 2, email: 'sarah@test.co', createdAt: '2023-02-20 02:30 PM' },
    { id: 3, email: 'crypto.fan@domain.net', createdAt: '2023-03-10 09:15 AM' },
    { id: 4, email: 'investor123@money.org', createdAt: '2023-04-05 11:45 AM' },
    { id: 5, email: 'newsletter@daily.com', createdAt: '2023-05-12 04:20 PM' },
    { id: 6, email: 'john.doe@gmail.com', createdAt: '2023-06-18 08:00 AM' },
    { id: 7, email: 'jane.smith@yahoo.com', createdAt: '2023-07-22 01:10 PM' },
];

const Subscribers: React.FC = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('cryptoSubscribers');
        if (stored) {
            setSubscribers(JSON.parse(stored));
        } else {
            setSubscribers(INITIAL_SUBSCRIBERS);
            localStorage.setItem('cryptoSubscribers', JSON.stringify(INITIAL_SUBSCRIBERS));
        }
    }, []);

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to remove this subscriber?')) {
            const updated = subscribers.filter(s => s.id !== id);
            setSubscribers(updated);
            localStorage.setItem('cryptoSubscribers', JSON.stringify(updated));
        }
    };

    const handleSendNewsletter = () => {
        alert('Newsletter sending feature is simulating...');
    };

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Subscribers</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button onClick={handleSendNewsletter} className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors whitespace-nowrap">
                        <Send size={18} /> <span className="hidden sm:inline">Send Newsletter</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">#</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Email</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Subscribe At</th>
                            <th className="text-right py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Action</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-300">
                        {filteredSubscribers.length > 0 ? (
                            filteredSubscribers.map((subscriber, index) => (
                                <tr key={subscriber.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4">{index + 1}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
                                                <Mail size={16} />
                                            </div>
                                            {subscriber.email}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">{subscriber.createdAt}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(subscriber.id)} 
                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No subscribers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <p>Showing {filteredSubscribers.length} of {subscribers.length} subscribers</p>
            </div>
        </div>
    );
};

export default Subscribers;
