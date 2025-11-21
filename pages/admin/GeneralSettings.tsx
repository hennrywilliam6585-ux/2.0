
import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAuth, SystemSettings } from '../../AuthContext';

const InputField = ({ label, name, type = 'text', value, onChange, placeholder, colSpan = 'sm:col-span-1' }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; colSpan?: string; }) => (
    <div className={colSpan}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                name={name}
                value={value} 
                onChange={onChange}
                placeholder={placeholder} 
                className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-colors ${type === 'color' ? 'h-10 p-1' : ''}`} 
            />
        </div>
    </div>
);

const SelectField = ({ label, name, value, onChange, options, colSpan = 'sm:col-span-1' }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; colSpan?: string; }) => (
    <div className={colSpan}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select 
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-colors"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const GeneralSettings: React.FC = () => {
    const { systemSettings, updateGeneralSettings } = useAuth();
    const [settings, setSettings] = useState<SystemSettings>(systemSettings);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Sync local state with context when context updates (e.g. on load)
    useEffect(() => {
        setSettings(systemSettings);
    }, [systemSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await updateGeneralSettings(settings);
            setNotification({ type: 'success', message: 'System settings updated successfully.' });
        } catch (error) {
             setNotification({ type: 'error', message: 'Failed to update settings.' });
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
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b dark:border-slate-700 pb-4">General Setting</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField label="Site Title*" name="siteTitle" value={settings.siteTitle} onChange={handleChange} />
                        <SelectField label="Currency*" name="currency" value={settings.currency} onChange={handleChange} options={['USD', 'EUR', 'GBP', 'JPY', 'AUD']} />
                        <InputField label="Currency Symbol*" name="currencySymbol" value={settings.currencySymbol} onChange={handleChange} />
                        <SelectField label="Timezone*" name="timezone" value={settings.timezone} onChange={handleChange} options={['UTC', 'GMT', 'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'Europe/London', 'Asia/Tokyo']} />
                        <InputField label="Site Base Color*" name="siteBaseColor" value={settings.siteBaseColor} onChange={handleChange} type="color" />
                        <SelectField label="Record to Display Per page" name="recordsPerPage" value={settings.recordsPerPage} onChange={handleChange} options={['10 items per page', '20 items per page', '50 items per page', '100 items per page']} />
                        <SelectField label="Currency Showing Format*" name="currencyPosition" value={settings.currencyPosition} onChange={handleChange} options={['Symbol goes before Amount', 'Symbol goes after Amount']} />
                        <InputField label="Referral Bonus ($)" name="referralBonus" value={settings.referralBonus} onChange={handleChange} type="number" />
                        <InputField label="New User Default Balance ($)" name="newUserBalance" value={settings.newUserBalance} onChange={handleChange} type="number" placeholder="USD" />
                        <InputField label="Trade Profit (%)" name="tradeProfit" value={settings.tradeProfit} onChange={handleChange} type="number" />
                        <InputField label="Coinmarketcap Api Key" name="coinmarketcapApiKey" value={settings.coinmarketcapApiKey} onChange={handleChange} colSpan="sm:col-span-2" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70 transition-all">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;
