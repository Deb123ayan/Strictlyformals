
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Edit, Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Address = {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    email: localStorage.getItem('userEmail') || 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+91 9876543210'
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      name: 'Home',
      line1: '123 Luxury Avenue',
      line2: 'Apartment 3B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      phone: '+91 9876543210',
      isDefault: true
    },
    {
      id: '2',
      name: 'Office',
      line1: '456 Business Tower',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
      phone: '+91 8765432109',
      isDefault: false
    }
  ]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Address form state
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    isDefault: false
  });

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // In a real app, you would save to your backend here
    localStorage.setItem('userEmail', profileData.email);
    setIsEditing(false);
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAddress = () => {
    if (currentAddress) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === currentAddress.id ? { ...addressFormData, id: currentAddress.id } : addr
      ));
    } else {
      // Add new address
      setAddresses([...addresses, { ...addressFormData, id: Date.now().toString() }]);
    }
    setShowAddressForm(false);
    setCurrentAddress(null);
    setAddressFormData({
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: '',
      isDefault: false
    });
  };

  // ... rest of your address-related functions remain the same

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header remains the same */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation remains the same, just update the email display */}
          <div className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sticky top-28">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-stone-900">Welcome</h3>
                  <p className="text-sm text-stone-600 truncate max-w-[180px]">{profileData.email}</p>
                </div>
              </div>
              {/* ... rest of sidebar */}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-serif font-bold text-stone-900">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileInputChange}
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileInputChange}
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileInputChange}
                          className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileInputChange}
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveProfile}
                        className="px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-stone-500">Email Address</p>
                      <p className="text-stone-900 font-medium">{profileData.email}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-stone-500">First Name</p>
                        <p className="text-stone-900 font-medium">{profileData.firstName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500">Last Name</p>
                        <p className="text-stone-900 font-medium">{profileData.lastName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-stone-500">Phone Number</p>
                      <p className="text-stone-900 font-medium">{profileData.phone}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses tab remains the same, just update the form handlers */}
            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* ... rest of addresses tab implementation */}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}