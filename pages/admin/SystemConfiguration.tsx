
import React, { useState, useEffect } from 'react';
import { useAuth, SystemConfiguration } from '../../AuthContext';
import { Save, Loader2, ShieldCheck, UserPlus, Lock, FileText, Mail, Bell, Smartphone, CheckCircle, Globe } from 'lucide-react';

const ToggleCard = ({ 
    title, 
    description, 
    enabled, 
    setEnabled, 
    icon 
}: { 
    title: string; 
    description: string; 
    enabled: boolean; 
    setEnabled: (val: boolean) => void; 
    icon: React.ReactNode 
}) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${enabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
        </div>
        <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`${
                enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-600'
            } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 self-end sm:self-center`}
        >
            <span
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);

const SystemConfigurationPage: React.FC = () => {
    const { systemConfiguration, updateSystemConfiguration } = useAuth();
    const [config, setConfig] = useState<SystemConfiguration>(systemConfiguration);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        setConfig(systemConfiguration);
    }, [systemConfiguration]);

    const handleToggle = (key: keyof SystemConfiguration) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateSystemConfiguration(config);
            setNotification({ type: 'success', message: 'System configuration updated successfully.' });
        } catch (error) {
            setNotification({ type: 'error', message: 'Failed to update configuration.' });
        }
        setLoading(false);
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div className="space-y-6">
            {notification && (
                <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {notification.message}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Configuration</h2>
                    <p className="text-gray-500 dark:text-gray-400">Control the basic modules of the system.</p>
                </div>
                <button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="bg-primary text-white px-6 py-2.5 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70 transition-all shadow-sm"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>Update Configuration</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToggleCard 
                    title="User Registration"
                    description="If you disable this, no one can create a new account on your system."
                    enabled={config.userRegistration}
                    setEnabled={() => handleToggle('userRegistration')}
                    icon={<UserPlus size={24} />}
                />
                <ToggleCard 
                    title="Force SSL"
                    description="By enabling this, the system will force visitors to use HTTPS."
                    enabled={config.forceSSL}
                    setEnabled={() => handleToggle('forceSSL')}
                    icon={<Lock size={24} />}
                />
                <ToggleCard 
                    title="Agree Policy"
                    description="If enabled, users must agree to terms and conditions during registration."
                    enabled={config.agreePolicy}
                    setEnabled={() => handleToggle('agreePolicy')}
                    icon={<FileText size={24} />}
                />
                <ToggleCard 
                    title="Force Secure Password"
                    description="If enabled, users must use a strong password (mixed case, numbers, symbols)."
                    enabled={config.forceSecurePassword}
                    setEnabled={() => handleToggle('forceSecurePassword')}
                    icon={<ShieldCheck size={24} />}
                />
                <ToggleCard 
                    title="Email Verification"
                    description="If enabled, users will need to verify their email address to access the dashboard."
                    enabled={config.emailVerification}
                    setEnabled={() => handleToggle('emailVerification')}
                    icon={<CheckCircle size={24} />}
                />
                <ToggleCard 
                    title="Email Notification"
                    description="Enable or disable system-generated email notifications."
                    enabled={config.emailNotification}
                    setEnabled={() => handleToggle('emailNotification')}
                    icon={<Mail size={24} />}
                />
                <ToggleCard 
                    title="Mobile Verification"
                    description="If enabled, users will need to verify their mobile number."
                    enabled={config.mobileVerification}
                    setEnabled={() => handleToggle('mobileVerification')}
                    icon={<Smartphone size={24} />}
                />
                <ToggleCard 
                    title="Mobile Notification"
                    description="Enable or disable SMS notifications."
                    enabled={config.mobileNotification}
                    setEnabled={() => handleToggle('mobileNotification')}
                    icon={<Bell size={24} />}
                />
                <ToggleCard 
                    title="KYC Verification"
                    description="If enabled, users must submit KYC documents for approval."
                    enabled={config.kycVerification}
                    setEnabled={() => handleToggle('kycVerification')}
                    icon={<FileText size={24} />}
                />
                <ToggleCard 
                    title="Language Selection"
                    description="Allow users to select their preferred language."
                    enabled={config.languageSelection}
                    setEnabled={() => handleToggle('languageSelection')}
                    icon={<Globe size={24} />}
                />
            </div>
        </div>
    );
};

export default SystemConfigurationPage;
