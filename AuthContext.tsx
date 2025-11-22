
import React, { createContext, useState, useEffect, useContext } from 'react';
import { initializeApp, deleteApp } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getAuth,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where,
  increment,
  runTransaction,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from './firebaseConfig';
import type { User, UserTradeLog, OpenTrade, CryptoCurrency, Deposit, Withdrawal, SupportTicket, Notification, TicketMessage, Subscriber } from './types';

// --- Types & Interfaces ---

export interface SystemSettings {
    siteTitle: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    siteBaseColor: string;
    recordsPerPage: string;
    currencyPosition: string;
    referralBonus: string;
    newUserBalance: string;
    tradeProfit: string;
    coinmarketcapApiKey: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export interface TradeSettings {
    tradingEnabled: boolean;
    profitPercentage: number;
    minTradeAmount: number;
    maxTradeAmount: number;
    durationOptions: number[];
}

export interface SystemConfiguration {
    userRegistration: boolean;
    forceSSL: boolean;
    agreePolicy: boolean;
    forceSecurePassword: boolean;
    emailVerification: boolean;
    emailNotification: boolean;
    mobileVerification: boolean;
    mobileNotification: boolean;
    kycVerification: boolean;
    languageSelection: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  systemSettings: SystemSettings;
  tradeSettings: TradeSettings;
  systemConfiguration: SystemConfiguration;
  updateGeneralSettings: (settings: SystemSettings) => Promise<void>;
  updateTradeSettings: (settings: TradeSettings) => Promise<void>;
  updateSystemConfiguration: (config: SystemConfiguration) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  adjustBalance: (amount: number) => void;
  placeTrade: (trade: OpenTrade, amount: number) => Promise<{ success: boolean; message: string }>;
  modifyUserBalance: (userId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  addManualDeposit: (userId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  giveBonus: (userId: string, amount: number, message: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; message: string }>;
  updateUserData: (userId: string, data: Partial<User>) => Promise<{ success: boolean; message: string }>;
  addTradeToHistory: (trade: UserTradeLog) => void;
  addOpenTrade: (trade: OpenTrade) => void;
  setOpenTrades: (trades: OpenTrade[]) => void;
  resolveTrades: (results: { tradeId: string, log: UserTradeLog, payout: number }[]) => void;
  cryptoCurrencies: CryptoCurrency[];
  toggleCryptoStatus: (symbol: string) => void;
  addCrypto: (crypto: Omit<CryptoCurrency, 'status'>) => void;
  allUsers: User[];
  toggleUserStatus: (userId: string) => void;
  addUser: (userData: Omit<User, 'id' | 'role' | 'tradeHistory' | 'openTrades' | 'status'> & { password: string }) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  allDeposits: Deposit[];
  requestDeposit: (gateway: string, logo: string, amount: number) => Promise<{ success: boolean; message: string }>;
  approveDeposit: (depositId: string) => Promise<{ success: boolean; message: string }>;
  rejectDeposit: (depositId: string) => Promise<{ success: boolean; message: string }>;
  allWithdrawals: Withdrawal[];
  requestWithdrawal: (withdrawalData: Omit<Withdrawal, 'id' | 'userId' | 'userName' | 'userEmail' | 'initiated' | 'status'>) => Promise<{ success: boolean; message: string }>;
  approveWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; message: string }>;
  rejectWithdrawal: (withdrawalId: string) => Promise<{ success: boolean; message: string }>;
  allSupportTickets: SupportTicket[];
  openSupportTicket: (ticketData: Omit<SupportTicket, 'id' | 'userId' | 'userName' | 'userEmail' | 'lastReply' | 'status'>) => Promise<{ success: boolean; message: string }>;
  replyToSupportTicket: (ticketId: string, messageText: string) => Promise<{ success: boolean; message: string }>;
  changeTicketStatus: (ticketId: string, newStatus: SupportTicket['status']) => Promise<{ success: boolean; message: string }>;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  allSubscribers: Subscriber[];
  deleteSubscriber: (id: string) => Promise<{ success: boolean; message: string }>;
  restoreDatabase: (data: any) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Data Constants
const DEFAULT_CRYPTO_DATA: CryptoCurrency[] = [
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', name: 'Bitcoin', symbol: 'BTC', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', name: 'Ethereum', symbol: 'ETH', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdt.svg', name: 'Tether', symbol: 'USDT', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/bnb.svg', name: 'BNB', symbol: 'BNB', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg', name: 'USD Coin', symbol: 'USDC', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/xrp.svg', name: 'XRP', symbol: 'XRP', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/ada.svg', name: 'Cardano', symbol: 'ADA', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/sol.svg', name: 'Solana', symbol: 'SOL', status: 'Enabled' },
];

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    siteTitle: 'Crypto Education',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    siteBaseColor: '#4f46e5',
    recordsPerPage: '20 items per page',
    currencyPosition: 'Symbol goes after Amount',
    referralBonus: '2',
    newUserBalance: '500',
    tradeProfit: '85',
    coinmarketcapApiKey: '',
    logoUrl: '',
    faviconUrl: '',
};

const DEFAULT_TRADE_SETTINGS: TradeSettings = {
    tradingEnabled: true,
    profitPercentage: 85,
    minTradeAmount: 10,
    maxTradeAmount: 5000,
    durationOptions: [60, 120, 300]
};

const DEFAULT_SYSTEM_CONFIGURATION: SystemConfiguration = {
    userRegistration: true,
    forceSSL: false,
    agreePolicy: true,
    forceSecurePassword: true,
    emailVerification: false,
    emailNotification: true,
    mobileVerification: false,
    mobileNotification: false,
    kycVerification: false,
    languageSelection: true,
};

// --- Error Helper ---
const handleSnapshotError = (error: any, context: string) => {
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn(`${context}: Permission denied. Your account might not have access to this data or the database rules are blocking access.`);
    } else {
        console.error(`${context}:`, error);
    }
};

