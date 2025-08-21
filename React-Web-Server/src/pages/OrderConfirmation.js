import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';

function OrderConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!user) return;
        
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user-orders/${user.attributes.sub}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const orders = await response.json();
        const currentOrder = orders.find(o => o.order_id === parseInt(orderId));
        
        if (!currentOrder) {
          throw new Error('Order not found');
        }

        setOrder(currentOrder);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  if (loading) {
    return <div style={styles.container}>Loading order details...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Notification
          message={error}
          type="error"
          onDismiss={() => setError(null)}
          autoDismiss={5000}
        />
      </div>
    );
  }

  if (!order) {
    return <div style={styles.container}>Order not found</div>;
  }

  // Calculate total and breakdown
  const breakdown = order.products.map(product => {
    const qty = product.quantity || 1;
    const price = parseFloat(product.price) || 0;
    const subtotal = qty * price;
    return {
      ...product,
      qty,
      price,
      subtotal,
    };
  });
  const totalAmount = breakdown.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Order Confirmation</h2>
        <div style={styles.checkmark}>✓</div>
        <p style={styles.subheading}>Your order has been placed successfully!</p>
        <p style={styles.emailNote}>
          We sent you an email with your order details at{' '}
          <span style={styles.emailHighlight}>{user?.attributes?.email}</span>
        </p>
      </div>

      <div style={styles.orderDetails}>
        <h3 style={styles.sectionTitle}>Order #{order.order_id}</h3>
        <div style={styles.productList}>
          {breakdown.map((product, index) => (
            <div key={`${product.pid}-${index}`} style={styles.productItem}>
              <div style={styles.productImageWrapper}>
                <img
                  src={product.thumbLink || "https://via.placeholder.com/60"}
                  alt={product.productName}
                  style={styles.productImage}
                />
              </div>
              <div style={styles.productInfo}>
                <h4 style={styles.productName}>{product.productName}</h4>
                <p style={styles.productDetails}>
                  <span>Size: {product.size}</span>
                  <span style={styles.dot}>•</span>
                  <span>Category: {product.category}</span>
                </p>
                <p style={styles.productDetails}>
                  Quantity: <strong>{product.qty}</strong>
                </p>
                <p style={styles.productPrice}>
                  {product.qty > 1 ? (
                    <>${product.price.toFixed(2)} × {product.qty} = <strong style={{ color: "#059669" }}>${product.subtotal.toFixed(2)}</strong></>
                  ) : (
                    <strong style={{ color: "#059669" }}>${product.price.toFixed(2)}</strong>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.summaryTotal}>
          <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Total Amount:</span>
          <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#059669" }}>${totalAmount}</span>
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <Link to="/orders" style={styles.viewAllLink}>
          View All Orders
        </Link>
        <button
          style={styles.continueShoppingButton}
          onClick={() => window.location.href = '/'}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  heading: {
    fontSize: "2rem",
    color: "#111827",
    marginBottom: "1rem",
  },
  checkmark: {
    fontSize: "3rem",
    color: "#10b981",
    marginBottom: "1rem",
  },
  subheading: {
    fontSize: "1.2rem",
    color: "#4b5563",
    marginBottom: "0.5rem",
  },
  emailNote: {
    fontSize: "1rem",
    color: "#6b7280",
    fontStyle: "italic",
  },
  emailHighlight: {
    color: "#0d9488",
    fontWeight: "500",
  },
  orderDetails: {
    marginTop: "2rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    color: "#111827",
    marginBottom: "1rem",
  },
  productList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  productItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem", // reduced from 1rem
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    gap: "0.75rem", // reduced from 1.5rem
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  productImageWrapper: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px", // reduced from 70px
    height: "60px", // reduced from 70px
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginRight: "0.3rem", // reduced from 0.5rem
  },
  productImage: {
    width: "48px", // reduced from 60px
    height: "48px", // reduced from 60px
    objectFit: "cover",
    borderRadius: "6px",
    background: "#e5e7eb",
  },
  productInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "0.15rem", // add gap to reduce spacing between text lines
  },
  productName: {
    fontSize: "1rem", // reduced from 1.1rem
    color: "#111827",
    marginBottom: "0.15rem", // reduced from 0.3rem
    fontWeight: "600",
  },
  productDetails: {
    fontSize: "0.9rem", // reduced from 0.95rem
    color: "#6b7280",
    marginBottom: "0.1rem", // reduced from 0.2rem
    display: "flex",
    alignItems: "center",
    gap: "0.3rem", // reduced from 0.5rem
  },
  dot: {
    display: "inline-block",
    margin: "0 0.15rem", // reduced from 0.3rem
    fontSize: "1em", // reduced from 1.2em
    color: "#d1d5db",
  },
  productPrice: {
    fontSize: "0.95rem", // reduced from 1rem
    color: "#111827",
    fontWeight: "bold",
    marginTop: "0.1rem", // reduced from 0.2rem
  },
  summarySection: {
    marginTop: "2rem",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "1rem 1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  summaryTitle: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    marginBottom: "0.75rem",
    color: "#222",
  },
  summaryList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    marginBottom: "0.75rem",
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1rem",
    marginBottom: "0.5rem",
    color: "#444",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "0.75rem",
    marginTop: "0.5rem",
    color: "#111",
  },
  totalSection: {
    marginTop: "2rem",
    borderTop: "2px solid #e5e7eb",
    paddingTop: "1rem",
  },
  continueShoppingButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#fff",
    color: "#0d9488",
    border: "2px solid #0d9488",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.3s",
    textAlign: "center",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "2rem",
  },
  viewAllLink: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#0d9488",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    transition: "background-color 0.3s",
    textAlign: "center",
  },
};

export default OrderConfirmation;
