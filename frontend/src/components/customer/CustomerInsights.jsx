import React, { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Coffee, Target, Wallet, Sparkles, Leaf } from 'lucide-react';

const CustomerInsights = () => {
   // NOTE: These are lightweight, static mock metrics to keep the UI responsive.
   const totals = useMemo(() => ({
      monthSpend: 4250,
      monthChangePct: -12,
      avgPerDay: 142,
      receipts: 18,
   }), []);

   const categories = useMemo(() => ([
      { icon: Coffee, label: 'Food & Drinks', value: 2100, color: 'text-orange-500', bar: 'bg-orange-200' },
      { icon: ShoppingBag, label: 'Shopping', value: 1450, color: 'text-blue-500', bar: 'bg-blue-200' },
      { icon: Leaf, label: 'Health & Essentials', value: 430, color: 'text-emerald-500', bar: 'bg-emerald-200' },
   ]), []);

   const suggestions = useMemo(() => ([
      { icon: Target, title: 'Set a grocery cap', desc: 'Lock a ₹1,500 weekly limit; roll over unused to next week.' },
      { icon: Wallet, title: 'Round-up saves', desc: 'Auto-park spare change from every QR payment into savings.' },
      { icon: Sparkles, title: 'Smart reminders', desc: 'Get nudges when daily spend crosses your average +20% threshold.' },
      { icon: Leaf, title: 'Sustainable picks', desc: 'Prefer reusable packaging merchants; earn a green badge in your stats.' },
   ]), []);

   return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
         <h2 className="text-2xl font-bold text-slate-800">Monthly Insights</h2>

         {/* Top Card */}
         <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
             <div className="p-3 bg-white rounded-full text-emerald-600 shadow-sm">
                  <TrendingUp size={24} />
             </div>
             <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Total Spent</p>
                  <h3 className="text-3xl font-bold text-emerald-900">₹{totals.monthSpend.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-emerald-700 mt-1">You spent {Math.abs(totals.monthChangePct)}% {totals.monthChangePct < 0 ? 'less' : 'more'} than last month.</p>
             </div>
             <div className="text-right text-sm font-bold text-emerald-700">
                  <p className="text-slate-500 text-[11px] uppercase tracking-wide">Avg / day</p>
                  <p className="text-lg text-slate-800">₹{totals.avgPerDay}</p>
                  <p className="text-[11px] text-slate-500">{totals.receipts} receipts</p>
             </div>
         </div>

         {/* Categories */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
             <h3 className="font-bold text-slate-700">Top Spending Categories</h3>
             <div className="space-y-3">
                  {categories.map((cat, idx) => {
                     const Icon = cat.icon;
                     const pct = Math.round((cat.value / totals.monthSpend) * 100);
                     return (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <Icon className={cat.color} size={20} />
                                 <span className="font-bold text-slate-700">{cat.label}</span>
                              </div>
                              <span className="font-bold text-slate-800">₹{cat.value}</span>
                           </div>
                           <div className="mt-2 h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
                              <div className={`h-full ${cat.bar}`} style={{ width: `${pct}%` }}></div>
                           </div>
                           <p className="text-[11px] text-slate-500 mt-1">{pct}% of this month</p>
                        </div>
                     );
                  })}
             </div>
         </div>

         {/* Suggestions */}
         <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-700">Smart Suggestions</h3>
            <div className="grid gap-3">
               {suggestions.map((tip, i) => {
                  const Icon = tip.icon;
                  return (
                     <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex gap-3 items-start">
                        <div className="p-2 rounded-lg bg-white text-emerald-600 shadow-sm">
                           <Icon size={16} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{tip.title}</p>
                           <p className="text-xs text-slate-500 mt-0.5 leading-snug">{tip.desc}</p>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
};

export default CustomerInsights;