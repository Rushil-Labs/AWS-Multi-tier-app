import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';
import Notification from './Notification';
import ProductCard from './ProductCard';

function ProductGrid({ products }) {
  const { updateCartCount } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [cartItems, setCartItems] = useState({}); // { pid: quantity }

  // Initialize cart items from cookies
  React.useEffect(() => {
    const existingCart = Cookies.get('cart');
    if (existingCart) {
      setCartItems(JSON.parse(existingCart));
    }
  }, []);

  // Helper to get total items in cart
  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // Update cart count in context and dispatch event for header
  React.useEffect(() => {
    updateCartCount(getTotalCartItems());
    window.dispatchEvent(new Event("cartUpdated"));
  }, [cartItems, updateCartCount]);

  const handleAddToCart = (productId, productName) => {
    const updatedCart = { ...cartItems, [productId]: 1 };
    Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    setCartItems(updatedCart);
    setNotificationMessage(`${productName} added to cart`);
    setShowNotification(true);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleRemoveFromCart = (productId, productName) => {
    const updatedCart = { ...cartItems };
    delete updatedCart[productId];
    Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    setCartItems(updatedCart);
    setNotificationMessage(`${productName} removed from cart`);
    setShowNotification(true);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleIncrement = (productId, productName, inventory) => {
    const currentQty = cartItems[productId] || 0;
    if (currentQty < inventory) {
      const updatedCart = { ...cartItems, [productId]: currentQty + 1 };
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
      setCartItems(updatedCart);
      setNotificationMessage(`${productName} quantity updated`);
      setShowNotification(true);
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const handleDecrement = (productId, productName) => {
    const currentQty = cartItems[productId] || 0;
    if (currentQty > 1) {
      const updatedCart = { ...cartItems, [productId]: currentQty - 1 };
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
      setCartItems(updatedCart);
      setNotificationMessage(`${productName} quantity updated`);
      setShowNotification(true);
      window.dispatchEvent(new Event("cartUpdated"));
    } else {
      handleRemoveFromCart(productId, productName);
    }
  };

  return (
    <div>
      <div style={styles.gridContainer}>
        {products.map((product) => {
          const price = parseFloat(product.price);
          const isOutOfStock = product.inventory === 0;
          const inCart = cartItems.hasOwnProperty(product.pid);
          const quantity = cartItems[product.pid] || 0;

          return (
            <div key={product.pid} style={{ position: 'relative' }}>
              <ProductCard 
                product={product}
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            </div>
          );
        })}
      </div>
      {showNotification && (
        <Notification
          message={notificationMessage}
          onDismiss={() => setShowNotification(false)}
          type="success"
          autoDismiss={1700}
        />
      )}
    </div>
  );
}

// ✨ CSS-in-JS styles
const styles = {
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "2rem",
    padding: "2rem",
    backgroundColor: "#f4f6f8",
    borderRadius: "16px",
    justifyItems: "center",
    alignItems: "start",
  },
  card: {
    position: "relative",
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    maxWidth: "300px",
    width: "100%",
    textAlign: "center",
    cursor: "pointer",
  },
  cardOutOfStock: {
    filter: "grayscale(70%)",
    pointerEvents: "none",
    opacity: 0.7,
    cursor: "not-allowed",
  },
  image: {
    width: "200px",
    height: "240px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "1rem",
    transition: "opacity 0.3s ease",
  },
  title: {
    fontSize: "1.2rem",
    margin: "0.5rem 0",
  },
  sizeText: {
    color: "#64748b",
    fontSize: "0.95rem",
  },
  price: {
    marginTop: "0.5rem",
    fontSize: "1rem",
    color: "#334155",
    fontWeight: "bold",
  },
  buttonWrapper: {
    marginTop: "0.8rem",
    display: "flex",
    justifyContent: "center",
  },
  addToCartButton: {
    backgroundColor: "#03b723",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    padding: "0.5rem 1.2rem",
    fontSize: "1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.2s",
  },
  counterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#f9fafb",
    borderRadius: "24px",
    padding: "0.3rem 1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  counterButton: {
    backgroundColor: "#03b723",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    fontSize: "1.3rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  counterValue: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    minWidth: "24px",
    textAlign: "center",
    color: "#222",
  },
  removeButton: {
    backgroundColor: "#ff0000",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    fontSize: "1.1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "0.5rem",
    transition: "background-color 0.2s",
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#0d9488",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "background-color 0.2s ease",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    color: "white",
    fontWeight: "bold",
    fontSize: "1.5rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "12px",
    pointerEvents: "none",
  },
};

// 👇 Inject hover effect using raw CSS (via <style> tag)
const styleTag = document.createElement('style');
styleTag.innerHTML = `
  .product-card:hover {
    transform: scale(1.03);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
`;
document.head.appendChild(styleTag);

export default ProductGrid;