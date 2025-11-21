
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, User, Settings, LogOut, Sun, Moon, CheckCircle, AlertCircle, Activity, Info } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';

const Header: React.FC<{ sidebarOpen: boolean; setSidebarOpen: (arg: boolean) => void }> = ({ sidebarOpen, setSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const { logout, user, notifications, markNotificationAsRead, clearAllNotifications, markAllAsRead } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  
  const notifTrigger = useRef<HTMLButtonElement>(null);
  const notifDropdown = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // close on click outside for user dropdown
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current?.contains(target as Node)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close on click outside for notifications
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!notifDropdown.current) return;
      if (
        !notifOpen ||
        notifDropdown.current.contains(target as Node) ||
        notifTrigger.current?.contains(target as Node)
      )
        return;
      setNotifOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white dark:bg-slate-800 drop-shadow-sm">
      <div className="flex flex-grow items-center justify-between py-4 px-4 md:px-6 2xl:px-11">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="z-50 block rounded-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 shadow-sm lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="hidden sm:block relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-md py-2 pl-10 pr-4 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button ref={notifTrigger} onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
              )}
            </button>

            {notifOpen && (
                <div ref={notifDropdown} className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-b dark:border-slate-700 flex justify-between items-center">
                        <span>Notifications</span>
                         {notifications.length > 0 && (
                            <button onClick={clearAllNotifications} className="text-primary hover:underline text-[10px]">Clear All</button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => markNotificationAsRead(notif.id)}
                                    className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b dark:border-slate-700 last:border-0 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-1.5 rounded-full mt-1 flex-shrink-0 ${
                                            notif.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                                            notif.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                            notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            {notif.type === 'success' ? <CheckCircle size={16} /> : 
                                             notif.type === 'error' ? <AlertCircle size={16} /> :
                                             notif.type === 'warning' ? <Activity size={16} /> :
                                             <Info size={16} />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="ml-auto mt-2">
                                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                <p className="text-sm">No notifications</p>
                            </div>
                        )}
                    </div>
                    <div className="px-4 py-2 border-t dark:border-slate-700 text-center">
                        <button onClick={markAllAsRead} className="text-xs font-medium text-primary hover:underline">Read All</button>
                    </div>
                </div>
            )}
          </div>
          
          <div className="relative">
            <button ref={trigger} onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3">
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-black dark:text-white">{user?.fullName || 'Admin'}</span>
                <span className="block text-xs text-gray-600 dark:text-gray-400">Administrator</span>
              </span>
              <img src={user?.profilePictureUrl || `https://ui-avatars.com/api/?name=${user?.fullName || 'A'}&background=4f46e5&color=fff&size=40`} alt="User" className="h-10 w-10 rounded-full" />
            </button>

            <div
                ref={dropdown}
                className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 transition-all duration-200 border border-gray-200 dark:border-slate-700 ${dropdownOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
             >
              <a href="#/admin/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                <User size={16} /> Profile
              </a>
              <a href="#/admin/system-settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                <Settings size={16} /> Settings
              </a>
              <button onClick={() => { logout(); setDropdownOpen(false); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 w-full text-left">
                <LogOut size={16} /> Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
