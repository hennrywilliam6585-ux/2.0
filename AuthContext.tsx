
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import type { User, UserTradeLog, OpenTrade, CryptoCurrency, Deposit, Withdrawal, SupportTicket, Notification, TicketMessage } from './types';

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
}

export interface TradeSettings {
    tradingEnabled: boolean;
    profitPercentage: number;
    minTradeAmount: number;
    maxTradeAmount: number;
    durationOptions: number[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  systemSettings: SystemSettings;
  tradeSettings: TradeSettings;
  updateGeneralSettings: (settings: SystemSettings) => Promise<void>;
  updateTradeSettings: (settings: TradeSettings) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  adjustBalance: (amount: number) => void;
  placeTrade: (trade: OpenTrade, amount: number) => Promise<{ success: boolean; message: string }>;
  modifyUserBalance: (userId: string, amount: number) => Promise<{ success: boolean; message: string }>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Data Constants
const DEFAULT_CRYPTO_DATA: CryptoCurrency[] = [
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/btc.svg', name: 'Bitcoin', symbol: 'BTC', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/eth.svg', name: 'Ethereum', symbol: 'ETH', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdt.svg', name: 'Tether', symbol: 'USDT', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/bnb.svg', name: 'BNB', symbol: 'BNB', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/usdc.svg', name: 'USD Coin', symbol: 'USDC', status: 'Enabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/xrp.svg', name: 'XRP', symbol: 'XRP', status: 'Disabled' },
    { icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25661/svg/color/ada.svg', name: 'Cardano', symbol: 'ADA', status: 'Enabled' },
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
    coinmarketcapApiKey: ''
};

const DEFAULT_TRADE_SETTINGS: TradeSettings = {
    tradingEnabled: true,
    profitPercentage: 85,
    minTradeAmount: 10,
    maxTradeAmount: 5000,
    durationOptions: [60, 120, 300]
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
    
    // 1. Handle Permission Errors silently/warn only
    if (code === 'permission-denied' || message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
        console.warn("Firebase Permission Warning:", message);
        return 'Missing or insufficient permissions. Please check your account status or contact support.';
    }

    // 2. Handle Expected User Errors (Auth) - Do NOT log as console.error to avoid alarm
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
        // These are normal user input errors, no need for console.error
    } else {
        // Log actual system/unexpected errors
        console.error("Firebase Operation Error:", error);
    }
    
    if (!error) return 'An unknown error occurred.';
    
    // 3. Return Friendly Messages for UI
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
    
    // Settings
    const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>(DEFAULT_CRYPTO_DATA);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
    const [tradeSettings, setTradeSettings] = useState<TradeSettings>(DEFAULT_TRADE_SETTINGS);

    // 1. Initialize Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setFirebaseUser(currentUser);
            if (currentUser) {
                try {
                    // Fetch user profile from Firestore
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userSnapshot = await getDoc(userDocRef);
                    
                    if (userSnapshot.exists()) {
                        const data = userSnapshot.data();
                        const email = data.email || currentUser.email || '';
                        // FORCE ADMIN ROLE based on email if pattern matches
                        const role = getRoleFromEmail(email, data.role);

                        setUser({ 
                            id: currentUser.uid, 
                            ...data,
                            // Ensure critical fields have defaults to prevent crashes
                            availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                            role: role,
                            fullName: data.fullName || currentUser.displayName || 'User',
                            email: email
                        } as User);
                    } else {
                        // Fallback if auth exists but no firestore doc or read failed previously
                        console.warn("User document not found for ID:", currentUser.uid);
                        
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
                    
                    // Load settings once on auth
                    loadSettings();
                } catch (e: any) {
                     // Permission denied fallback or other errors
                     if (e.code === 'permission-denied') {
                        console.warn("Permission denied fetching profile. Using Auth fallback.");
                     } else {
                        console.error("Error fetching user profile or settings:", e);
                     }
                     
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
            } else {
                setUser(null);
                setAllUsers([]); 
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

                    setUser({ 
                        id: docSnap.id, 
                        ...data,
                        // Safety defaults for realtime updates
                        availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0,
                        role: role,
                        fullName: data.fullName || firebaseUser.displayName || 'User',
                        email: email
                    } as User);
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
            const unsubUsers = onSnapshot(
                qUsers, 
                (snapshot) => {
                    const users = snapshot.docs.map(d => {
                        const data = d.data();
                        return { 
                            id: d.id, 
                            ...data,
                            availableBalance: typeof data.availableBalance === 'number' ? data.availableBalance : 0
                        } as User;
                    });
                    setAllUsers(users);
                },
                (error) => handleSnapshotError(error, "Error listening to all users")
            );

            const qDeposits = query(collection(db, 'deposits'));
            const unsubDeposits = onSnapshot(
                qDeposits, 
                (snapshot) => {
                    setAllDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
                },
                (error) => handleSnapshotError(error, "Error listening to all deposits")
            );

            const qWithdrawals = query(collection(db, 'withdrawals'));
            const unsubWithdrawals = onSnapshot(
                qWithdrawals, 
                (snapshot) => {
                    setAllWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
                },
                (error) => handleSnapshotError(error, "Error listening to all withdrawals")
            );

            const qTickets = query(collection(db, 'tickets'));
            const unsubTickets = onSnapshot(
                qTickets, 
                (snapshot) => {
                    setAllSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
                },
                (error) => handleSnapshotError(error, "Error listening to all tickets")
            );

            return () => {
                unsubUsers();
                unsubDeposits();
                unsubWithdrawals();
                unsubTickets();
            };
        } else if (user?.role === 'user') {
             const qDeposits = query(collection(db, 'deposits'), where('userId', '==', user.id));
             const unsubDeposits = onSnapshot(
                qDeposits, 
                (snapshot) => {
                    setAllDeposits(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
                },
                (error) => handleSnapshotError(error, "Error listening to user deposits")
             );

             const qWithdrawals = query(collection(db, 'withdrawals'), where('userId', '==', user.id));
             const unsubWithdrawals = onSnapshot(
                qWithdrawals, 
                (snapshot) => {
                    setAllWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
                },
                (error) => handleSnapshotError(error, "Error listening to user withdrawals")
             );

             const qTickets = query(collection(db, 'tickets'), where('userId', '==', user.id));
             const unsubTickets = onSnapshot(
                qTickets, 
                (snapshot) => {
                    setAllSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket)));
                },
                (error) => handleSnapshotError(error, "Error listening to user tickets")
             );
             
             return () => {
                unsubDeposits();
                unsubWithdrawals();
                unsubTickets();
             };
        }
    }, [user?.role, user?.id]);

