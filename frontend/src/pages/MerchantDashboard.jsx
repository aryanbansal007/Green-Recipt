// import React, { useState, useEffect } from 'react';
// import { Menu } from 'lucide-react';
// import api from '../services/api';

// // Import Components
// import MerchantSidebar from '../components/merchant/MerchantSidebar'; 
// import MerchantOverview from '../components/merchant/MerchantOverview';
// import MerchantCalendar from '../components/merchant/MerchantCalendar';
// import MerchantBilling from '../components/merchant/MerchantBilling';
// import MerchantItems from '../components/merchant/MerchantItems';
// import MerchantInsights from '../components/merchant/MerchantInsights';
// import MerchantProfile from '../components/merchant/MerchantProfile';
// import BottomNav from '../merchant/BottomNav';

// const MerchantDashboard = () => {
//   // 🧭 State
//   const [activeTab, setActiveTab] = useState('overview');
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
  
//   // 🏷️ Categories from merchant profile
//   const [categories, setCategories] = useState(["Drinks", "Snacks", "Food", "Other"]);

//   // 📦 Shared Inventory State
//   const [inventory, setInventory] = useState(() => {
//     const saved = localStorage.getItem('merchantInventory');
//     return saved ? JSON.parse(saved) : [
//        { id: 1, name: "Masala Chai", price: 15, category: "Drinks" },
//         { id: 2, name: "Veg Sandwich", price: 45, category: "Snacks" },
//         { id: 3, name: "Cold Coffee", price: 60, category: "Drinks" },
//         { id: 4, name: "Maggi", price: 30, category: "Snacks" },
//         { id: 5, name: "Water Bottle", price: 20, category: "Drinks" },
//     ];
//   });

//   // Load categories from merchant profile
//   useEffect(() => {
//     const loadCategories = async () => {
//       try {
//         const { data } = await api.get('/auth/me');
//         if (data.categories && data.categories.length > 0) {
//           setCategories(data.categories);
//         }
//       } catch (err) {
//         console.error('Failed to load categories:', err);
//       }
//     };
//     loadCategories();
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('merchantInventory', JSON.stringify(inventory));
//   }, [inventory]);

//   return (
//     <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
//       {/* 🔹 NEW SIDEBAR COMPONENT */}
//       <MerchantSidebar 
//         activeTab={activeTab} 
//         onNavigate={setActiveTab} 
//         isOpen={isSidebarOpen} 
//         onClose={() => setSidebarOpen(false)} 
//       />

//       {/* ⚪ MAIN CONTENT AREA */}
//       <div className="flex-1 flex flex-col min-w-0 h-full">
        
//         {/* Mobile Top Header (Hamburger) */}
//         <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:hidden shrink-0">
//             <button 
//               onClick={() => setSidebarOpen(true)} 
//               className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform"
//             >
//                 <Menu size={24} />
//             </button>
//             <span className="font-bold text-slate-700 capitalize">{activeTab}</span>
//             <div className="w-8" /> {/* Spacer to center the title */}
//         </header>
        
//         {/* Scrollable Content */}
//         <main className="flex-1 overflow-y-auto p-4 md:p-8">
//             <div className="max-w-6xl mx-auto">
//                 {activeTab === 'overview' && <MerchantOverview onNavigate={setActiveTab} />}
//                 {activeTab === 'calendar' && <MerchantCalendar />}
//                 {activeTab === 'billing' && <MerchantBilling inventory={inventory} />}
//                 {activeTab === 'items' && <MerchantItems inventory={inventory} setInventory={setInventory} categories={categories} setCategories={setCategories} />}
//                 {activeTab === 'insights' && <MerchantInsights />}
//                 {activeTab === 'profile' && <MerchantProfile />}
//             </div>
//         </main>
//       </div>

//     </div>
//   );
// };

// export default MerchantDashboard;
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

// Import Components
import MerchantSidebar from '../components/merchant/MerchantSidebar'; 
import BottomNav from '../components/merchant/BottomNav';

// Import Pages
import MerchantOverview from '../components/merchant/MerchantOverview';
import MerchantCalendar from '../components/merchant/MerchantCalendar';
import MerchantBilling from '../components/merchant/MerchantBilling';
import MerchantItems from '../components/merchant/MerchantItems'; // Updated to new dynamic version
import MerchantInsights from '../components/merchant/MerchantInsights';
import MerchantProfile from '../components/merchant/MerchantProfile';
import MerchantOnboardingWizard from '../components/onboarding/MerchantOnboardingWizard';

const MerchantDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(
    localStorage.getItem('isProfileComplete') === 'true'
  );
  const [loading, setLoading] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data } = await api.fetchProfile();
        setProfile(data);
        setIsProfileComplete(data.isProfileComplete);
        localStorage.setItem('isProfileComplete', data.isProfileComplete);
        
        // Redirect to onboarding if profile not complete
        if (!data.isProfileComplete && !location.pathname.includes('/onboarding')) {
          navigate('/merchant/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('Failed to check profile:', err);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [navigate, location.pathname]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setIsProfileComplete(true);
    localStorage.setItem('isProfileComplete', 'true');
    navigate('/merchant/overview', { replace: true });
  };

  // Inventory state for billing (fetched from API now)
  const [inventory, setInventory] = useState([]);
  
  useEffect(() => {
    const loadInventory = async () => {
      if (!isProfileComplete) return;
      try {
        const { data } = await api.fetchItems();
        // Transform items for billing component compatibility
        const items = (data.items || []).map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          category: item.categoryId?.name || 'Other',
          isAvailable: item.isAvailable,
        }));
        setInventory(items);
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    };
    loadInventory();
  }, [isProfileComplete]);

  // Show loading while checking profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If on onboarding route, show onboarding wizard
  if (location.pathname.includes('/onboarding')) {
    return <MerchantOnboardingWizard onComplete={handleOnboardingComplete} initialData={profile} />;
  }

  // If profile not complete, redirect happens in useEffect
  if (!isProfileComplete) {
    return null;
  }

  // Hide Bottom Bar when on the Billing Page
  const isBillingPage = location.pathname.includes('billing');
  const isOnboardingPage = location.pathname.includes('onboarding');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 🖥️ DESKTOP: Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex h-full">
         <MerchantSidebar />
      </div>

      {/* ⚪ MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${!isBillingPage && !isOnboardingPage ? 'pb-24 md:pb-8' : ''}`}>
            <div className="max-w-6xl mx-auto">
                
                <Routes>
                  {/* Redirect root to overview */}
                  <Route path="/" element={<Navigate to="overview" replace />} />
                  
                  {/* Onboarding */}
                  <Route path="onboarding" element={
                    <MerchantOnboardingWizard onComplete={handleOnboardingComplete} initialData={profile} />
                  } />
                  
                  {/* Main Dashboard Routes */}
                  <Route path="overview" element={<MerchantOverview />} />
                  <Route path="calendar" element={<MerchantCalendar />} />
                  <Route path="billing" element={<MerchantBilling inventory={inventory} />} />
                  <Route path="items" element={<MerchantItems />} />
                  <Route path="insights" element={<MerchantInsights />} />
                  <Route path="profile" element={<MerchantProfile />} />
                </Routes>

            </div>
        </main>

        {/* 📱 MOBILE: Bottom Nav */}
        {!isBillingPage && !isOnboardingPage && (
           <div className="md:hidden">
              <BottomNav />
           </div>
        )}

      </div>

    </div>
  );
};

export default MerchantDashboard;