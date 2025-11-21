
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { User, UploadCloud } from 'lucide-react';

const AdminProfile: React.FC = () => {
    const { user, updateProfile } = useAuth();

    const [profileData, setProfileData] = useState({
        fullName: '',
    });
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName || '',
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
                        <img src={profilePicture || `https://ui-avatars.com/api/?name=${user.fullName}&background=4f46e5&color=fff&size=128`} alt="Admin" className="h-32 w-32 rounded-full mx-auto mb-4 border-4 border-primary/20" />
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
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