    // Load Settings Function
    const loadSettings = async () => {
        try {
            const sysDoc = await getDoc(doc(db, 'settings', 'system'));
            if (sysDoc.exists()) setSystemSettings(sysDoc.data() as SystemSettings);
            // Silently fail default creation if permission denied to avoid clutter
            else if (auth.currentUser) {
                try { await setDoc(doc(db, 'settings', 'system'), DEFAULT_SYSTEM_SETTINGS); } catch(e) {}
            }

            const tradeDoc = await getDoc(doc(db, 'settings', 'trade'));
            if (tradeDoc.exists()) setTradeSettings(tradeDoc.data() as TradeSettings);
             else if (auth.currentUser) {
                try { await setDoc(doc(db, 'settings', 'trade'), DEFAULT_TRADE_SETTINGS); } catch(e) {}
            }
            
            const currencyDoc = await getDoc(doc(db, 'settings', 'currencies'));
            if (currencyDoc.exists()) setCryptoCurrencies(currencyDoc.data().list as CryptoCurrency[]);
             else if (auth.currentUser) {
                 try { await setDoc(doc(db, 'settings', 'currencies'), { list: DEFAULT_CRYPTO_DATA }); } catch(e) {}
            }
        } catch (error) {
            // Just warn for settings load failure
            console.warn("Error loading settings (likely permission denied):", error);
        }
    };
    
    // Notification Listener
    useEffect(() => {
        if(user?.id) {
            const q = query(collection(db, 'notifications'), where('userId', '==', user.id));
            const unsub = onSnapshot(
                q, 
                (snapshot) => {
                    const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
                    setAllNotifications(notifs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                },
                (error) => handleSnapshotError(error, "Error listening to notifications")
            );
            return () => unsub();
        }
    }, [user?.id]);


    // --- Actions ---

    const addNotification = async (userId: string, title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => {
        const newNotif = {
            userId,
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        };
        try {
             await addDoc(collection(db, 'notifications'), newNotif);
        } catch (error) { console.warn("Error adding notification:", error); }
    };

    const updateGeneralSettings = async (settings: SystemSettings) => {
        try {
            await setDoc(doc(db, 'settings', 'system'), settings);
            setSystemSettings(settings);
        } catch (error) { console.error("Error updating general settings:", error); throw error; }
    };

    const updateTradeSettings = async (settings: TradeSettings) => {
        try {
            await setDoc(doc(db, 'settings', 'trade'), settings);
            setTradeSettings(settings);
        } catch (error) { console.error("Error updating trade settings:", error); throw error; }
    };

    const signup = async (fullName: string, email: string, password: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Developer helper: Auto-assign 'admin' role if email starts with 'admin' or is the specific admin email
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
            
            try {
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            } catch (e) {
                console.warn("Created user in Auth but failed to create Firestore doc (Permission Denied). User will use fallback profile.");
            }
            
            return { success: true, message: 'Account created successfully.' };
        } catch (error: any) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true, message: 'Login successful.' };
        } catch (error: any) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const adminLogin = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Use the helper here as well to trust the email format even if DB read fails or is restricted
            const role = getRoleFromEmail(email);
            
            if (role === 'admin') {
                return { success: true, message: 'Admin login successful.' };
            }

