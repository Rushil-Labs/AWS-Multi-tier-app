import React, { useEffect, useState } from "react";
import ProductGrid from "../components/ProductGrid";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import Notification from "../components/Notification";


function AuthenticatedHome({ auth: propAuth }) {
  
  const { allProducts, setAllProducts } = useOutletContext();
  const [loadingproducts, setLoadingproducts] = useState(true);
  // No authentication logic

  useEffect(() => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    console.log("API Base URL:", apiBaseUrl);
    fetch(`${apiBaseUrl}/products`)
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        localStorage.setItem("allProducts", JSON.stringify(data));  // <--- save here
        setLoadingproducts(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoadingproducts(false);
      });
  }, [setAllProducts]);

  const [searchParams] = useSearchParams();
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);

  useEffect(() => {
    if (searchParams.get('logout') === 'true') {
      setShowLogoutNotification(true);
      // Remove the logout parameter from URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  return (
    <>
      {showLogoutNotification && (
        <Notification
          message="You have logged out successfully"
          onDismiss={() => setShowLogoutNotification(false)}
          autoDismiss={2500}
        />
      )}
      <div style={{
      padding: "2rem",
      fontFamily: "Arial",
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "#B6EDFD"
    }}>
      {/* UserHeader removed to prevent duplicate header */}
      <div style={{
        position: "absolute",
        top: "2rem",
        right: "2rem",
        zIndex: 10
      }}>
      </div>
      {loadingproducts ? <p>Loading available products...</p> : <ProductGrid products={allProducts} />}
    </div>
    </>
  );
}

export default AuthenticatedHome;
