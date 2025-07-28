'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import pb from '../lib/pocketbase';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    to: '',
    phone: '',
    amount: '',
    date: '',
    category: '',
  });
  const [formError, setFormError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch authenticated user and expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        if (!pb.authStore.isValid || !pb.authStore.model) {
          router.push('/auth');
          return;
        }
        const currentUser = pb.authStore.model;
        setUser(currentUser);

        const records = await pb.collection('expenses').getList(1, 50, {
          filter: `user = "${currentUser.id}"`,
          sort: '-date', // Ensure correct sort syntax for PocketBase
          requestKey: null, // Avoid custom requestKey to prevent potential conflicts
        });
        setExpenses(records.items || []);
        setError(''); // Clear any previous errors
      } catch (err) {
        if (err.isAbort) return;
        console.error('Error fetching expenses:', {
          message: err.message,
          status: err.status,
          data: err.data,
        });
        // Set empty array and user-friendly message instead of throwing error
        setExpenses([]);
        setError('Unable to load expenses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, [router]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle adding new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const { to, phone, amount, date, category } = formData;
      if (!to || !phone || !amount || !date || !category) {
        throw new Error('All fields are required.');
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        throw new Error('Amount must be a valid number.');
      }
      
      const formattedDate = new Date(date).toISOString();
      const newExpense = await pb.collection('expenses').create(
        {
          user: user?.id,
          to,
          phone,
          amount: parsedAmount,
          date: formattedDate,
          category,
        },
        { requestKey: null } // Avoid custom requestKey
      );
      setExpenses((prev) => [newExpense, ...prev]);
      setFormData({ to: '', phone: '', amount: '', date: '', category: '' });
      setShowAddModal(false);
    } catch (err) {
      if (err.isAbort) return;
      console.error('Error adding expense:', err);
      setFormError(err.message || 'Failed to add expense.');
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (id) => {
    try {
      await pb.collection('expenses').delete(id, { requestKey: null });
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (err) {
      if (err.isAbort) return;
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
    }
  };

  // Prepare chart data for expenses by category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});
  
  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        data: Object.values(categoryTotals),
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
        borderColor: ['#059669', '#2563EB', '#D97706'],
        borderWidth: 1,
      },
    ],
  };

  // Loading state
  if (isLoading) {
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
              onClick={() => router.push('/dashboard')}
              className="py-2 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm sm:text-base transition-colors"
            >
              Dashboard
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

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Add New Expense</h2>
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm"
                >
                  {formError}
                </motion.div>
              )}
              <form onSubmit={handleAddExpense} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">To</label>
                  <input
                    type="text"
                    name="to"
                    value={formData.to}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    aria-label="Recipient"
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
                    aria-label="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    step="0.01"
                    aria-label="Expense amount"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Date</label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    aria-label="Expense date"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    aria-label="Expense category"
                  >
                    <option value="" disabled>Select Category</option>
                    <option value="Needs">Needs</option>
                    <option value="Wants">Wants</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#059669' }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium transition-colors"
                    aria-label="Add expense"
                  >
                    Add Expense
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: '#B91C1C' }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium transition-colors"
                    aria-label="Cancel"
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
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <div className="ml-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Expense Tracker</h1>
                <p className="text-gray-300 text-sm mt-1">Manage your expenses efficiently</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#059669' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="py-2 px-4 rounded-lg bg-emerald-600 text-white font-medium text-sm sm:text-base transition-colors"
              aria-label="Add new expense"
            >
              Add Expense
            </motion.button>
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
            {/* Expense Table */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-gray-700/60 rounded-2xl p-6 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Recent Expenses</h2>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-400 mt-4">No expenses found. Add one to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-gray-200">
                    <thead>
                      <tr className="border-b border-gray-600/30">
                        <th className="py-3 px-4 font-medium">To</th>
                        <th className="py-3 px-4 font-medium">Phone</th>
                        <th className="py-3 px-4 font-medium">Amount</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium">Category</th>
                        <th className="py-3 px-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <motion.tr
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-b border-gray-600/20 hover:bg-gray-600/20"
                        >
                          <td className="py-3 px-4">{expense.to}</td>
                          <td className="py-3 px-4">{expense.phone}</td>
                          <td className="py-3 px-4 text-green-400">${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4">{new Date(expense.date).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              expense.category === 'Needs' ? 'bg-emerald-500/20 text-emerald-400' :
                              expense.category === 'Wants' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <motion.button
                              whileHover={{ scale: 1.05, backgroundColor: '#B91C1C' }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="py-1 px-3 rounded-lg bg-red-600 text-white text-sm font-medium transition-colors"
                              aria-label={`Delete expense to ${expense.to}`}
                            >
                              Delete
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Expense Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-1 bg-gray-700/60 rounded-2xl p-6 border border-gray-600/50 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center mb-6">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1" />
                  </svg>
                </div>
                <h2 className="ml-3 text-lg sm:text-xl font-semibold text-white">Expense Distribution</h2>
              </div>
              <div className="w-full max-w-[16rem] sm:max-w-[18rem] mx-auto h-64 sm:h-72">
                {expenses.length > 0 ? (
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
                            font: { family: 'Inter', size: 12 },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#4b5563',
                          borderWidth: 1,
                          padding: 12,
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                          }
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-400 mt-4">No data to display</p>
                  </div>
                )}
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