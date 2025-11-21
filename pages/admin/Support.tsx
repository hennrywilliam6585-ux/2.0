
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { Search, Eye, Send, X, List, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import type { SupportTicket } from '../../types';

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

const statusColors: { [key in SupportTicket['status']]: string } = {
    Open: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Answered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Customer-Reply': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Closed: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300',
};

const AdminSupport: React.FC = () => {
    const { allSupportTickets, replyToSupportTicket, changeTicketStatus } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newStatus, setNewStatus] = useState<SupportTicket['status'] | ''>('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleViewDetails = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setNewStatus(ticket.status);
        setIsModalOpen(true);
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        const result = await replyToSupportTicket(selectedTicket.id, replyText);
        if (result.success) {
            // Manually update ticket in state to show new message immediately
            const updatedTicket = {
                ...selectedTicket,
                messages: [...selectedTicket.messages, { sender: 'admin' as const, text: replyText, timestamp: new Date().toISOString() }],
                status: 'Answered' as const
            };
            setSelectedTicket(updatedTicket);
            setReplyText('');
            showNotification('success', 'Reply sent successfully.');
        } else {
            showNotification('error', result.message);
        }
    };

    const handleStatusChange = async () => {
        if (!selectedTicket || !newStatus) return;
        const result = await changeTicketStatus(selectedTicket.id, newStatus);
        if (result.success) {
             const updatedTicket = {...selectedTicket, status: newStatus };
             setSelectedTicket(updatedTicket);
             showNotification('success', `Status changed to ${newStatus}.`);
        } else {
            showNotification('error', result.message);
        }
    };
    
    const filteredTickets = useMemo(() => {
        return allSupportTickets
            .filter(ticket =>
                ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.lastReply).getTime() - new Date(a.lastReply).getTime());
    }, [allSupportTickets, searchTerm]);
    
    const stats = useMemo(() => ({
        total: allSupportTickets.length,
        open: allSupportTickets.filter(t => t.status === 'Open' || t.status === 'Customer-Reply').length,
        answered: allSupportTickets.filter(t => t.status === 'Answered').length,
        closed: allSupportTickets.filter(t => t.status === 'Closed').length,
    }), [allSupportTickets]);

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Tickets" value={stats.total.toString()} icon={<List />} color="#4f46e5" />
                <StatCard title="Open Tickets" value={stats.open.toString()} icon={<Clock />} color="#f97316" />
                <StatCard title="Answered Tickets" value={stats.answered.toString()} icon={<MessageCircle />} color="#3b82f6" />
                <StatCard title="Closed Tickets" value={stats.closed.toString()} icon={<CheckCircle />} color="#10b981" />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">All Support Tickets</h2>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by User, Subject, ID..."
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
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Ticket ID</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">User</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Subject</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Last Reply</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4 font-medium text-primary">{ticket.id}</td>
                                    <td className="py-3 px-4">
                                        <div>{ticket.userName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.userEmail}</div>
                                    </td>
                                    <td className="py-3 px-4">{ticket.subject}</td>
                                    <td className="py-3 px-4 text-sm">{new Date(ticket.lastReply).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    <td className="py-3 px-4"><span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span></td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => handleViewDetails(ticket)} className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 p-2 rounded-md flex items-center justify-center text-sm hover:bg-blue-200 dark:hover:bg-blue-900">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ticket Details: {selectedTicket.id}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{selectedTicket.subject}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">From: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                            
                            <div className="space-y-4">
                                {selectedTicket.messages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'admin' ? 'justify-end' : ''}`}>
                                        <div className={`p-3 rounded-lg max-w-md ${msg.sender === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                placeholder="Write your reply..."
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                disabled={selectedTicket.status === 'Closed'}
                            ></textarea>
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-2">
                                     <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as SupportTicket['status'])} className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm text-sm">
                                        <option value="Open">Open</option>
                                        <option value="Answered">Answered</option>
                                        <option value="Customer-Reply">Customer-Reply</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <button onClick={handleStatusChange} disabled={newStatus === selectedTicket.status} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 disabled:opacity-50 text-sm">
                                        Change Status
                                    </button>
                                </div>
                                <button
                                    onClick={handleReply}
                                    disabled={!replyText.trim() || selectedTicket.status === 'Closed'}
                                    className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Send size={16} /> Reply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupport;
