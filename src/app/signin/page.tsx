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
    passwordConfirm: '',
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
        await pb.collection('users').authWithPassword(formData.email, formData.password);
        router.push('/dashboard');
      } else {
        if (formData.password !== formData.passwordConfirm) {
          throw new Error('Passwords do not match');
        }
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{3,4}[-\s.]?[0-9]{3,4}$/;
        if (!phoneRegex.test(formData.phone)) {
          throw new Error('Please enter a valid phone number');
        }

        const userData = {
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          name: formData.name,
          phone: formData.phone,
          emailVisibility: true,
        };

        await pb.collection('users').create(userData);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4 relative overflow-hidden">
      {/* Floating bubbles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-200/40 backdrop-blur-sm"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              opacity: 0.3
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.7, 
            ease: [0.17, 0.67, 0.83, 0.67],
            type: 'spring', 
            stiffness: 100,
            damping: 10
          }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-sm"
        >
          {/* Header with gradient */}
          <motion.div 
            className="p-8 pb-6 bg-gradient-to-r from-emerald-600 to-teal-500 text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex justify-center mb-4">
              <motion.div 
                className="p-3 bg-white/10 rounded-full"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                  backgroundColor: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']
                }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M10 10h4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
            </div>
            <motion.h1 
              className="text-3xl font-bold text-center tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              CashFlowMin
            </motion.h1>
            <motion.p 
              className="text-center text-emerald-100 mt-2 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
            </motion.p>
          </motion.div>

          {/* Form content */}
          <div className="p-8 pt-6">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-3 rounded-lg flex items-start bg-red-50 text-red-700 border border-red-200"
                >
                  <svg className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 30 : -30 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <>
                      <div className="space-y-1">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 bg-white"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 bg-white"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="user@example.com"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 bg-white"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 bg-white"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-1">
                      <label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="passwordConfirm"
                          name="passwordConfirm"
                          type="password"
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-200 bg-white"
                          value={formData.passwordConfirm}
                          onChange={handleChange}
                          required
                          minLength={8}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  <div className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 ${isLoading ? 'opacity-90 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <motion.span
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          />
                          {isLogin ? 'Signing in...' : 'Creating account...'}
                        </span>
                      ) : isLogin ? 'Sign In' : 'Sign Up'}
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline focus:outline-none"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="underline text-emerald-600 hover:text-emerald-700">Terms</a> and{' '}
              <a href="#" className="underline text-emerald-600 hover:text-emerald-700">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}