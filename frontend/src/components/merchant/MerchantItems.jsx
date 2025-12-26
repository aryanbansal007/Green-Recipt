import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, PlusCircle, Trash2, Tag, Pencil, Save, X, Search, 
  Filter, Settings, Plus, ChevronDown, Check, AlertCircle, Loader2,
  ToggleLeft, ToggleRight, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import * as api from '../../services/api';

const MerchantItems = () => {
  // ==========================================
  // STATE
  // ==========================================
  
  // Data State
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState('items'); // 'items' | 'categories'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  
  // Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Form State
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#10b981' });
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    unit: 'piece',
    isAvailable: true,
    imageUrl: '',
  });

  // ==========================================
  // DATA FETCHING
  // ==========================================
  
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        api.fetchCategories(),
        api.fetchItems(),
      ]);
      setCategories(categoriesRes.data || []);
      setItems(itemsRes.data?.items || []);
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // CATEGORY OPERATIONS
  // ==========================================
  
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        color: category.color || '#10b981',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#10b981' });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#10b981' });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      setSaving(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory._id, categoryForm);
        showToast('Category updated!');
      } else {
        await api.createCategory(categoryForm);
        showToast('Category created!');
      }
      closeCategoryModal();
      fetchData();
    } catch (err) {
      console.error('Save category error:', err);
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const itemCount = items.filter(i => i.categoryId?._id === category._id || i.categoryId === category._id).length;
    
    if (itemCount > 0) {
      const confirmMsg = `"${category.name}" has ${itemCount} items. Delete category and move items to another category?`;
      if (!window.confirm(confirmMsg)) return;
      
      // Find another category to move items to
      const otherCategory = categories.find(c => c._id !== category._id);
      if (!otherCategory) {
        showToast('Cannot delete the only category. Create another first.', 'error');
        return;
      }
      
      try {
        setSaving(true);
        await api.deleteCategory(category._id, otherCategory._id);
        showToast('Category deleted and items moved!');
        fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      if (!window.confirm(`Delete "${category.name}"?`)) return;
      
      try {
        setSaving(true);
        await api.deleteCategory(category._id);
        showToast('Category deleted!');
        fetchData();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  // ==========================================
  // ITEM OPERATIONS
  // ==========================================
  
  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        price: item.price.toString(),
        categoryId: item.categoryId?._id || item.categoryId,
        description: item.description || '',
        unit: item.unit || 'piece',
        isAvailable: item.isAvailable !== false,
        imageUrl: item.imageUrl || '',
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        price: '',
        categoryId: categories[0]?._id || '',
        description: '',
        unit: 'piece',
        isAvailable: true,
        imageUrl: '',
      });
    }
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({
      name: '',
      price: '',
      categoryId: '',
      description: '',
      unit: 'piece',
      isAvailable: true,
      imageUrl: '',
    });
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price),
      };

      if (editingItem) {
        await api.updateItem(editingItem._id, payload);
        showToast('Item updated!');
      } else {
        await api.createItem(payload);
        showToast('Item created!');
      }
      closeItemModal();
      fetchData();
    } catch (err) {
      console.error('Save item error:', err);
      showToast(err.response?.data?.message || 'Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    try {
      setSaving(true);
      await api.deleteItem(item._id, true);
      showToast('Item deleted!');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.toggleItemAvailability(item._id, !item.isAvailable);
      setItems(items.map(i => 
        i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i
      ));
      showToast(item.isAvailable ? 'Item marked unavailable' : 'Item marked available');
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  // ==========================================
  // FILTERED DATA
  // ==========================================
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (item.categoryId?._id || item.categoryId) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ==========================================
  // RENDER: LOADING STATE
  // ==========================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN UI
  // ==========================================
  
  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20 md:pb-0">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Inventory Manager</h2>
          <p className="text-slate-500 text-sm">
            {items.length} items in {categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={16} className="inline mr-2" />
          Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag size={16} className="inline mr-2" />
          Categories ({categories.length})
        </button>
      </div>

      {/* ==========================================
          ITEMS TAB
          ========================================== */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={18} />
            </div>

            {/* Add Item Button */}
            <button
              onClick={() => openItemModal()}
              disabled={categories.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <PlusCircle size={18} />
              Add Item
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-amber-700 font-medium">No categories yet</p>
              <p className="text-amber-600 text-sm">Create a category first before adding items</p>
              <button
                onClick={() => setActiveTab('categories')}
                className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600"
              >
                Go to Categories
              </button>
            </div>
          )}

          {/* Items Grid */}
          {filteredItems.length === 0 && categories.length > 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No items found</p>
              <p className="text-slate-400 text-sm">
                {searchQuery ? 'Try a different search' : 'Click "Add Item" to create your first item'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Item</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Category</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Price</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Package size={20} className="text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-700">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span 
                            className="px-2 py-1 text-xs font-bold rounded-lg"
                            style={{ 
                              backgroundColor: `${item.categoryId?.color || '#10b981'}20`,
                              color: item.categoryId?.color || '#10b981'
                            }}
                          >
                            {item.categoryId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-600">₹{item.price}</span>
                          <span className="text-xs text-slate-400 ml-1">/{item.unit}</span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.isAvailable ? (
                              <><ToggleRight size={16} /> Available</>
                            ) : (
                              <><ToggleLeft size={16} /> Unavailable</>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openItemModal(item)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredItems.map(item => (
                  <div key={item._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                            <Package size={24} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-800">{item.name}</h3>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ 
                              backgroundColor: `${item.categoryId?.color || '#10b981'}20`,
                              color: item.categoryId?.color || '#10b981'
                            }}
                          >
                            {item.categoryId?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">₹{item.price}</p>
                        <p className="text-xs text-slate-400">/{item.unit}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isAvailable ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => openItemModal(item)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ==========================================
          CATEGORIES TAB
          ========================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Add Category Button */}
          <div className="flex justify-end">
            <button
              onClick={() => openCategoryModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              <PlusCircle size={18} />
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No categories yet</p>
              <p className="text-slate-400 text-sm">Click "Add Category" to create your first category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => {
                const itemCount = items.filter(i => 
                  (i.categoryId?._id || i.categoryId) === category._id
                ).length;

                return (
                  <div
                    key={category._id}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Tag size={24} style={{ color: category.color }} />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openCategoryModal(category)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-slate-500 mb-2 line-clamp-2">{category.description}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          CATEGORY MODAL
          ========================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={closeCategoryModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Beverages"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !categoryForm.name.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          ITEM MODAL
          ========================================== */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-bold text-lg text-slate-800">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </h3>
              <button onClick={closeItemModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g., Masala Chai"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="g">Gram</option>
                    <option value="l">Liter</option>
                    <option value="ml">Milliliter</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                    <option value="plate">Plate</option>
                    <option value="cup">Cup</option>
                    <option value="glass">Glass</option>
                    <option value="serving">Serving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Brief description of the item..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-3 text-slate-400" size={18} />
                  <input
                    type="url"
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700">Available for sale</p>
                  <p className="text-xs text-slate-500">Item will appear in billing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    itemForm.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      itemForm.isAvailable ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeItemModal}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !itemForm.name.trim() || !itemForm.price || !itemForm.categoryId}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default MerchantItems;