const getFriendlyErrorMessage = (error: any) => {
    const code = error?.code || '';
    const message = error?.message || '';
    
    if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
        console.warn("Firebase Permission Warning:", message);
        return 'Missing or insufficient permissions. Please check your account status or contact support.';
    }

    const expectedUserErrors = [
        'auth/email-already-in-use',
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-email',
        'auth/weak-password',
        'auth/missing-password',
        'auth/requires-recent-login'
    ];

    if (expectedUserErrors.includes(code) || message.includes('email-already-in-use') || message.includes('invalid-credential')) {
        // Normal logs
    } else {
        console.error("Firebase Operation Error:", error);
    }
    
    if (!error) return 'An unknown error occurred.';
    
    if (typeof error === 'string') return error;

    if (code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
        return 'Invalid credentials. Please check your email and password.';
    }
    if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        return 'This email is already registered. Please Log In instead.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        return 'Invalid email or password.';
    }
    if (code === 'auth/invalid-email') {
        return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
        return 'Password should be at least 6 characters.';
    }
    
    switch (code) {
        case 'auth/configuration-not-found':
            return 'Configuration Error: Please enable the "Email/Password" Sign-in method in your Firebase Console.';
        case 'auth/operation-not-allowed':
            return 'Operation Not Allowed: Email/Password sign-in is disabled in the Firebase Console.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        default:
            return error.message || 'An unexpected error occurred.';
    }
};

