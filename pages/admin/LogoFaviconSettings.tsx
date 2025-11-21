
import React, { useState, useEffect } from 'react';
import { Save, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useAuth, SystemSettings } from '../../AuthContext';

const LogoFaviconSettings: React.FC = () => {
    const { systemSettings, updateGeneralSettings } = useAuth();
    const [settings, setSettings] = useState<SystemSettings>(systemSettings);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Sync local state with context when context updates
    useEffect(() => {
        setSettings(systemSettings);
    }, [systemSettings]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (file.size > 500 * 1024) { // 500KB limit
                showNotification('error', 'File is too large. Max 500KB allowed for Base64 storage.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = (field: 'logoUrl' | 'faviconUrl') => {
        setSettings(prev => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateGeneralSettings(settings);
            showNotification('success', 'Logo & Favicon settings updated successfully.');
        } catch (error) {
            showNotification('error', 'Failed to update settings.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b dark:border-slate-700 pb-4">Logo & Favicon Settings</h2>
                
                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* Logo Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ImageIcon size={18} /> Site Logo
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Upload your site logo. Recommended size: 200x50px (PNG/SVG).
                            </p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                                <input 
                                    type="text" 
                                    name="logoUrl" 
                                    value={settings.logoUrl || ''} 
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/logo.png" 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                                />
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 uppercase">OR</span>
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                    <UploadCloud size={16} />
                                    <span>Upload File</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logoUrl')} />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 h-full min-h-[200px] relative">
                            {settings.logoUrl ? (
                                <>
                                    <button 
                                        type="button"
                                        onClick={() => clearImage('logoUrl')}
                                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                        title="Remove Logo"
                                    >
                                        <X size={16} />
                                    </button>
                                    <img src={settings.logoUrl} alt="Logo Preview" className="max-h-32 max-w-full object-contain" />
                                    <p className="mt-4 text-xs text-gray-500">Preview</p>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                                    <p>No logo uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-slate-700" />

                    {/* Favicon Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ImageIcon size={18} /> Favicon
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Upload your site favicon. Recommended size: 32x32px (ICO/PNG).
                            </p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favicon URL</label>
                                <input 
                                    type="text" 
                                    name="faviconUrl" 
                                    value={settings.faviconUrl || ''} 
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/favicon.ico" 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                                />
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-gray-500 uppercase">OR</span>
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                    <UploadCloud size={16} />
                                    <span>Upload File</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'faviconUrl')} />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 h-full min-h-[200px] relative">
                            {settings.faviconUrl ? (
                                <>
                                     <button 
                                        type="button"
                                        onClick={() => clearImage('faviconUrl')}
                                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                        title="Remove Favicon"
                                    >
                                        <X size={16} />
                                    </button>
                                    <img src={settings.faviconUrl} alt="Favicon Preview" className="w-16 h-16 object-contain" />
                                    <p className="mt-4 text-xs text-gray-500">Preview</p>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No favicon uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70 transition-all">
                            <Save size={20} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LogoFaviconSettings;
