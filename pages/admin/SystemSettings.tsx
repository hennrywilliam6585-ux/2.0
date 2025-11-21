
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { SystemSettingCard } from '../../types';
import { Cog, Image, ShieldCheck, Bell, CreditCard, ArrowRightLeft, KeyRound, Globe, FileCog, UserCog, MessageSquare, Clock, Shield, Database, FileCode, Code, Wrench, GitMerge, Bot, ChevronRight, Search, DownloadCloud } from 'lucide-react';

const settings: SystemSettingCard[] = [
    { icon: <Cog size={28} />, title: 'General Setting', description: 'Configure the fundamental information of the site.', path: '/admin/general-settings' },
    { icon: <DownloadCloud size={28} />, title: 'Data Backup & Restore', description: 'Export your database to JSON or restore from a backup.', path: '/admin/data-management' },
    { icon: <Image size={28} />, title: 'Logo and Favicon', description: 'Upload your logo and favicon here.', path: '/admin/logo-favicon' },
    { icon: <ShieldCheck size={28} />, title: 'System Configuration', description: 'Control all of the basic modules of the system.', path: '/admin/system-configuration' },
    { icon: <Bell size={28} />, title: 'Notification Setting', description: 'Configure overall notification elements of the system.', path: '/admin/notification-settings' },
    { icon: <CreditCard size={28} />, title: 'Payment Gateways', description: 'Setup manual or automatic payment gateways.', path: '/admin/payment-gateways' },
    { icon: <ArrowRightLeft size={28} />, title: 'Withdrawals Methods', description: 'Setup manual withdrawal method so that users can make payout requests.', path: '/admin/withdrawal-methods' },
    { icon: <FileCog size={28} />, title: 'SEO Configuration', description: 'Configure proper meta title, meta description, keywords etc.', path: '/admin/seo-configuration' },
    { icon: <MessageSquare size={28} />, title: 'Manage Frontend', description: 'Control all of the frontend contents of the system.', path: '/admin/manage-frontend' },
    { icon: <FileCode size={28} />, title: 'Manage Pages', description: 'Control dynamic and static pages of the system.', path: '/admin/manage-pages' },
    { icon: <UserCog size={28} />, title: 'KYC Setting', description: 'Configure the dynamic input fields to collect information of your client.', path: '/admin/kyc-setting' },
    { icon: <Globe size={28} />, title: 'Social Login Setting', description: 'Provide the required information here to use the login system by social media.', path: '/admin/social-login' },
    { icon: <KeyRound size={28} />, title: 'Language', description: 'Configure your required languages and keywords to localize the system.', path: '/admin/language' },
    { icon: <Wrench size={28} />, title: 'Extensions', description: 'Manage extensions of the system here to extend some extra features.', path: '/admin/extensions' },
    { icon: <Clock size={28} />, title: 'Cron Job Setting', description: 'Configure cron job to automate some operations of the system.', path: '/admin/cron-job' },
    { icon: <Shield size={28} />, title: 'Policy Pages', description: 'Configure your policy and terms of the system here.', path: '/admin/policy-pages' },
    { icon: <Database size={28} />, title: 'Maintenance Mode', description: 'Enable or disable the maintenance mode of the system when required.', path: '/admin/maintenance-mode' },
    { icon: <Code size={28} />, title: 'GDPR Cookie', description: 'Set GDPR Cookie policy if required. It will ask visitor to accept.', path: '/admin/gdpr-cookie' },
    { icon: <FileCode size={28} />, title: 'Custom CSS', description: 'Write custom css here to modify some styles of frontend of the system.', path: '/admin/custom-css' },
    { icon: <GitMerge size={28} />, title: 'Sitemap XML', description: 'Insert the sitemap xml here to enhance SEO performance.', path: '/admin/sitemap' },
    { icon: <Bot size={28} />, title: 'Robots txt', description: 'Insert the robots.txt content here to enhance bot web crawlers.', path: '/admin/robots-txt' },
];

const SettingCard: React.FC<{ card: SystemSettingCard }> = ({ card }) => (
    <NavLink to={card.path} className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 flex items-center justify-between">
         <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div className="flex items-center gap-5 z-10">
            <div className="flex-shrink-0 text-primary bg-primary/10 p-3.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                {card.icon}
            </div>
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{card.description}</p>
            </div>
        </div>
        <ChevronRight className="flex-shrink-0 text-gray-300 group-hover:text-primary transition-transform duration-300 group-hover:translate-x-1 ml-4" size={20} />
    </NavLink>
);

const SystemSettings: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSettings = settings.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Settings</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and configure your platform settings</p>
                 </div>
                 <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl leading-5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out sm:text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSettings.map(setting => (
                    <SettingCard key={setting.title} card={setting} />
                ))}
            </div>
            
            {filteredSettings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 text-center">
                    <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No settings found</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-sm">
                        We couldn't find any settings matching "{searchTerm}". Try searching for something else.
                    </p>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        Clear Search
                    </button>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
