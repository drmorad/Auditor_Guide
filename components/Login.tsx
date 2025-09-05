import React, { useState } from 'react';

interface LoginProps {
    onLogin: (email: string, password: string) => boolean;
    onActivate: (email: string, code: string, password: string) => boolean;
    onRegister: (name: string, email: string, password: string) => boolean;
    error: string | null;
}

type ViewMode = 'login' | 'activate' | 'register';

export const Login: React.FC<LoginProps> = ({ onLogin, onActivate, onRegister, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('login');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (viewMode === 'register') {
            if (password !== confirmPassword) return;
            onRegister(name, email, password);
        } else if (viewMode === 'activate') {
            if (password !== confirmPassword) return;
            onActivate(email, verificationCode, password);
        } else {
            onLogin(email, password);
        }
    };

    const passwordsMatch = password && password === confirmPassword;

    const renderHeader = () => {
        const titles = {
            login: 'Smart Compliance Hub',
            activate: 'Activate Your Account',
            register: 'Register Your Organization'
        };
        return (
             <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4v-6h2v6h-2z"></path>
                    </svg>
                    <h1 className="text-4xl font-bold ml-3 text-slate-800 dark:text-white">Auditors Guide</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    {titles[viewMode]}
                </p>
            </div>
        );
    };

    const renderFormFields = () => {
        const isRegister = viewMode === 'register';
        const isActivate = viewMode === 'activate';
        const showConfirmPassword = isRegister || isActivate;
        
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

                {isActivate && (
                     <div>
                        <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verification Code</label>
                        <div className="mt-1">
                            <input id="code" name="code" type="text" required value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" placeholder="6-digit code from your admin" />
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">{isRegister || isActivate ? 'New Password' : 'Password'}</label>
                    <div className="mt-1">
                        <input id="password" name="password" type="password" autoComplete={isRegister || isActivate ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)}
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
            activate: 'Activate Account',
            register: 'Create Account'
        };
        return (
            <>
                <div>
                    <button type="submit" disabled={(viewMode === 'activate' || viewMode === 'register') && !passwordsMatch}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {buttonText[viewMode]}
                    </button>
                </div>
                <div className="text-center text-sm">
                    {viewMode === 'login' && (
                        <>
                            <button onClick={() => setViewMode('activate')} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                First time? Activate your account
                            </button>
                            <p className="mt-2 text-slate-500">
                                No account? <button onClick={() => setViewMode('register')} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                                    Register your organization
                                </button>
                            </p>
                        </>
                    )}
                    {(viewMode === 'activate' || viewMode === 'register') && (
                         <button onClick={() => setViewMode('login')} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                           Already have an account? Log in
                        </button>
                    )}
                </div>
            </>
        )
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in-up">
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