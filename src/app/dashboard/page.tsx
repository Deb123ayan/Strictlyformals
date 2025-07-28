'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import pb from '../lib/pocketbase';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    balance: '',
    salary: ''
  });
  const [formError, setFormError] = useState('');
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!pb.authStore.isValid) {
          router.push('/auth');
          return;
        }
        const user = pb.authStore.model;
        const records = await pb.collection('Balance').getList(1, 1, {
          filter: `email = "${user.email}"`,
          requestKey: `balance_${Date.now()}`
        });
        if (records.items.length > 0) {
          const data = records.items[0];
          setUserData({
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            balance: data.balance,
            salary: data.salary || 0
          });
        } else {
          setShowSignupModal(true);
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      } catch (err) {
        if (err.isAbort) return;
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again.');
      }
    };
    fetchUserData();
  }, [router]);

  // Chart data
  const chartData = {
    labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
    datasets: [
      {
        data: userData ? [
          (userData.salary * 0.5).toFixed(2),
          (userData.salary * 0.3).toFixed(2),
          (userData.salary * 0.2).toFixed(2)
        ] : [5000, 3000, 2000],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
        borderColor: ['#059669', '#2563EB', '#D97706'],
        borderWidth: 1,
      },
    ],
  };

  // Handle signup form submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const { name, email, phone, balance, salary } = formData;
      if (!name || !email || !phone || !balance || !salary) {
        throw new Error('All fields are required.');
      }
      if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
        throw new Error('Balance must be a valid number.');
      }
      if (isNaN(parseFloat(salary)) || parseFloat(salary) < 0) {
        throw new Error('Salary must be a valid number.');
      }
      const newRecord = await pb.collection('Balance').create({
        name,
        email,
        phone,
        balance: parseFloat(balance),
        salary: parseFloat(salary)
      }, { requestKey: `create_balance_${Date.now()}` });
      setUserData({
        id: newRecord.id,
        name: newRecord.name,
        email: newRecord.email,
        phone: newRecord.phone,
        balance: newRecord.balance,
        salary: newRecord.salary
      });
      setShowSignupModal(false);
      setFormData({ name: '', email: '', phone: '', balance: '', salary: '' });
    } catch (err) {
      if (err.isAbort) return;
      console.error('Error creating balance record:', err);
      setFormError(err.message || 'Failed to save profile.');
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const { name, email, phone, balance, salary } = formData;
      if (!name || !email || !phone || !balance || !salary) {
        throw new Error('All fields are required.');
      }
      if (isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
        throw new Error('Balance must be a valid number.');
      }
      if (isNaN(parseFloat(salary)) || parseFloat(salary) < 0) {
        throw new Error('Salary must be a valid number.');
      }
      const updatedRecord = await pb.collection('Balance').update(userData.id, {
        name,
        email,
        phone,
        balance: parseFloat(balance),
        salary: parseFloat(salary)
      }, { requestKey: `update_balance_${Date.now()}` });
      setUserData({
        id: updatedRecord.id,
        name: updatedRecord.name,
        email: updatedRecord.email,
        phone: updatedRecord.phone,
        balance: updatedRecord.balance,
        salary: updatedRecord.salary
      });
      setShowEditModal(false);
      setFormData({ name: '', email: '', phone: '', balance: '', salary: '' });
    } catch (err) {
      if (err.isAbort) return;
      console.error('Error updating balance record:', err);
      setFormError(err.message || 'Failed to update profile.');
    }
  };

  // Open edit modal
  const openEditModal = () => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      balance: userData.balance.toString(),
      salary: userData.salary.toString()
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Loading state
  if (!userData && !error && !showSignupModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-gray-900 to-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-16 h-16 border-4 border-t-amber-400 border-gray-600 rounded-full"
        ></motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-gray-900 to-gray-800 p-4 sm:p-6 md:p-8 relative overflow-hidden flex flex-col">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 sm:left-20"
          animate={{ y: [-30, 30], x: [0, 15], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        >
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
          </svg>
        </motion.div>
        <motion.div
          className="absolute bottom-40 right-10 sm:right-20"
          animate={{ y: [0, -40], scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        >
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </motion.div>
      </div>

      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M10 10h4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h1 className="ml-3 text-lg sm:text-xl font-bold text-white">CashFlowMin</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#059669' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/expense')}
              className="py-2 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm sm:text-base transition-colors"
            >
              Track Expense
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#2563EB' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/ask-ai')}
              className="py-2 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm sm:text-base transition-colors"
            >
              Ask AI
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#B91C1C' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                pb.authStore.clear();
                router.push('/signin');
              }}
              className="py-2 px-4 rounded-lg bg-red-600 text-white font-medium text-sm sm:text-base transition-colors"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Signup Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="bg-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-gray-700 shadow-2xl"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Complete Your Profile</h2>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm"
                >
                  {formError}
                </motion.div>
              )}
              <form onSubmit={handleSignupSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#059669' }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium transition-colors"
                  >
                    Save Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#B91C1C' }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      pb.authStore.clear();
                      router.push('/auth');
                    }}
                    className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="bg-gray-800 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-gray-700 shadow-2xl"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Edit Profile</h2>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm"
                >
                  {formError}
                </motion.div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#059669' }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium transition-colors"
                  >
                    Update Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#B91C1C' }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto pt-16 sm:pt-20 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
          className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M10 10h4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <div className="ml-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">CashFlowMin Dashboard</h1>
                <p className="text-gray-300 text-sm mt-1">Your personal finance hub</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, x: [-5, 5, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="mb-6 p-4 rounded-lg bg-red-500/20 text-red-400 text-sm shadow-md"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </motion.div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* User Profile */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1 bg-gray-700/60 rounded-2xl p-6 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-amber-500/10 p-3 rounded-full">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-lg sm:text-xl font-semibold text-white">Your Profile</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#B45309' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openEditModal}
                  className="py-2 px-4 rounded-lg bg-amber-600 text-white text-sm font-medium transition-colors"
                >
                  Edit Profile
                </motion.button>
              </div>
              <div className="space-y-4 text-gray-200">
                <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                  <span className="font-medium">Name:</span>
                  <span className="font-light">{userData?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                  <span className="font-medium">Email:</span>
                  <span className="text-blue-400 font-light">{userData?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                  <span className="font-medium">Phone:</span>
                  <span className="font-light">{userData?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-600/30 pb-3">
                  <span className="font-medium">Balance:</span>
                  <span className="text-green-400 font-medium">${userData?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Salary:</span>
                  <span className="text-amber-400 font-medium">${userData?.salary?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>
              </div>
            </motion.div>

            {/* Salary Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-gray-700/60 rounded-2xl p-6 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="ml-3 text-lg sm:text-xl font-semibold text-white">Salary Distribution (50/30/20)</h2>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="w-full max-w-[16rem] sm:max-w-[18rem] md:max-w-[20rem] h-64 sm:h-72">
                  <Pie
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'white',
                            font: { family: 'Inter', size: 12 }
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#4b5563',
                          borderWidth: 1,
                          padding: 12
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex-1 space-y-5">
                  <div className="bg-gray-600/30 rounded-lg p-5 shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 mr-3"></div>
                        <span className="text-gray-200 font-medium">Needs</span>
                      </div>
                      <span className="font-semibold text-white">${userData ? (userData.salary * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '5,000.00'} <span className="text-gray-400 text-sm">(50%)</span></span>
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-3">
                      <motion.div
                        className="bg-emerald-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '50%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="bg-gray-600/30 rounded-lg p-5 shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-gray-200 font-medium">Wants</span>
                      </div>
                      <span className="font-semibold text-white">${userData ? (userData.salary * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '3,000.00'} <span className="text-gray-400 text-sm">(30%)</span></span>
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-3">
                      <motion.div
                        className="bg-blue-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '30%' }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="bg-gray-600/30 rounded-lg p-5 shadow-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-amber-500 mr-3"></div>
                        <span className="text-gray-200 font-medium">Savings</span>
                      </div>
                      <span className="font-semibold text-white">${userData ? (userData.salary * 0.2).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '2,000.00'} <span className="text-gray-400 text-sm">(20%)</span></span>
                    </div>
                    <div className="w-full bg-gray-500 rounded-full h-3">
                      <motion.div
                        className="bg-amber-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '20%' }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-8 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50 py-6 sm:py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M10 10h4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ml-3 text-lg font-semibold text-white">CashFlowMin</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="/about" className="text-gray-300 hover:text-amber-400 text-sm sm:text-base transition-colors">About</a>
            <a href="/contact" className="text-gray-300 hover:text-amber-400 text-sm sm:text-base transition-colors">Contact</a>
            <a href="/privacy" className="text-gray-300 hover:text-amber-400 text-sm sm:text-base transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-gray-300 hover:text-amber-400 text-sm sm:text-base transition-colors">Terms of Service</a>
          </div>
          <p className="text-gray-400 text-sm text-center sm:text-right">© {new Date().getFullYear()} CashFlowMin. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}