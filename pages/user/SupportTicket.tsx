
import React, { useState } from 'react';
import type { SupportTicket, TicketMessage } from '../../types';
import { useAuth } from '../../AuthContext';
import { Eye, Paperclip, Send, X } from 'lucide-react';

const statusColors: { [key in SupportTicket['status']]: string } = {
    Open: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Answered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'Customer-Reply': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Closed: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300',
};

const SupportTicket: React.FC = () => {
    const { user, allSupportTickets, openSupportTicket, replyToSupportTicket } = useAuth();
    
    const [newTicketData, setNewTicketData] = useState({
        subject: '',
        department: 'General Support',
        message: ''
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const userTickets = allSupportTickets
        .filter(t => t.userId === user?.id)
        .sort((a, b) => new Date(b.lastReply).getTime() - new Date(a.lastReply).getTime());

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewTicketData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicketData.subject.trim() || !newTicketData.message.trim()) {
            showNotification('error', 'Subject and message cannot be empty.');
            return;
        }

        const result = await openSupportTicket({
            subject: newTicketData.subject,
            department: newTicketData.department,
            messages: [{ sender: 'user', text: newTicketData.message, timestamp: '' }],
        });

        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) {
            setNewTicketData({ subject: '', department: 'General Support', message: '' });
        }
    };

    const handleViewDetails = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyText.trim()) return;
        const result = await replyToSupportTicket(selectedTicket.id, replyText);
        if (result.success) {
            const updatedTicket = {
                ...selectedTicket,
                messages: [...selectedTicket.messages, { sender: 'user' as const, text: replyText, timestamp: new Date().toISOString() }],
                status: 'Customer-Reply' as const
            };
            setSelectedTicket(updatedTicket);
            setReplyText('');
            showNotification('success', 'Reply sent successfully.');
        } else {
            showNotification('error', result.message);
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
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b dark:border-slate-700 pb-4">Open a New Ticket</h2>
                <form className="space-y-4" onSubmit={handleOpenTicket}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input type="text" name="subject" value={newTicketData.subject} onChange={handleInputChange} placeholder="Enter subject" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                            <select name="department" value={newTicketData.department} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                                <option>General Support</option>
                                <option>Billing</option>
                                <option>Technical Issues</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                        <textarea name="message" value={newTicketData.message} onChange={handleInputChange} rows={5} placeholder="Describe your issue..." className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
                            Submit Ticket
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">My Support Tickets</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700">
                            <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Ticket ID</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Subject</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Last Reply</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Status</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600 dark:text-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                            {userTickets.map((ticket) => (
                                <tr key={ticket.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="py-3 px-4 font-medium text-primary">{ticket.id}</td>
                                    <td className="py-3 px-4">{ticket.subject}</td>
                                    <td className="py-3 px-4">{new Date(ticket.lastReply).toLocaleString('en-US', { timeZone: 'America/New_York' })}</td>
                                    <td className="py-3 px-4"><span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span></td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => handleViewDetails(ticket)} className="bg-primary text-white p-2 rounded-md flex items-center justify-center text-sm hover:bg-primary/90">
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
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ticket: {selectedTicket.subject}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow">
                            <div className="space-y-4">
                                {selectedTicket.messages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                        <div className={`p-3 rounded-lg max-w-md ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{new Date(msg.timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {selectedTicket.status !== 'Closed' && (
                            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                    placeholder="Write your reply..."
                                    className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                ></textarea>
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim()}
                                        className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Send size={16} /> Reply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTicket;
