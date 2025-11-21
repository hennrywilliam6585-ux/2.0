
import React from 'react';

export interface UserTradeLog {
  pair: string;
  type: 'HIGH' | 'LOW';
  amount: string;
  entryPrice: string;
  exitPrice: string;
  result: 'Winning' | 'Losing';
  initiated: string;
  payout?: string;
}

export interface OpenTrade {
  id: string;
  pair: string;
  type: 'HIGH' | 'LOW';
  amount: number;
  entryPrice: number;
  expiryTimestamp: number;
}

export interface User {
  id: string;
  fullName:string;
  email: string;
  role: 'user' | 'admin';
  availableBalance: number;
  profilePictureUrl?: string;
  mobile?: string;
  address?: string;
  state?: string;
  zip?: string;
  country?: string;
  tradeHistory?: UserTradeLog[];
  openTrades?: OpenTrade[];
  status?: 'Active' | 'Banned';
  lastSeen?: string; // ISO date string
  joinedAt?: string; // ISO date string
}

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

export interface TradeLog {
  id: string;
  gateway: string;
  initiated: string;
  amount: string;
  conversion: string;
  status: 'Successful' | 'Pending' | 'Cancelled';
}

export interface CryptoCurrency {
  icon: string;
  name: string;
  symbol: string;
  status: 'Enabled' | 'Disabled';
}

export interface SystemSettingCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

export interface TicketMessage {
  sender: 'user' | 'admin';
  text: string;
  timestamp: string; // ISO date string
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  department: string;
  lastReply: string; // ISO date string
  status: 'Answered' | 'Open' | 'Customer-Reply' | 'Closed';
  messages: TicketMessage[];
}

export interface Deposit {
  id: string; // transaction id
  userId: string;
  userName: string;
  userEmail: string;
  gateway: string;
  logo: string;
  amount: number;
  initiated: string; // ISO date string
  status: 'Pending' | 'Successful' | 'Cancelled';
}

export interface Withdrawal {
  id: string; // transaction id
  userId: string;
  userName: string;
  userEmail: string;
  method: string;
  logo: string;
  amount: number; // The requested amount
  charge: number;
  finalAmount: number; // Amount after charge
  userWithdrawalInfo: string; // Wallet address, bank details, etc.
  initiated: string; // ISO date string
  status: 'Pending' | 'Successful' | 'Cancelled';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}