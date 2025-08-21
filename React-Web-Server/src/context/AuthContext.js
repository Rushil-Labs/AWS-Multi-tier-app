import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from "js-cookie"; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0); 

   // Function to load and set cart count from cookies
  const loadCartCount = () => {
    const existingCart = Cookies.get("cart"); // Get 'cart' cookie
    if (existingCart) { // If cart exists in cookies
      try {
        const parsed = JSON.parse(existingCart); // Parse the cart data
        setCartCount(parsed.length); // Set cart count to the number of items in the parsed cart
      } catch (e) {
        console.error('Error parsing cart cookie:', e); // Log error if parsing fails
        setCartCount(0); // Default to 0 if parsing fails
      }
    } else {
      setCartCount(0); // Default to 0 if no cart cookie exists
    }
  };

  useEffect(() => {
    // Check for stored user data when the app loads
    const checkAuth = () => {
      const storedUser = localStorage.getItem('userAttributes');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('userAttributes');
        }
      }
      setLoading(false);
    };

    checkAuth();
    loadCartCount()

    // Listen for storage changes (for cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === 'userAttributes') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('userAttributes', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userAttributes');
    Cookies.remove('cart'); // Clear cart cookie on logout
    setCartCount(0);
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, cartCount, updateCartCount: loadCartCount }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
