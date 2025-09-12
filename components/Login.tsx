import React, { useState } from 'react';

interface LoginProps {
    onLogin: (email: string, password: string) => boolean;
    onRegister: (name: string, email: string, password: string) => boolean;
    error: string | null;
    onBack: () => void;
}

type ViewMode = 'login' | 'register';

export const Login: React.FC<LoginProps> = ({ onLogin, onRegister, error, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('login');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (viewMode === 'register') {
            if (password !== confirmPassword) return;
            onRegister(name, email, password);
        } else {
            onLogin(email, password);
        }
    };

    const passwordsMatch = password && password === confirmPassword;

    const renderHeader = () => {
        const titles = {
            login: 'Welcome Back',
            register: 'Register Your Organization'
        };
        const subtitles = {
            login: 'Log in to access your dashboard.',
            register: 'Create an admin account for your organization.'
        }
        return (
             <div className="text-center">
                 <button onClick={onBack} className="absolute top-3 left-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full" aria-label="Back to home">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div className="flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4v-6h2v6h-2z"></path>
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{titles[viewMode]}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {subtitles[viewMode]}
                </p>
            </div>
        );
    };

    const renderFormFields = () => {
        const isRegister = viewMode === 'register';
        const showConfirmPassword = isRegister;
        
        return (
            <>
                {isRegister && (
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Your Full Name</label>
                        <div className="mt-1">
                            <input id="name" name="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="e.g., Jane Doe" />
                        </div>
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                    <div className="mt-1">
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="you@example.com" />
                    </div>
                </div>

                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">{isRegister ? 'New Password' : 'Password'}</label>
                    <div className="mt-1">
                        <input id="password" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="••••••••" />
                    </div>
                </div>
                
                {showConfirmPassword && (
                     <div>
                        <label htmlFor="confirm-password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                        <div className="mt-1">
                            <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="••••••••" />
                        </div>
                         {confirmPassword && (
                            <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {passwordsMatch ? 'Passwords match.' : 'Passwords do not match.'}
                            </p>
                        )}
                    </div>
                )}
            </>
        );
    };

    const renderFooter = () => {
        const buttonText = {
            login: 'Log In',
            register: 'Create Account'
        };
        return (
            <>
                <div>
                    <button type="submit" disabled={viewMode === 'register' && !passwordsMatch}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {buttonText[viewMode]}
                    </button>
                </div>
                <div className="text-center text-sm">
                    {viewMode === 'login' && (
                        <p className="text-slate-500">
                            No account? <button type="button" onClick={() => setViewMode('register')} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                Register your organization
                            </button>
                        </p>
                    )}
                    {viewMode === 'register' && (
                         <button type="button" onClick={() => setViewMode('login')} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                           Already have an account? Log in
                        </button>
                    )}
                </div>
            </>
        )
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in-up relative">
                {renderHeader()}
                {error && (
                    <div role="alert" className="bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {renderFormFields()}
                    {renderFooter()}
                </form>
            </div>
        </div>
    );
};