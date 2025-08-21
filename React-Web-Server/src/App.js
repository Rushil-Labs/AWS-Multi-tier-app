// App.js
import React, { useState } from "react";
import Cookies from "js-cookie";
import { Outlet } from "react-router-dom";
import UserHeader from "./components/UserHeader";
import { AuthProvider } from "./context/AuthContext";

function App() {

 const [cart, setCart] = useState(() => {
    const existingCart = Cookies.get("cart");
    return existingCart ? JSON.parse(existingCart) : [];
  });

  // Update cookie and state when adding to cart
  const handleAddToCart = (productId) => {
    if (!cart.includes(productId)) {
      const updatedCart = [...cart, productId];
      setCart(updatedCart);
      Cookies.set("cart", JSON.stringify(updatedCart), { expires: 7 });
      alert("Item added to cart!");
    } else {
      alert("Item already in cart.");
    }
  };

  const [allProducts, setAllProducts] = useState([]);
  return (
    <AuthProvider>
      <div style={{ fontFamily: "Arial" }}>
        <UserHeader />
        <Outlet context={{ allProducts, setAllProducts }} />
      </div>
    </AuthProvider>
  );
}

export default App;