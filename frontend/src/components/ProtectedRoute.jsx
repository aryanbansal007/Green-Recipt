// import React from "react";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, role }) => {
//   const token = localStorage.getItem("token");
//   const userRole = localStorage.getItem("role");

//   if (!token || (role && userRole !== role)) {
//     return <Navigate to={userRole === "merchant" ? "/merchant-login" : "/customer-login"} replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import * as api from "../services/api";

const ProtectedRoute = ({ children, role }) => {
  const location = useLocation();
  
  // Use the new API functions to check authentication
  const isAuth = api.isAuthenticated();
  const userRole = api.getStoredRole();
  
  // State for onboarding check
  const [isChecking, setIsChecking] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(
    localStorage.getItem("isProfileComplete") === "true"
  );

  // For merchants, verify profile completion status with backend
  useEffect(() => {
    const verifyMerchantProfile = async () => {
      // Only check for merchants who are logged in and not already on onboarding page
      if (
        isAuth && 
        userRole === "merchant" && 
        role === "merchant" &&
        !location.pathname.includes("/onboarding")
      ) {
        setIsChecking(true);
        try {
          const { data } = await api.fetchProfile();
          setIsProfileComplete(data.isProfileComplete);
          localStorage.setItem("isProfileComplete", data.isProfileComplete);
        } catch (err) {
          console.error("Failed to verify profile:", err);
          // If we can't verify, use cached value
        } finally {
          setIsChecking(false);
        }
      }
    };
    verifyMerchantProfile();
  }, [isAuth, userRole, role, location.pathname]);

  // 1. CASE: User is NOT logged in at all
  if (!isAuth) {
    // Redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. CASE: User IS logged in, but has the WRONG role
  // (e.g., A Customer trying to access the Merchant Dashboard)
  if (role && userRole !== role) {
    // Redirect them to THEIR correct home page based on who they actually are
    if (userRole === "merchant") {
      return <Navigate to="/merchant/overview" replace />;
    } else {
      return <Navigate to="/customer-dashboard" replace />;
    }
  }

  // 3. Show loading while checking profile
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Checking profile...</p>
        </div>
      </div>
    );
  }

  // 4. CASE: Merchant with incomplete profile - redirect to onboarding
  // (but don't redirect if they're already on the onboarding page)
  if (
    role === "merchant" && 
    userRole === "merchant" && 
    !isProfileComplete && 
    !location.pathname.includes("/onboarding")
  ) {
    return <Navigate to="/merchant/onboarding" replace />;
  }

  // 5. CASE: Access Granted
  return children;
};

export default ProtectedRoute;
