import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';

function ProductDetail() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { updateCartCount } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isCartButtonHovered, setIsCartButtonHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/products/${pid}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [pid]);

  useEffect(() => {
    // Load quantity from cookies if exists
    const cart = Cookies.get('cart');
    if (cart) {
      const cartObj = JSON.parse(cart);
      if (cartObj[pid]) {
        setQuantity(cartObj[pid]);
      }
    }
  }, [pid]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  // Check if product is in cart
  const cart = Cookies.get('cart') ? JSON.parse(Cookies.get('cart')) : {};
  const inCart = cart[pid] > 0;

  const handleAddToCart = () => {
    const updatedCart = { ...cart, [pid]: 1 };
    Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    setQuantity(1);
    updateCartCount(Object.values(updatedCart).reduce((sum, qty) => sum + qty, 0));
    window.dispatchEvent(new Event("cartUpdated"));
    setNotification({
      message: `${product.productName} added to cart successfully`,
      type: 'success'
    });
  };

  const handleRemoveFromCart = () => {
    const updatedCart = { ...cart };
    delete updatedCart[pid];
    Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
    setQuantity(1);
    updateCartCount(Object.values(updatedCart).reduce((sum, qty) => sum + qty, 0));
    window.dispatchEvent(new Event("cartUpdated"));
    setNotification({
      message: `${product.productName} removed from cart`,
      type: 'success'
    });
  };

  const handleIncrement = () => {
    if (quantity < product.inventory) {
      const updatedCart = { ...cart, [pid]: quantity + 1 };
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
      setQuantity(quantity + 1);
      updateCartCount(Object.values(updatedCart).reduce((sum, qty) => sum + qty, 0));
      window.dispatchEvent(new Event("cartUpdated"));
      setNotification({
        message: `${product.productName} quantity updated`,
        type: 'success'
      });
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const updatedCart = { ...cart, [pid]: quantity - 1 };
      Cookies.set('cart', JSON.stringify(updatedCart), { expires: 7 });
      setQuantity(quantity - 1);
      updateCartCount(Object.values(updatedCart).reduce((sum, qty) => sum + qty, 0));
      window.dispatchEvent(new Event("cartUpdated"));
      setNotification({
        message: `${product.productName} quantity updated`,
        type: 'success'
      });
    } else {
      handleRemoveFromCart();
    }
  };

  return (
    <div style={{ 
        padding: '2rem', 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '0.75rem 1.25rem',
          marginBottom: '2rem',
          cursor: 'pointer',
          backgroundColor: '#f3f4f6',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 0.2s ease',
          ':hover': {
            backgroundColor: '#e5e7eb'
          }
        }}
      >
        ← Back to Products
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '3rem', alignItems: 'start' }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <img
            src={product.thumbLink}
            alt={product.productName}
            style={{
              width: '66%',
              height: 'auto',
              borderRadius: '8px',
              border: '3px solid #181919ff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          {product.inventory > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              {!inCart ? (
                <button
                  onClick={handleAddToCart}
                  onMouseEnter={() => setIsAddButtonHovered(true)}
                  onMouseLeave={() => setIsAddButtonHovered(false)}
                  style={{
                    marginTop: '1rem',
                    width: '66%',
                    padding: '0.5rem',
                    backgroundColor: isAddButtonHovered ? '#04db2a' : '#03b723',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isAddButtonHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isAddButtonHovered ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                  }}
                >
                  Add to Cart
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', width: '66%', justifyContent: 'center' }}>
                  <button
                    style={{
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
                    }}
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                  >−</button>
                  <span style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    minWidth: "24px",
                    textAlign: "center",
                    color: "#222",
                  }}>{quantity}</span>
                  <button
                    style={{
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
                    }}
                    onClick={handleIncrement}
                    disabled={quantity >= product.inventory}
                  >+</button>
                  <button
                    style={{
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      marginLeft: "0.5rem",
                      cursor: "pointer",
                    }}
                    onClick={handleRemoveFromCart}
                  >
                    Remove
                  </button>
                </div>
              )}
              {inCart && (
                <button
                  onClick={() => navigate('/cart')}
                  onMouseEnter={() => setIsCartButtonHovered(true)}
                  onMouseLeave={() => setIsCartButtonHovered(false)}
                  style={{
                    width: '66%',
                    padding: '0.5rem',
                    backgroundColor: isCartButtonHovered ? '#2563eb' : 'transparent',
                    color: isCartButtonHovered ? '#fff' : '#2563eb',
                    border: '2px solid #2563eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isCartButtonHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isCartButtonHovered ? '0 4px 6px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                >
                  Go to Cart
                </button>
              )}
            </div>
          )}
        </div>
        
        <div style={{ padding: '1rem' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>{product.productName}</h1>

          <p style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            margin: '1.5rem 0',
            color: '#2563eb'
          }}>
            ${parseFloat(product.price).toFixed(2)}
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem'
            }}>Description</h3>
            <p style={{ 
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              color: '#4b5563',
              fontSize: '1.1rem',
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
              {product.description ? product.description : (
                <span style={{ color: '#dc2626' }}>No product description available</span>
              )}
            </p>
          </div>

          <div style={{ 
            marginBottom: '2rem',
            fontSize: '1.1rem',
            color: '#4b5563',
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', minWidth: '100px' }}>Category:</span>
              <span>{product.category}</span>
            </p>
            <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', minWidth: '100px' }}>Gender:</span>
              <span>{product.gender}</span>
            </p>
            <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', minWidth: '100px' }}>Size:</span>
              <span>{product.size}</span>
            </p>
            <p style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              <span style={{ fontWeight: '600', minWidth: '100px' }}>Availability:</span>
              {product.inventory > 0 ? (
                <span style={{ 
                  color: '#059669',
                  backgroundColor: '#d1fae5',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: '500'
                }}>In Stock ({product.inventory} available)</span>
              ) : (
                <span style={{ 
                  color: '#dc2626',
                  backgroundColor: '#fee2e2',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: '500'
                }}>Out of Stock</span>
              )}
            </p>
          </div>
        </div>
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
          autoDismiss={1700}
        />
      )}
    </div>
  );
}

export default ProductDetail;
