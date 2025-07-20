'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import pb from '../lib/pocketbase';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Sign in
        await pb.collection('users').authWithPassword(formData.email, formData.password);
        router.push('/dashboard');
      } else {
        // Validate phone number format
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(formData.phone)) {
          throw new Error('Please enter a valid phone number');
        }

        // Sign up with all user details
        const userData = {
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.password,
          name: formData.name,
          phone: formData.phone,
          emailVisibility: true, // Set based on your requirements
        };
        
        // Create the user record
        await pb.collection('users').create(userData);
        
        // Automatically log in the user
        await pb.collection('users').authWithPassword(formData.email, formData.password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden"
        >
          {/* Brand Header */}
          <div className="p-8 pb-6 bg-stone-900 text-white">
            <div className="flex justify-center mb-3">
              <div className="p-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15L8 11H16L12 15Z" fill="currentColor" className="text-amber-400"/>
                  <path d="M3 5H21V7H3V5Z" fill="currentColor" className="text-white"/>
                  <path d="M5 9H19V11H5V9Z" fill="currentColor" className="text-white"/>
                  <path d="M7 13H17V15H7V13Z" fill="currentColor" className="text-white"/>
                  <path d="M9 17H15V19H9V17Z" fill="currentColor" className="text-white"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-center tracking-wider">
              STRICTLY FORMALS
            </h1>
            <p className="text-center text-stone-300 mt-1 text-sm">
              {isLogin ? 'Sign in to your account' : 'Create your exclusive account'}
            </p>
          </div>

          {/* Form Area */}
          <div className="p-8 pt-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-lg text-sm flex items-center bg-rose-50 text-rose-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {!isLogin && (
                    <>
                      <div className="space-y-1">
                        <label htmlFor="name" className="text-sm font-medium text-stone-600">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="James Bond"
                            className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-white/90"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-sm font-medium text-stone-600">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-white/90"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-stone-600">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="client@strictlyformals.com"
                        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-white/90"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium text-stone-600">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all duration-200 bg-white/90"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-stone-600 focus:ring-stone-500 border-stone-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-600">
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-stone-600 hover:text-stone-900 hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-stone-800 hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1 transition-all duration-200 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                      </span>
                    ) : isLogin ? 'Sign In' : 'Sign Up'}
                  </motion.button>
                </motion.div>
              </AnimatePresence>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-stone-600">
                {isLogin ? "New to Strictly Formals?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-stone-900 hover:text-stone-700 hover:underline focus:outline-none"
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-stone-50 border-t border-stone-200 text-center">
            <p className="text-xs text-stone-500">
              By continuing, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}