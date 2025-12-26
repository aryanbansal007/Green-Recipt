import React, { useState } from 'react';
import { 
  Store, MapPin, Clock, Tags, Package, ChevronRight, ChevronLeft, 
  Check, AlertCircle, Plus, X, Loader2, Building2, Phone, User,
  FileText, Trash2
} from 'lucide-react';
import * as api from '../../services/api';

// ==========================================
// BUSINESS CATEGORIES OPTIONS
// ==========================================
const BUSINESS_CATEGORIES = [
  { value: 'grocery', label: 'Grocery Store', icon: '🛒' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe / Coffee Shop', icon: '☕' },
  { value: 'bakery', label: 'Bakery', icon: '🥐' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'clothing', label: 'Clothing / Apparel', icon: '👕' },
  { value: 'pharmacy', label: 'Pharmacy / Medical', icon: '💊' },
  { value: 'hardware', label: 'Hardware Store', icon: '🔧' },
  { value: 'stationery', label: 'Stationery / Books', icon: '📚' },
  { value: 'salon', label: 'Salon / Beauty', icon: '💇' },
  { value: 'gym', label: 'Gym / Fitness', icon: '💪' },
  { value: 'general_store', label: 'General Store', icon: '🏪' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_OPERATING_HOURS = DAYS_OF_WEEK.map(day => ({
  day: day.key,
  isOpen: day.key !== 'sunday',
  openTime: '09:00',
  closeTime: '21:00',
}));

// ==========================================
// MAIN ONBOARDING WIZARD COMPONENT
// ==========================================
const MerchantOnboardingWizard = ({ onComplete, initialData = {} }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Business Info
    shopName: initialData.shopName || '',
    businessCategory: initialData.businessCategory || '',
    businessDescription: initialData.businessDescription || '',
    ownerName: initialData.ownerName || '',
    phone: initialData.phone || '',
    addressLine: initialData.addressLine || '',
    // Step 2: Operating Hours
    operatingHours: initialData.operatingHours?.length ? initialData.operatingHours : DEFAULT_OPERATING_HOURS,
    // Step 3: Categories
    categories: [],
    // Step 4: Items
    items: [],
  });

  const totalSteps = 5;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // ==========================================
  // STEP 1: BUSINESS INFORMATION
  // ==========================================
  const renderBusinessInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Business Information</h2>
        <p className="text-slate-500 mt-2">Tell us about your business</p>
      </div>

      <div className="space-y-4">
        {/* Shop Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Shop/Business Name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={formData.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              placeholder="e.g., Green Grocery Store"
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              required
            />
          </div>
        </div>

        {/* Business Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Business Category *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => updateField('businessCategory', cat.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  formData.businessCategory === cat.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-xl mb-1 block">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Owner Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              placeholder="Your name"
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Contact Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Business Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              value={formData.addressLine}
              onChange={(e) => updateField('addressLine', e.target.value)}
              placeholder="Street address, City, State"
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Business Description
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <textarea
              value={formData.businessDescription}
              onChange={(e) => updateField('businessDescription', e.target.value)}
              placeholder="Brief description of your business..."
              rows={3}
              maxLength={500}
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1 text-right">
            {formData.businessDescription.length}/500
          </p>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // STEP 2: OPERATING HOURS
  // ==========================================
  const renderOperatingHoursStep = () => {
    const updateHours = (dayKey, field, value) => {
      const newHours = formData.operatingHours.map(h => 
        h.day === dayKey ? { ...h, [field]: value } : h
      );
      updateField('operatingHours', newHours);
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Operating Hours</h2>
          <p className="text-slate-500 mt-2">When is your business open?</p>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const hours = formData.operatingHours.find(h => h.day === day.key) || {
              day: day.key,
              isOpen: true,
              openTime: '09:00',
              closeTime: '21:00',
            };

            return (
              <div
                key={day.key}
                className={`p-4 rounded-xl border-2 transition-all ${
                  hours.isOpen ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateHours(day.key, 'isOpen', !hours.isOpen)}
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        hours.isOpen ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          hours.isOpen ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                    <span className={`font-medium ${hours.isOpen ? 'text-slate-800' : 'text-slate-400'}`}>
                      {day.label}
                    </span>
                  </div>

                  {hours.isOpen && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.openTime}
                        onChange={(e) => updateHours(day.key, 'openTime', e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={hours.closeTime}
                        onChange={(e) => updateHours(day.key, 'closeTime', e.target.value)}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  )}

                  {!hours.isOpen && (
                    <span className="text-sm text-slate-400">Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==========================================
  // STEP 3: CATEGORIES
  // ==========================================
  const renderCategoriesStep = () => {
    const [newCategory, setNewCategory] = useState('');

    const addCategory = () => {
      const trimmed = newCategory.trim();
      if (!trimmed) return;
      if (formData.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
        setError('Category already exists');
        return;
      }
      updateField('categories', [...formData.categories, { name: trimmed }]);
      setNewCategory('');
    };

    const removeCategory = (index) => {
      updateField('categories', formData.categories.filter((_, i) => i !== index));
    };

    const suggestedCategories = {
      grocery: ['Fruits', 'Vegetables', 'Dairy', 'Beverages', 'Snacks', 'Grains'],
      restaurant: ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Combos'],
      cafe: ['Coffee', 'Tea', 'Snacks', 'Sandwiches', 'Desserts', 'Smoothies'],
      bakery: ['Breads', 'Cakes', 'Pastries', 'Cookies', 'Savory'],
      general_store: ['Food', 'Drinks', 'Snacks', 'Household', 'Personal Care'],
    };

    const suggestions = suggestedCategories[formData.businessCategory] || 
      ['Products', 'Services', 'Specials', 'Popular', 'New Arrivals'];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tags className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Categories</h2>
          <p className="text-slate-500 mt-2">Organize your products into categories</p>
        </div>

        {/* Quick Suggestions */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">Quick Add:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug) => {
              const isAdded = formData.categories.some(c => c.name.toLowerCase() === sug.toLowerCase());
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={isAdded}
                  onClick={() => updateField('categories', [...formData.categories, { name: sug }])}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isAdded
                      ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAdded ? <Check size={14} className="inline mr-1" /> : <Plus size={14} className="inline mr-1" />}
                  {sug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Add Custom Category
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tags className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={newCategory}
                onChange={(e) => { setNewCategory(e.target.value); setError(''); }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                placeholder="Category name..."
                className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                maxLength={50}
              />
            </div>
            <button
              type="button"
              onClick={addCategory}
              disabled={!newCategory.trim()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add
            </button>
          </div>
        </div>

        {/* Category List */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            Your Categories ({formData.categories.length})
          </p>
          {formData.categories.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Tags className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">No categories added yet</p>
              <p className="text-sm text-slate-400">Add at least one category to continue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.categories.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // STEP 4: ITEMS
  // ==========================================
  const renderItemsStep = () => {
    const [newItem, setNewItem] = useState({ name: '', price: '', categoryName: '' });

    const addItem = () => {
      if (!newItem.name.trim() || !newItem.price || !newItem.categoryName) {
        setError('Please fill all item fields');
        return;
      }
      updateField('items', [...formData.items, {
        name: newItem.name.trim(),
        price: parseFloat(newItem.price),
        categoryName: newItem.categoryName,
      }]);
      setNewItem({ name: '', price: '', categoryName: '' });
      setError('');
    };

    const removeItem = (index) => {
      updateField('items', formData.items.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Add Your Items</h2>
          <p className="text-slate-500 mt-2">Add some products to your inventory</p>
        </div>

        {/* Add Item Form */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Item name"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="sm:col-span-1">
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="sm:col-span-1">
              <select
                value={newItem.categoryName}
                onChange={(e) => setNewItem({ ...newItem, categoryName: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select Category</option>
                {formData.categories.map((cat, i) => (
                  <option key={i} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!newItem.name.trim() || !newItem.price || !newItem.categoryName}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>

        {/* Items List */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            Your Items ({formData.items.length})
          </p>
          {formData.items.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">No items added yet</p>
              <p className="text-sm text-slate-400">Add at least one item to continue</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-600 font-bold">₹{item.price}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {item.categoryName}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // STEP 5: SUCCESS/REVIEW
  // ==========================================
  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">You're All Set! 🎉</h2>
      <p className="text-slate-500 mb-8">
        Your business profile is complete. You can now start using GreenReceipt!
      </p>

      <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Store className="text-emerald-600" size={20} />
          <div>
            <p className="text-xs text-slate-400">Business</p>
            <p className="font-medium text-slate-700">{formData.shopName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tags className="text-emerald-600" size={20} />
          <div>
            <p className="text-xs text-slate-400">Categories</p>
            <p className="font-medium text-slate-700">{formData.categories.length} categories created</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Package className="text-emerald-600" size={20} />
          <div>
            <p className="text-xs text-slate-400">Items</p>
            <p className="font-medium text-slate-700">{formData.items.length} items added</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // NAVIGATION & SUBMISSION
  // ==========================================
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.shopName.trim()) return 'Shop name is required';
        if (!formData.businessCategory) return 'Please select a business category';
        return null;
      case 2:
        return null; // Operating hours are optional
      case 3:
        if (formData.categories.length === 0) return 'Please add at least one category';
        return null;
      case 4:
        if (formData.items.length === 0) return 'Please add at least one item';
        return null;
      default:
        return null;
    }
  };

  const handleNext = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save data to backend at each step
      switch (step) {
        case 1:
          await api.saveBusinessInfo({
            shopName: formData.shopName,
            businessCategory: formData.businessCategory,
            businessDescription: formData.businessDescription,
            ownerName: formData.ownerName,
            phone: formData.phone,
            addressLine: formData.addressLine,
          });
          break;
        case 2:
          await api.saveOperatingHours({ operatingHours: formData.operatingHours });
          break;
        case 3:
          await api.saveOnboardingCategories({ categories: formData.categories });
          break;
        case 4:
          await api.saveOnboardingItems({ items: formData.items });
          break;
      }

      if (step < totalSteps) {
        setStep(step + 1);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      await api.completeOnboarding();
      localStorage.setItem('isProfileComplete', 'true');
      onComplete?.();
    } catch (err) {
      console.error('Complete error:', err);
      setError(err.response?.data?.message || 'Failed to complete setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!window.confirm('Skip setup? Default values will be used. You can update them later in settings.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.skipOnboarding();
      localStorage.setItem('isProfileComplete', 'true');
      onComplete?.();
    } catch (err) {
      console.error('Skip error:', err);
      setError(err.response?.data?.message || 'Failed to skip setup.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  const renderStep = () => {
    switch (step) {
      case 1: return renderBusinessInfoStep();
      case 2: return renderOperatingHoursStep();
      case 3: return renderCategoriesStep();
      case 4: return renderItemsStep();
      case 5: return renderSuccessStep();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Step {step} of {totalSteps - 1}</span>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Skip Setup
              </button>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${((step) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}

            {step === 1 && <div />}

            {step < 5 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Go to Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantOnboardingWizard;
