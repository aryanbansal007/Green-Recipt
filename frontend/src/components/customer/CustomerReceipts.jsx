import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_RECEIPTS } from './customerData';
import ReceiptCard from './ReceiptCard';
import { Search, Filter, Inbox, Receipt, QrCode, Upload, X, ChevronDown, Check, Smartphone, Banknote, CreditCard, SlidersHorizontal, ArrowUpDown, Calendar } from 'lucide-react';
import { fetchCustomerReceipts } from '../../services/api';

// ============== SKELETON LOADER ==============
const ReceiptsSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-14 bg-slate-200 rounded-2xl" />
    <div className="flex gap-2">
      {[1, 2, 3].map(i => <div key={i} className="h-9 bg-slate-200 rounded-lg flex-1" />)}
    </div>
    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
  </div>
);

const CustomerReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from backend, fall back to cached/mocks if it fails.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await fetchCustomerReceipts();
        const receiptsData = data.receipts || data || [];
        if (mounted) {
          setReceipts(receiptsData);
          localStorage.setItem('customerReceipts', JSON.stringify(receiptsData));
          setLoading(false);
        }
      } catch (error) {
        const saved = localStorage.getItem('customerReceipts');
        const fallback = saved ? JSON.parse(saved) : MOCK_RECEIPTS;
        if (mounted) {
          setReceipts(fallback);
          setLoading(false);
        }
      }
    };
    load();

    const handleUpdate = () => load();
    window.addEventListener('customer-receipts-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('customer-receipts-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-save changes
  useEffect(() => {
    if (receipts?.length) {
      localStorage.setItem('customerReceipts', JSON.stringify(receipts));
    }
  }, [receipts]);

  // UI State
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showFilters, setShowFilters] = useState(false);

  // CRUD ACTIONS
  const handleDelete = (id) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdate = (updatedReceipt) => {
    setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    let result = receipts.filter(r => {
      const matchesType = filter === 'all' || r.type === filter;
      const matchesSearch = r.merchant?.toLowerCase().includes(search.toLowerCase());
      const matchesPayment = paymentFilter === 'all' || r.paymentMethod === paymentFilter;
      return matchesType && matchesSearch && matchesPayment;
    });

    // Sort
    if (sortBy === 'date') {
      result = result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'amount') {
      result = result.sort((a, b) => b.amount - a.amount);
    }

    return result;
  }, [receipts, filter, search, paymentFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);
    const digital = filtered.filter(r => r.type === 'qr').length;
    const uploaded = filtered.filter(r => r.type === 'upload').length;
    return { total, digital, uploaded, count: filtered.length };
  }, [filtered]);

  if (loading) return <ReceiptsSkeleton />;

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-5 pb-24 md:pb-10">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">All Receipts</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">{stats.count} receipts • ₹{stats.total.toLocaleString('en-IN')} total</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 md:p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* ========== SEARCH & FILTERS ========== */}
      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input 
            type="text" 
            placeholder="Search by merchant name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full">
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>
        
        {/* Type Filter Tabs */}
        <div className="flex gap-1.5 md:gap-2 bg-slate-100 p-1 md:p-1.5 rounded-lg md:rounded-xl">
          {[
            { id: 'all', label: 'All', icon: Receipt, count: receipts.length },
            { id: 'qr', label: 'Digital', icon: QrCode, count: receipts.filter(r => r.type === 'qr').length },
            { id: 'upload', label: 'Uploaded', icon: Upload, count: receipts.filter(r => r.type === 'upload').length },
          ].map(type => (
            <button 
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`flex-1 py-2 md:py-2.5 px-2 md:px-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                filter === type.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <type.icon size={14} className="hidden sm:block" />
              <span>{type.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === type.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}>{type.count}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
            {/* Payment Method */}
            <div>
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2 block">Payment Method</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', icon: null },
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                ].map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentFilter(pm.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      paymentFilter === pm.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pm.icon && <pm.icon size={12} />}
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-2 block">Sort By</label>
              <div className="flex gap-2">
                {[
                  { id: 'date', label: 'Latest First', icon: Calendar },
                  { id: 'amount', label: 'Highest Amount', icon: ArrowUpDown },
                ].map(sort => (
                  <button
                    key={sort.id}
                    onClick={() => setSortBy(sort.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      sortBy === sort.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <sort.icon size={12} />
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== QUICK STATS ========== */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-100 text-center">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Total</p>
          <p className="text-base md:text-xl font-bold text-slate-800 mt-1">₹{stats.total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-50 p-3 md:p-4 rounded-xl border border-emerald-100 text-center">
          <p className="text-[10px] md:text-xs font-semibold text-emerald-600 uppercase">Digital</p>
          <p className="text-base md:text-xl font-bold text-emerald-700 mt-1">{stats.digital}</p>
        </div>
        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 text-center">
          <p className="text-[10px] md:text-xs font-semibold text-blue-600 uppercase">Uploaded</p>
          <p className="text-base md:text-xl font-bold text-blue-700 mt-1">{stats.uploaded}</p>
        </div>
      </div>

      {/* ========== RECEIPTS LIST ========== */}
      <div className="space-y-2 md:space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={28} className="text-slate-300 md:w-8 md:h-8" />
            </div>
            <p className="font-semibold text-slate-600 mb-1">No receipts found</p>
            <p className="text-sm text-slate-400">Try adjusting your filters or search</p>
            {(search || filter !== 'all' || paymentFilter !== 'all') && (
              <button 
                onClick={() => { setSearch(''); setFilter('all'); setPaymentFilter('all'); }}
                className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filtered.map(r => (
            <ReceiptCard 
              key={r.id}
              data={r} 
              onDelete={() => handleDelete(r.id)} 
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CustomerReceipts;