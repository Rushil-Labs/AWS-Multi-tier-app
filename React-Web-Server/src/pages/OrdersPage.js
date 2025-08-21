import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user?.attributes?.sub) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user-orders/${user.attributes.sub}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        // Sort orders by order_id in descending order (latest first)
        const sortedOrders = [...data].sort((a, b) => b.order_id - a.order_id);
        setOrders(sortedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading your orders...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem", color: "red", textAlign: "center" }}>{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>My Orders</h2>
        <p>You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "2rem" }}>My Orders</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {orders.map((order) => (
          <div
            key={order.order_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>
              Order #{order.order_id}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
              {order.products.map((product, idx) => (
                <div
                  key={`${order.order_id}-${product.pid}-${idx}`}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "6px",
                    padding: "1rem",
                    backgroundColor: "#f9f9f9",
                    display: "flex",
                    gap: "1rem"
                  }}
                >
                  <div style={{ 
                    width: "100px",
                    height: "100px",
                    flexShrink: 0,
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <img 
                      src={product.thumbLink} 
                      alt={product.productName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                      onError={(e) => {
                        e.target.src = "/images/placeholder.png";
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: "0 0 0.5rem", 
                      color: "#444",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      minWidth: 0
                    }}>
                      <span style={{ 
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {product.productName}
                      </span>
                      <span style={{ 
                        whiteSpace: "nowrap",
                        flexShrink: 0 
                      }}>
                        × {product.quantity || 1}
                      </span>
                    </h4>
                    <div style={{ fontSize: "0.9rem", color: "#666" }}>
                      <p style={{ margin: "0.2rem 0" }}>Category: {product.category}</p>
                      <p style={{ margin: "0.2rem 0" }}>Gender: {product.gender}</p>
                      <p style={{ margin: "0.2rem 0" }}>Size: {product.size}</p>
                      <p style={{ margin: "0.2rem 0", fontWeight: "bold" }}>
                        <span style={{ color: "#28a745", fontWeight: "bold" }}>
                          ${(parseFloat(product.price) * (product.quantity || 1)).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.5rem",
                borderTop: "2px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center"
              }}
            >
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span style={{ fontSize: "1.1rem", color: "#666" }}>Order Total:</span>
                <span style={{ color: "#28a745" }}>
                  ${order.products.reduce((total, product) => total + (parseFloat(product.price) * (product.quantity || 1)), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;
