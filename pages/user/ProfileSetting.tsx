
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, UploadCloud, Trash2, AlertTriangle, X } from 'lucide-react';

const ProfileSetting: React.FC = () => {
    const { user, updateProfile, deleteUser, logout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({
        fullName: '',
        mobile: '',
        address: '',
        state: '',
        zip: '',
        country: '',
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName || '',
                mobile: user.mobile || '',
                address: user.address || '',
                state: user.state || '',
                zip: user.zip || '',
                country: user.country || '',
            });
            setProfilePicture(user.profilePictureUrl || null);
        }
    }, [user]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { success, message } = await updateProfile({ ...profileData, profilePictureUrl: profilePicture || '' });
        showNotification(success ? 'success' : 'error', message);
    };

    const confirmDeleteAccount = async () => {
        if (!user) return;
        
        const result = await deleteUser(user.id);
        if (result.success) {
            // Logout is handled in AuthContext for self-deletion, 
            // but we call navigation explicitly to be safe.
            logout(); 
            navigate('/login');
        } else {
            showNotification('error', result.message);
            setIsDeleteModalOpen(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow text-center">
                        <img src={profilePicture || `https://ui-avatars.com/api/?name=${user.fullName}&background=4f46e5&color=fff&size=128`} alt="User" className="h-32 w-32 rounded-full mx-auto mb-4 border-4 border-primary/20" />
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{user.fullName}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        
                        <div className="mt-4">
                            <label htmlFor="profile-picture-upload" className="cursor-pointer inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/20">
                                <UploadCloud size={16} />
                                <span>Upload New Photo</span>
                            </label>
                            <input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handlePictureChange} />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b dark:border-slate-700 pb-4 flex items-center gap-2">
                           <User size={20} /> Profile Information
                        </h2>
                        <form className="space-y-4" onSubmit={handleProfileSubmit}>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input type="text" name="fullName" value={profileData.fullName} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <input type="email" value={user.email} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                <input type="tel" name="mobile" value={profileData.mobile} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <input type="text" name="address" value={profileData.address} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                    <input type="text" name="state" value={profileData.state} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                                    <input type="text" name="zip" value={profileData.zip} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                    <input type="text" name="country" value={profileData.country} onChange={handleProfileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            {/* Delete Account Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border-l-4 border-red-500">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={24} /> Danger Zone
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain. All your data including trade history and balance will be permanently removed.
                </p>
                <button 
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors font-medium"
                >
                    <Trash2 size={18} /> Delete My Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="bg-red-100 text-red-600 p-3 rounded-full mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Delete Account</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Are you sure you want to delete your account? This action cannot be undone and you will lose all your data immediately.
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
                                onClick={confirmDeleteAccount} 
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold shadow-md transition-colors"
                            >
                                Yes, Delete My Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileSetting;
