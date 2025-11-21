
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, colSpan = 'sm:col-span-1', unit }: { label: string; type?: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; colSpan?: string; unit?: string }) => (
    <div className={colSpan}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                name={name}
                value={value} 
                onChange={onChange}
                placeholder={placeholder} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
            />
            {unit && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">{unit}</span>}
        </div>
    </div>
);

const ToggleSwitch = ({ label, enabled, setEnabled }: { label: string, enabled: boolean, setEnabled: (enabled: boolean) => void }) => (
    <div className="flex items-center justify-between sm:col-span-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`${
                enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-slate-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
        >
            <span
                className={`${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);

const AdminTradeSetting: React.FC = () => {
    const { tradeSettings, updateTradeSettings } = useAuth();
    
    // Local state for form inputs (handling types like string vs number for inputs)
    const [localSettings, setLocalSettings] = useState({
        tradingEnabled: tradeSettings.tradingEnabled,
        profitPercentage: String(tradeSettings.profitPercentage),
        minTradeAmount: String(tradeSettings.minTradeAmount),
        maxTradeAmount: String(tradeSettings.maxTradeAmount),
        durationOptions: tradeSettings.durationOptions.join(', '),
    });
    const [notification, setNotification] = useState('');

    useEffect(() => {
        setLocalSettings({
            tradingEnabled: tradeSettings.tradingEnabled,
            profitPercentage: String(tradeSettings.profitPercentage),
            minTradeAmount: String(tradeSettings.minTradeAmount),
            maxTradeAmount: String(tradeSettings.maxTradeAmount),
            durationOptions: tradeSettings.durationOptions.join(', '),
        });
    }, [tradeSettings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const durationArray = localSettings.durationOptions
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        const updatedSettings = {
            tradingEnabled: localSettings.tradingEnabled,
            profitPercentage: parseFloat(localSettings.profitPercentage),
            minTradeAmount: parseFloat(localSettings.minTradeAmount),
            maxTradeAmount: parseFloat(localSettings.maxTradeAmount),
            durationOptions: durationArray.length > 0 ? durationArray : [60]
        };

        try {
            await updateTradeSettings(updatedSettings);
            setNotification('Settings saved successfully!');
        } catch (e) {
            setNotification('Failed to save settings.');
        }
        setTimeout(() => setNotification(''), 3000);
    };

  return (
    <>
        {notification && (
            <div className="p-4 mb-4 rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                {notification}
            </div>
        )}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b dark:border-slate-700 pb-4">Trade Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ToggleSwitch 
                        label="Global Trading Status"
                        enabled={localSettings.tradingEnabled}
                        setEnabled={(enabled) => setLocalSettings(prev => ({...prev, tradingEnabled: enabled}))}
                    />
                    
                    <InputField 
                        label="Trade Profit" 
                        name="profitPercentage"
                        type="number"
                        value={localSettings.profitPercentage}
                        onChange={handleInputChange}
                        unit="%"
                    />
                    
                    <InputField 
                        label="Minimum Trade Amount" 
                        name="minTradeAmount"
                        type="number"
                        value={localSettings.minTradeAmount}
                        onChange={handleInputChange}
                        unit="USD"
                    />

                    <InputField 
                        label="Maximum Trade Amount" 
                        name="maxTradeAmount"
                        type="number"
                        value={localSettings.maxTradeAmount}
                        onChange={handleInputChange}
                        unit="USD"
                    />

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Duration Options</label>
                        <input 
                            type="text"
                            name="durationOptions"
                            value={localSettings.durationOptions}
                            onChange={handleInputChange}
                            placeholder="e.g., 60, 120, 300" 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Comma-separated values in seconds. (e.g., 60 for 1 minute, 300 for 5 minutes)
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
                        Save Settings
                    </button>
                </div>
            </form>
        </div>
    </>
  );
};

export default AdminTradeSetting;