            // If email doesn't match admin pattern, try fetching doc (standard way)
            try {
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if(userDoc.exists() && userDoc.data().role === 'admin') {
                    return { success: true, message: 'Admin login successful.' };
                } else {
                    await signOut(auth);
                    return { success: false, message: 'Access denied. Not an admin.' };
                }
            } catch (e: any) {
                 // Permission denied usually means not admin unless matched by email above
                 await signOut(auth);
                 throw e;
            }
        } catch (error: any) {
             return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const adjustBalance = async (amount: number) => {
        if (user) {
            try {
                const newBalance = user.availableBalance + amount;
                await updateDoc(doc(db, 'users', user.id), { availableBalance: newBalance });
            } catch (error) { console.error("Error adjusting balance", error); }
        }
    };

    const placeTrade = async (trade: OpenTrade, amount: number) => {
        if (!user) return { success: false, message: 'Not authenticated' };
        if (user.availableBalance < amount) return { success: false, message: 'Insufficient balance' };

        try {
            const newBalance = user.availableBalance - amount;
            const newOpenTrades = [trade, ...(user.openTrades || [])];

            await updateDoc(doc(db, 'users', user.id), {
                availableBalance: newBalance,
                openTrades: newOpenTrades
            });

            return { success: true, message: 'Trade placed successfully' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const addTradeToHistory = (trade: UserTradeLog) => {};
    const addOpenTrade = (trade: OpenTrade) => {};

    const setOpenTrades = async (trades: OpenTrade[]) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.id), { openTrades: trades });
        } catch (error) { console.error("Error setting open trades", error); }
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
                    availableBalance: userData.availableBalance + balanceToAdd
                });
            }
        } catch (error) {
            console.error("Error resolving trades:", error);
        }
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

    const addUser = async (userData: any) => {
        try {
             // Note: This is a client-side check. In real app, use Admin SDK cloud function.
             return { success: false, message: 'For security, new users must sign up themselves via the registration page.' };
        } catch (error:any) {
            return { success: false, message: error.message };
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            await setDoc(doc(db, 'users', userId), { status: 'Deleted', email: `deleted_${Date.now()}@user.com` }); 
            return { success: true, message: 'User marked as deleted.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const modifyUserBalance = async (userId: string, amount: number) => {
        try {
            const targetUser = allUsers.find(u => u.id === userId);
            if(targetUser) {
                 await updateDoc(doc(db, 'users', userId), { availableBalance: targetUser.availableBalance + amount });
                 return { success: true, message: 'Balance updated.' };
            }
            return { success: false, message: 'User not found.' };
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
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                gateway,
                logo,
                amount,
                initiated: new Date().toISOString(),
                status: 'Pending'
            };
            await setDoc(doc(db, 'deposits', newDeposit.id), newDeposit);
            return { success: true, message: 'Deposit request submitted.' };
        } catch (error) {
            return { success: false, message: getFriendlyErrorMessage(error) };
        }
    };

    const approveDeposit = async (depositId: string) => {
        const deposit = allDeposits.find(d => d.id === depositId);
        if (!deposit) return { success: false, message: "Deposit not found" };
        if (deposit.status !== 'Pending') return { success: false, message: "Already processed" };

        try {
            await updateDoc(doc(db, 'deposits', depositId), { status: 'Successful' });
            await modifyUserBalance(deposit.userId, deposit.amount);
            await addNotification(deposit.userId, 'Deposit Approved', `Your deposit of $${deposit.amount} is approved.`, 'success');
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
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                initiated: new Date().toISOString(),
                status: 'Pending',
                ...withdrawalData
            };
            await setDoc(doc(db, 'withdrawals', newWithdrawal.id), newWithdrawal);
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
                userId: user.id,
                userName: user.fullName,
                userEmail: user.email,
                status: 'Open',
                lastReply: new Date().toISOString(),
                ...ticketData
            };
            await setDoc(doc(db, 'tickets', newTicket.id), newTicket);
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
                messages: [...ticket.messages, newMessage],
                status: newStatus,
                lastReply: new Date().toISOString()
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

    // --- Notifications ---
    const markNotificationAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) { console.warn("Error marking read", e); }
    };

    const markAllAsRead = async () => {
        if(allNotifications.length > 0) {
            allNotifications.forEach(async (n) => {
                if(!n.read) {
                     try { await updateDoc(doc(db, 'notifications', n.id), { read: true }); } catch(e){}
                }
            });
        }
    };

    const clearAllNotifications = async () => {
        // Implementation omitted for brevity
    };

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated: !!user, loading, systemSettings, tradeSettings,
            updateGeneralSettings, updateTradeSettings,
            signup, login, adminLogin, logout,
            adjustBalance, placeTrade, modifyUserBalance, giveBonus, updateProfile, updateUserData,
            addTradeToHistory, addOpenTrade, setOpenTrades, resolveTrades,
            cryptoCurrencies, toggleCryptoStatus, addCrypto,
            allUsers, toggleUserStatus, addUser, deleteUser,
            allDeposits, requestDeposit, approveDeposit, rejectDeposit,
            allWithdrawals, requestWithdrawal, approveWithdrawal, rejectWithdrawal,
            allSupportTickets, openSupportTicket, replyToSupportTicket, changeTicketStatus,
            notifications: allNotifications,
            markNotificationAsRead, markAllAsRead, clearAllNotifications
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