// Helper to determine role consistently based on email
const getRoleFromEmail = (email: string, storedRole?: string): 'admin' | 'user' => {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail.startsWith('admin') || normalizedEmail === 'hennrywilliam6585@gmail.com') {
        return 'admin';
    }
    return (storedRole === 'admin' || storedRole === 'user') ? storedRole : 'user';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // Admin Views Data
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
    const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
    const [allSupportTickets, setAllSupportTickets] = useState<SupportTicket[]>([]);
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [allSubscribers, setAllSubscribers] = useState<Subscriber[]>([]);
    
    // Settings
    const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>(DEFAULT_CRYPTO_DATA);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
    const [tradeSettings, setTradeSettings] = useState<TradeSettings>(DEFAULT_TRADE_SETTINGS);
    const [systemConfiguration, setSystemConfiguration] = useState<SystemConfiguration>(DEFAULT_SYSTEM_CONFIGURATION);

    // 1. Initialize Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setFirebaseUser(currentUser);
            if (currentUser) {
                // If user state is already set (by login function), skip fetching to avoid race condition flicker
                // We only fetch if user state is null (page reload)
                if (!user || user.id !== currentUser.uid) {
                    try {
                        // Fetch user profile from Firestore
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const userSnapshot = await getDoc(userDocRef);
                        
                        if (userSnapshot.exists()) {
                            const data = userSnapshot.data();
                            const email = data.email || currentUser.email || '';
                            const role = getRoleFromEmail(email, data.role);

                            setUser({ 
                                id: currentUser.uid, 
                                ...data,
                                availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                                role: role,
                                fullName: data.fullName || currentUser.displayName || 'User',
                                email: email
                            } as User);
                        } else {
                            const email = currentUser.email || '';
                            const role = getRoleFromEmail(email);

                            setUser({
                                id: currentUser.uid,
                                email: email,
                                fullName: currentUser.displayName || 'User',
                                role: role, 
                                availableBalance: 0,
                                status: 'Active'
                            } as User);
                        }
                        
                        loadSettings();
                    } catch (e: any) {
                         const email = currentUser.email || '';
                         const role = getRoleFromEmail(email);

                         setUser({
                             id: currentUser.uid,
                             email: email,
                             fullName: currentUser.displayName || 'User',
                             role: role, 
                             availableBalance: 0, 
                             status: 'Active'
                         } as User);
                    }
                }
            } else {
                setUser(null);
                setAllUsers([]); 
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]); // Add user as dep to check if we need to fetch

    // 2. Live Data Listeners
    useEffect(() => {
        if (!firebaseUser) return;

        const userUnsub = onSnapshot(
            doc(db, 'users', firebaseUser.uid), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const email = data.email || firebaseUser.email || '';
                    const role = getRoleFromEmail(email, data.role);

                    setUser(prev => ({ 
                        ...prev, // Keep existing state to avoid jitter
                        id: docSnap.id, 
                        ...data,
                        availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                        role: role,
                        fullName: data.fullName || firebaseUser.displayName || 'User',
                        email: email
                    } as User));
                }
            },
            (error) => handleSnapshotError(error, "Error listening to user profile")
        );
        
        return () => {
            userUnsub();
        };
    }, [firebaseUser]);

    // Admin Listeners
    useEffect(() => {
        if (user?.role === 'admin') {
            const qUsers = query(collection(db, 'users'));
            const unsubUsers = onSnapshot(qUsers, (snapshot) => {
                const users = snapshot.docs.map(d => ({ 
                    id: d.id, ...d.data(), availableBalance: d.data().availableBalance || 0 
                } as User));
                setAllUsers(users);
            }, (error) => handleSnapshotError(error, "Error listening to all users"));

            const qDeposits = query(collection(db, 'deposits'));
            const unsubDeposits = onSnapshot(qDeposits, (snapshot) => {
                setAllDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
            }, (error) => handleSnapshotError(error, "Error listening to all deposits"));

            const qWithdrawals = query(collection(db, 'withdrawals'));
            const unsubWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
                setAllWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
            }, (error) => handleSnapshotError(error, "Error listening to all withdrawals"));

            const qTickets = query(collection(db, 'tickets'));
            const unsubTickets = onSnapshot(qTickets, (snapshot) => {
                setAllSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
            }, (error) => handleSnapshotError(error, "Error listening to all tickets"));

            const qSubscribers = query(collection(db, 'subscribers'));
            const unsubSubscribers = onSnapshot(qSubscribers, (snapshot) => {
                setAllSubscribers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscriber)));
            }, (error) => handleSnapshotError(error, "Error listening to all subscribers"));

            return () => { unsubUsers(); unsubDeposits(); unsubWithdrawals(); unsubTickets(); unsubSubscribers(); };
        } else if (user?.role === 'user') {
             const qDeposits = query(collection(db, 'deposits'), where('userId', '==', user.id));
             const unsubDeposits = onSnapshot(qDeposits, (snapshot) => {
                setAllDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
             }, (error) => handleSnapshotError(error, "Error listening to user deposits"));

             const qWithdrawals = query(collection(db, 'withdrawals'), where('userId', '==', user.id));
             const unsubWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
                setAllWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
             }, (error) => handleSnapshotError(error, "Error listening to user withdrawals"));

             const qTickets = query(collection(db, 'tickets'), where('userId', '==', user.id));
             const unsubTickets = onSnapshot(qTickets, (snapshot) => {
                setAllSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
             }, (error) => handleSnapshotError(error, "Error listening to user tickets"));
             
             return () => { unsubDeposits(); unsubWithdrawals(); unsubTickets(); };
        }
    }, [user?.role, user?.id]);

    const loadSettings = async () => {
        try {
            const sysDoc = await getDoc(doc(db, 'settings', 'system'));
            if (sysDoc.exists()) setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...sysDoc.data() } as SystemSettings);

            const tradeDoc = await getDoc(doc(db, 'settings', 'trade'));
            if (tradeDoc.exists()) setTradeSettings(tradeDoc.data() as TradeSettings);
            
            const currencyDoc = await getDoc(doc(db, 'settings', 'currencies'));
            if (currencyDoc.exists()) setCryptoCurrencies(currencyDoc.data().list as CryptoCurrency[]);

            const configDoc = await getDoc(doc(db, 'settings', 'configuration'));
            if (configDoc.exists()) setSystemConfiguration(configDoc.data() as SystemConfiguration);
        } catch (error) { console.warn("Error loading settings:", error); }
    };
    
    // Notification Listener
    useEffect(() => {
        if(user?.id) {
            let q;
            if (user.role === 'admin') {
                q = query(collection(db, 'notifications'), where('userId', 'in', [user.id, 'admin']));
            } else {
                q = query(collection(db, 'notifications'), where('userId', '==', user.id));
            }
            
            const unsub = onSnapshot(q, (snapshot) => {
                const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
                setAllNotifications(notifs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }, (error) => handleSnapshotError(error, "Error listening to notifications"));
            return () => unsub();
        }
    }, [user?.id, user?.role]);


    // --- Actions ---

    const addNotification = async (userId: string, title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => {
        const newNotif = { userId, title, message, type, timestamp: new Date().toISOString(), read: false };
        try { await addDoc(collection(db, 'notifications'), newNotif); } catch (error) { console.warn("Error adding notification:", error); }
    };

    const updateGeneralSettings = async (settings: SystemSettings) => {
        try {
            await setDoc(doc(db, 'settings', 'system'), settings, { merge: true });
            setSystemSettings(settings);
        } catch (error) { console.error("Error updating general settings:", error); throw error; }
    };

    const updateTradeSettings = async (settings: TradeSettings) => {
        try {
            await setDoc(doc(db, 'settings', 'trade'), settings, { merge: true });
            setTradeSettings(settings);
        } catch (error) { console.error("Error updating trade settings:", error); throw error; }
    };

    const updateSystemConfiguration = async (config: SystemConfiguration) => {
        try {
            await setDoc(doc(db, 'settings', 'configuration'), config, { merge: true });
            setSystemConfiguration(config);
        } catch (error) { console.error("Error updating system configuration:", error); throw error; }
    };

    const signup = async (fullName: string, email: string, password: string) => {
        if (!systemConfiguration.userRegistration) {
            return { success: false, message: 'Registration is currently disabled by the administrator.' };
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const role = getRoleFromEmail(email);

            const newUser: User = {
                id: userCredential.user.uid,
                fullName,
                email,
                role, 
                availableBalance: Number(systemSettings.newUserBalance) || 500,
                profilePictureUrl: '',
                status: 'Active',
                tradeHistory: [],
                openTrades: [],
                lastSeen: new Date().toISOString(),
                joinedAt: new Date().toISOString()
            };
            
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            setUser(newUser); // Set immediate state
            await addNotification('admin', 'New User Registered', `User ${fullName} (${email}) has joined.`, 'info');
            
            return { success: true, message: 'Account created successfully.' };
        } catch (error: any) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;
            
            // Synchronous state update before returning
            const userDocRef = doc(db, 'users', uid);
            const userSnapshot = await getDoc(userDocRef);
            
            let userData: User;
            if (userSnapshot.exists()) {
                const data = userSnapshot.data();
                const role = getRoleFromEmail(email, data.role);
                userData = { 
                    id: uid, ...data,
                    availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                    role: role,
                    fullName: data.fullName || userCredential.user.displayName || 'User',
                    email: email
                } as User;
            } else {
                 const role = getRoleFromEmail(email);
                 userData = {
                     id: uid, email,
                     fullName: userCredential.user.displayName || 'User',
                     role: role, availableBalance: 0, status: 'Active'
                 } as User;
            }
            
            setUser(userData);
            return { success: true, message: 'Login successful.' };
        } catch (error: any) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const adminLogin = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const role = getRoleFromEmail(email);
            
            // Fetch user data manually first to set state immediately
            let userData: User;
            if (role === 'admin') {
                 userData = { id: userCredential.user.uid, email, fullName: 'Admin', role: 'admin', availableBalance: 0 } as User;
            } else {
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if(userDoc.exists() && userDoc.data().role === 'admin') {
                    const data = userDoc.data();
                    userData = { 
                        id: userCredential.user.uid, ...data,
                        availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                        role: 'admin',
                        fullName: data.fullName || 'Admin',
                        email
                    } as User;
                } else {
                    await signOut(auth);
                    return { success: false, message: 'Access denied. Not an admin.' };
                }
            }

            setUser(userData);
            return { success: true, message: 'Admin login successful.' };
        } catch (error: any) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const adjustBalance = async (amount: number) => {
        if (user) {
            try { await updateDoc(doc(db, 'users', user.id), { availableBalance: increment(amount) }); } catch (error) { console.error("Error adjusting balance", error); }
        }
    };

    const placeTrade = async (trade: OpenTrade, amount: number) => {
        if (!user) return { success: false, message: 'Not authenticated' };
        if (user.availableBalance < amount) return { success: false, message: 'Insufficient balance' };

        try {
            const userRef = doc(db, 'users', user.id);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) throw new Error("User not found");
            const userData = userSnap.data();
            const newOpenTrades = [trade, ...(userData.openTrades || [])];
            
            await updateDoc(userRef, { availableBalance: increment(-amount), openTrades: newOpenTrades });
            return { success: true, message: 'Trade placed successfully' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const addTradeToHistory = (trade: UserTradeLog) => {};
    const addOpenTrade = (trade: OpenTrade) => {};

    const setOpenTrades = async (trades: OpenTrade[]) => {
        if (!user) return;
        try { await updateDoc(doc(db, 'users', user.id), { openTrades: trades }); } catch (error) { console.error("Error setting open trades", error); }
    };

    const resolveTrades = async (results: { tradeId: string, log: UserTradeLog, payout: number }[]) => {
        if (!user) return;
        try {
            const userRef = doc(db, 'users', user.id);
            const userSnap = await getDoc(userRef);
            if(!userSnap.exists()) return;
            const userData = userSnap.data() as User;

            let currentOpenTrades = [...(userData.openTrades || [])];
            let currentHistory = [...(userData.tradeHistory || [])];
            let balanceToAdd = 0;

            results.forEach(({ tradeId, log, payout }) => {
                if (currentOpenTrades.some(t => t.id === tradeId)) {
                    currentOpenTrades = currentOpenTrades.filter(t => t.id !== tradeId);
                    currentHistory = [log, ...currentHistory];
                    balanceToAdd += payout;
                }
            });

            if (balanceToAdd > 0 || results.length > 0) {
                await updateDoc(userRef, {
                    openTrades: currentOpenTrades,
                    tradeHistory: currentHistory,
                    availableBalance: increment(balanceToAdd)
                });
            }
        } catch (error) { console.error("Error resolving trades:", error); }
    };

    const toggleCryptoStatus = async (symbol: string) => {
        try {
            const newList = cryptoCurrencies.map(c => 
                c.symbol === symbol ? { ...c, status: c.status === 'Enabled' ? 'Disabled' : 'Enabled' } : c
            );
            await setDoc(doc(db, 'settings', 'currencies'), { list: newList });
            setCryptoCurrencies(newList as CryptoCurrency[]);
        } catch (error) { console.error("Error toggling crypto", error); }
    };

    const addCrypto = async (crypto: Omit<CryptoCurrency, 'status'>) => {
        try {
            const newList = [...cryptoCurrencies, { ...crypto, status: 'Enabled' }];
            await setDoc(doc(db, 'settings', 'currencies'), { list: newList });
            setCryptoCurrencies(newList as CryptoCurrency[]);
        } catch (error) { console.error("Error adding crypto", error); }
    };

    const toggleUserStatus = async (userId: string) => {
        try {
            const targetUser = allUsers.find(u => u.id === userId);
            if(targetUser) {
                const newStatus = targetUser.status === 'Active' ? 'Banned' : 'Active';
                await updateDoc(doc(db, 'users', userId), { status: newStatus });
            }
        } catch (error) { console.error("Error toggling user status", error); }
    };

    const addUser = async (userData: Omit<User, 'id' | 'role' | 'tradeHistory' | 'openTrades' | 'status'> & { password: string }) => {
        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
            const newUserId = userCredential.user.uid;
            
            const newUser: User = {
                id: newUserId,
                fullName: userData.fullName,
                email: userData.email,
                role: 'user',
                availableBalance: Number(userData.availableBalance) || 0,
                profilePictureUrl: '',
                status: 'Active',
                tradeHistory: [],
                openTrades: [],
                lastSeen: new Date().toISOString(),
                joinedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', newUserId), newUser);
            await signOut(secondaryAuth);
            return { success: true, message: 'User added successfully.' };
        } catch (error: any) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        } finally {
            if (secondaryApp) {
                try { await deleteApp(secondaryApp); } catch (err) { console.warn("Error deleting secondary app", err); }
            }
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            await deleteDoc(doc(db, 'users', userId));
            return { success: true, message: 'User deleted successfully.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const modifyUserBalance = async (userId: string, amount: number) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { availableBalance: increment(amount) });
            return { success: true, message: 'Balance updated.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const addManualDeposit = async (userId: string, amount: number) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw "User not found";
                const userData = userDoc.data();

                const newDepositId = `dep-man-${Date.now()}`;
                const newDepositRef = doc(db, 'deposits', newDepositId);

                const newDeposit: Deposit = {
                    id: newDepositId, userId: userId,
                    userName: userData.fullName || 'User', userEmail: userData.email || '',
                    gateway: 'System (Manual)',
                    logo: 'https://img.icons8.com/fluency/48/000000/bank.png',
                    amount: amount, initiated: new Date().toISOString(), status: 'Successful'
                };
                
                transaction.set(newDepositRef, newDeposit);
                transaction.update(userRef, { availableBalance: increment(amount) });
            });
            await addNotification(userId, 'Deposit Received', `System added deposit of $${amount}.`, 'success');
            return { success: true, message: 'Manual deposit added successfully.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const giveBonus = async (userId: string, amount: number, message: string) => {
        const result = await modifyUserBalance(userId, amount);
        if (result.success) {
            await addNotification(userId, 'Bonus Received', `You received a bonus of $${amount}. ${message}`, 'success');
        }
        return result;
    };

    const updateProfile = async (profileData: Partial<User>) => {
        if (!user) return { success: false, message: 'Not authenticated' };
        try {
            await updateDoc(doc(db, 'users', user.id), profileData);
            return { success: true, message: 'Profile updated successfully.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const updateUserData = async (userId: string, data: Partial<User>) => {
        try {
            await updateDoc(doc(db, 'users', userId), data);
            return { success: true, message: 'User details updated successfully.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    // --- Deposits ---
    const requestDeposit = async (gateway: string, logo: string, amount: number) => {
        if (!user) return { success: false, message: "Login required" };
        try {
            const newDeposit: Deposit = {
                id: `dep-${Date.now()}`,
                userId: user.id, userName: user.fullName, userEmail: user.email,
                gateway, logo, amount, initiated: new Date().toISOString(), status: 'Pending'
            };
            await setDoc(doc(db, 'deposits', newDeposit.id), newDeposit);
            await addNotification('admin', 'New Deposit Request', `User ${user.fullName} requested deposit of $${amount} via ${gateway}.`, 'info');
            return { success: true, message: 'Deposit request submitted.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const approveDeposit = async (depositId: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const depositRef = doc(db, 'deposits', depositId);
                const depositDoc = await transaction.get(depositRef);
                if (!depositDoc.exists()) throw "Deposit not found";
                const deposit = depositDoc.data() as Deposit;
                if (deposit.status !== 'Pending') throw "Already processed";

                const userRef = doc(db, 'users', deposit.userId);
                transaction.update(depositRef, { status: 'Successful' });
                transaction.update(userRef, { availableBalance: increment(deposit.amount) });
            });
            try {
                const depositSnap = await getDoc(doc(db, 'deposits', depositId));
                if (depositSnap.exists()) {
                    const deposit = depositSnap.data() as Deposit;
                    await addNotification(deposit.userId, 'Deposit Approved', `Your deposit of $${deposit.amount} is approved.`, 'success');
                }
            } catch(e) {}
            return { success: true, message: 'Deposit approved.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const rejectDeposit = async (depositId: string) => {
        const deposit = allDeposits.find(d => d.id === depositId);
        if (!deposit) return { success: false, message: "Deposit not found" };
        try {
            await updateDoc(doc(db, 'deposits', depositId), { status: 'Cancelled' });
            await addNotification(deposit.userId, 'Deposit Rejected', `Your deposit was rejected.`, 'error');
            return { success: true, message: 'Deposit rejected.' };
        } catch (error) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    // --- Withdrawals ---
    const requestWithdrawal = async (withdrawalData: any) => {
        if (!user) return { success: false, message: "Login required" };
        if (user.availableBalance < withdrawalData.amount) return { success: false, message: "Insufficient balance" };
        try {
            await modifyUserBalance(user.id, -withdrawalData.amount);
            const newWithdrawal: Withdrawal = {
                id: `with-${Date.now()}`,
                userId: user.id, userName: user.fullName, userEmail: user.email,
                initiated: new Date().toISOString(), status: 'Pending', ...withdrawalData
            };
            await setDoc(doc(db, 'withdrawals', newWithdrawal.id), newWithdrawal);
             await addNotification('admin', 'New Withdrawal Request', `User ${user.fullName} requested withdrawal of $${withdrawalData.amount}.`, 'warning');
            return { success: true, message: 'Withdrawal request submitted.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const approveWithdrawal = async (withdrawalId: string) => {
        const w = allWithdrawals.find(x => x.id === withdrawalId);
        if (!w) return { success: false, message: "Not found" };
        try {
            await updateDoc(doc(db, 'withdrawals', withdrawalId), { status: 'Successful' });
            await addNotification(w.userId, 'Withdrawal Approved', `Your withdrawal is processed.`, 'success');
            return { success: true, message: 'Withdrawal approved.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const rejectWithdrawal = async (withdrawalId: string) => {
        const w = allWithdrawals.find(x => x.id === withdrawalId);
        if (!w) return { success: false, message: "Not found" };
        try {
            await updateDoc(doc(db, 'withdrawals', withdrawalId), { status: 'Cancelled' });
            await modifyUserBalance(w.userId, w.amount);
            await addNotification(w.userId, 'Withdrawal Rejected', `Your withdrawal was rejected and funds refunded.`, 'error');
            return { success: true, message: 'Withdrawal rejected.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    // --- Support ---
    const openSupportTicket = async (ticketData: any) => {
        if (!user) return { success: false, message: "Login required" };
        try {
            const newTicket: SupportTicket = {
                id: `ticket-${Date.now()}`,
                userId: user.id, userName: user.fullName, userEmail: user.email,
                status: 'Open', lastReply: new Date().toISOString(), ...ticketData
            };
            await setDoc(doc(db, 'tickets', newTicket.id), newTicket);
            await addNotification('admin', 'New Support Ticket', `Ticket #${newTicket.id} created by ${user.fullName}.`, 'info');
            return { success: true, message: 'Ticket created.' };
        } catch (error) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const replyToSupportTicket = async (ticketId: string, messageText: string) => {
        const ticket = allSupportTickets.find(t => t.id === ticketId);
        if (!ticket) return { success: false, message: "Ticket not found" };
        try {
            const sender: 'user' | 'admin' = user?.role === 'admin' ? 'admin' : 'user';
            const newMessage: TicketMessage = { sender, text: messageText, timestamp: new Date().toISOString() };
            const newStatus: SupportTicket['status'] = user?.role === 'admin' ? 'Answered' : 'Customer-Reply';

            await updateDoc(doc(db, 'tickets', ticketId), {
                messages: [...ticket.messages, newMessage], status: newStatus, lastReply: new Date().toISOString()
            });
            if (sender === 'admin') await addNotification(ticket.userId, 'Ticket Reply', `Admin replied to your ticket.`, 'info');
            return { success: true, message: 'Reply sent.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const changeTicketStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
        try {
            await updateDoc(doc(db, 'tickets', ticketId), { status: newStatus });
            return { success: true, message: 'Status updated.' };
        } catch (error) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    // --- Notifications & Subs ---
    const markNotificationAsRead = async (id: string) => {
        try { await updateDoc(doc(db, 'notifications', id), { read: true }); } catch (e) { console.warn("Error marking read", e); }
    };

    const markAllAsRead = async () => {
        if(allNotifications.length > 0) {
            allNotifications.forEach(async (n) => {
                if(!n.read) try { await updateDoc(doc(db, 'notifications', n.id), { read: true }); } catch(e){}
            });
        }
    };

    const clearAllNotifications = async () => {
        if (!user) return;
        try {
            let q;
            if (user.role === 'admin') q = query(collection(db, 'notifications'), where('userId', 'in', [user.id, 'admin']));
            else q = query(collection(db, 'notifications'), where('userId', '==', user.id));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (error) { console.error("Error clearing notifications", error); }
    };

    const deleteSubscriber = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'subscribers', id));
            return { success: true, message: 'Subscriber removed.' };
        } catch (error) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const restoreDatabase = async (data: any) => {
        try {
            let batch = writeBatch(db);
            let count = 0;
            let total = 0;

            const commitAndReset = async () => { await batch.commit(); batch = writeBatch(db); count = 0; }
            const safeSet = async (ref: any, docData: any) => {
                batch.set(ref, docData);
                count++; total++;
                if (count >= 450) await commitAndReset();
            }

            if (Array.isArray(data.users)) for (const u of data.users) await safeSet(doc(db, 'users', u.id), u);
            if (Array.isArray(data.deposits)) for (const d of data.deposits) await safeSet(doc(db, 'deposits', d.id), d);
            if (Array.isArray(data.withdrawals)) for (const w of data.withdrawals) await safeSet(doc(db, 'withdrawals', w.id), w);
            if (Array.isArray(data.tickets)) for (const t of data.tickets) await safeSet(doc(db, 'tickets', t.id), t);
            if (Array.isArray(data.notifications)) for (const n of data.notifications) await safeSet(doc(db, 'notifications', n.id), n);
            if (Array.isArray(data.subscribers)) for (const s of data.subscribers) await safeSet(doc(db, 'subscribers', s.id), s);
            
            if (data.systemSettings) await safeSet(doc(db, 'settings', 'system'), data.systemSettings);
            if (data.tradeSettings) await safeSet(doc(db, 'settings', 'trade'), data.tradeSettings);
            if (data.currencies) await safeSet(doc(db, 'settings', 'currencies'), { list: data.currencies });
            if (data.configuration) await safeSet(doc(db, 'settings', 'configuration'), data.configuration);

            if (count > 0) await batch.commit();
            return { success: true, message: `Database restored with ${total} records updated.` };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated: !!user, loading, systemSettings, tradeSettings, systemConfiguration,
            updateGeneralSettings, updateTradeSettings, updateSystemConfiguration,
            signup, login, adminLogin, logout,
            adjustBalance, placeTrade, modifyUserBalance, addManualDeposit, giveBonus, updateProfile, updateUserData,
            addTradeToHistory, addOpenTrade, setOpenTrades, resolveTrades,
            cryptoCurrencies, toggleCryptoStatus, addCrypto,
            allUsers, toggleUserStatus, addUser, deleteUser,
            allDeposits, requestDeposit, approveDeposit, rejectDeposit,
            allWithdrawals, requestWithdrawal, approveWithdrawal, rejectWithdrawal,
            allSupportTickets, openSupportTicket, replyToSupportTicket, changeTicketStatus,
            notifications: allNotifications,
            markNotificationAsRead, markAllAsRead, clearAllNotifications,
            allSubscribers, deleteSubscriber,
            restoreDatabase
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within a AuthProvider');
  return context;
};
