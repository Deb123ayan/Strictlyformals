'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit } from 'lucide-react';
import pb from '../lib/pocketbase';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    email: '',
    name: '',
    phone: ''
  });

  // Fetch only the essential user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the current authenticated user data
        const user = pb.authStore.model;
        if (user) {
          setProfileData({
            email: user.email,
            name: user.name || '',
            phone: user.phone || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-stone-200 p-8"
        >
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-8">My Profile</h1>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-stone-900">{profileData.name || 'User'}</h2>
                <p className="text-stone-600">{profileData.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-lg">
                <Mail className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-sm text-stone-500">Email</p>
                  <p className="text-stone-900 font-medium">{profileData.email}</p>
                </div>
              </div>

              {profileData.name && (
                <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-lg">
                  <User className="w-5 h-5 text-stone-500" />
                  <div>
                    <p className="text-sm text-stone-500">Name</p>
                    <p className="text-stone-900 font-medium">{profileData.name}</p>
                  </div>
                </div>
              )}

              {profileData.phone && (
                <div className="flex items-center space-x-4 p-4 bg-stone-50 rounded-lg">
                  <Phone className="w-5 h-5 text-stone-500" />
                  <div>
                    <p className="text-sm text-stone-500">Phone</p>
                    <p className="text-stone-900 font-medium">{profileData.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}