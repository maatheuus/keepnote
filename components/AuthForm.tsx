import React, { useState } from 'react';
import { LockKey, ShieldCheck, Sun, Moon, WarningCircle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthFormProps {
  onLogin: (u: string, p: string) => void;
  onRegister: (u: string, p: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  error?: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister, theme, toggleTheme, error }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    if (isLogin) {
      onLogin(username, password);
    } else {
      onRegister(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink transition-colors p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
         <div className="absolute top-10 left-10 w-64 h-64 bg-marker rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-64 h-64 bg-alert rounded-full blur-3xl"></div>
      </div>

      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#2a2628] rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-marker rounded-2xl flex items-center justify-center mb-4 text-ink shadow-lg">
            <LockKey size={32} weight="fill" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-ink dark:text-paper">Fortress Notes</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
            {isLogin ? "Unlock your encrypted vault" : "Create a secure vault"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2"
              >
                <WarningCircle size={18} weight="fill" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-marker outline-none transition-all"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-marker outline-none transition-all"
              placeholder="Enter your password"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used to encrypt your data. Do not lose it.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-ink dark:bg-paper text-paper dark:text-ink font-bold rounded-lg hover:opacity-90 transition-all transform active:scale-95 shadow-lg"
          >
            {isLogin ? "Unlock Vault" : "Create Vault"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-marker transition-colors underline"
          >
            {isLogin ? "Need a vault? Create one" : "Have a vault? Unlock it"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-xs text-gray-400">
           <ShieldCheck size={16} className="text-green-500" />
           <span>Client-side AES Encryption</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
