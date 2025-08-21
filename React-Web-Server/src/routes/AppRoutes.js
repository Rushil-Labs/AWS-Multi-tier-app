// routes/AppRoutes.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import OrderConfirmation from '../pages/OrderConfirmation';
import App from "../App";
import AuthenticatedHome from "../pages/AuthenticatedHome";
import ConfirmSignUpPage from "../pages/ConfirmSignUpPage";
import AddProductForm from "../pages/AddProductForm";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import Cart from "../pages/Cart";
import OrdersPage from "../pages/OrdersPage";
import ProductDetail from '../pages/ProductDetail';

function AppRoutes() {
  console.log("AppRoutes rendering"); // Debug log
  return (
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<AuthenticatedHome />} />
        <Route path="add-product" element={<AddProductForm />} />
        <Route path="/product/:pid" element={<ProductDetail />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="confirm-signup" element={<ConfirmSignUpPage />} />
        <Route path="login" element={<LoginPage />} />
                  <Route path="/cart" element={<Cart />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
