
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, systemSettings } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setLoading(true);
        const { success, message } = await login(email, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError(message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-dark-blue flex items-center justify-center p-4" style={{ background: 'radial-gradient(circle, rgba(30,41,59,1) 0%, rgba(17,24,39,1) 100%)' }}>
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center h-16 w-16 bg-primary/20 rounded-full mb-4">
                             {systemSettings.logoUrl ? (
                                <img src={systemSettings.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                            ) : (
                                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"></path></svg>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-white">User Login</h1>
                        <p className="text-gray-400">Welcome to {systemSettings.siteTitle || 'Crypto Education'}</p>
                    </div>
                    
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 bg-slate-900/50 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm text-center">
                                {error}
                                {error === 'Please use the admin login page.' && (
                                    <span> <Link to="/admin/login" className="font-bold underline hover:text-red-300">Click here</Link> to go to the admin login.</span>
                                )}
                            </div>
                        )}

                        <div>
                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-white text-center font-bold py-3 px-4 rounded-md hover:bg-primary/90 transition duration-300 disabled:bg-primary/70">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                <span>{loading ? 'Logging in...' : 'Login'}</span>
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-6 space-y-2">
                        <p className="text-sm text-gray-400">
                            Don't have an account? <Link to="/signup" className="text-accent/80 hover:underline hover:text-accent">Sign up</Link>
                        </p>
                        <p className="text-sm text-gray-400">
                            Administrator? <Link to="/admin/login" className="text-accent/80 hover:underline hover:text-accent">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
