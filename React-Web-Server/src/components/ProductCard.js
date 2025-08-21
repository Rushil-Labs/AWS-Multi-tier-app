import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProductCard({ product, cartItems, onAddToCart, onRemoveFromCart, onIncrement, onDecrement }) {
  const navigate = useNavigate();
  const inStock = product.inventory > 0;
  const [isHovered, setIsHovered] = React.useState(false);
  const inCart = cartItems && cartItems.hasOwnProperty(product.pid);
  const quantity = cartItems ? (cartItems[product.pid] || 0) : 0;

  const handleClick = () => {
    try {
      navigate(`/product/${product.pid}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking buttons
  };

  return (
    <div 
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        width: "250px",
        height: "400px",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        padding: "1.5rem",
        borderRadius: "15px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: isHovered 
          ? "0 12px 20px rgba(0, 0, 0, 0.1)" 
          : "0 4px 6px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        transform: isHovered ? "translateY(-5px)" : "translateY(0)",
      }}
    >
      <div style={{
        width: "100%",
        height: "200px",
        overflow: "hidden",
        borderRadius: "10px",
        marginBottom: "1rem"
      }}>
        <img
          src={product.thumbLink}
          alt={product.productName}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            borderRadius: "10px",
            transition: "transform 0.3s ease"
          }}
        />
      </div>

      <h3 style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: "0.75rem",
        lineHeight: "1.2"
      }}>{product.productName}</h3>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "0.5rem",
        fontSize: "0.9rem",
        color: "#4b5563",
        marginBottom: "auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontWeight: "500" }}>Category:</span>
          <span>{product.category}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontWeight: "500" }}>Gender:</span>
          <span>{product.gender}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontWeight: "500" }}>Size:</span>
          <span>{product.size}</span>
        </div>
      </div>

      <div style={{
        marginTop: "1rem",
        padding: "0.75rem",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem"
      }}>
        {/* Price and Stock Status Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: "#1f2937"
          }}>
            ${parseFloat(product.price).toFixed(2)}
          </div>
          
          <div style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "24px",
            fontSize: "0.875rem",
            fontWeight: "500",
            backgroundColor: product.inventory > 0 ? "#dcfce7" : "#fee2e2",
            color: product.inventory > 0 ? "#166534" : "#991b1b",
            minWidth: "120px",
            textAlign: "center"
          }}>
            {product.inventory > 0
              ? `In Stock (${product.inventory})`
              : "Out of Stock"
            }
          </div>
        </div>

        {/* Cart Controls */}
        {inStock && (
          <div onClick={handleButtonClick} style={{ width: "100%" }}>
            {(!inCart || quantity === 0) ? (
              <button
                onClick={() => onAddToCart(product.pid, product.productName)}
                style={{
                  backgroundColor: "#03b723",
                  color: "#fff",
                  border: "none",
                  borderRadius: "24px",
                  padding: "0.5rem 1.2rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s"
                }}
              >
                Add to Cart
              </button>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                backgroundColor: "#f9fafb",
                borderRadius: "24px",
                padding: "0.3rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
              }}>
                <button
                  style={{
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onClick={() => {
                    if (quantity <= 1) {
                      onRemoveFromCart(product.pid, product.productName);
                    } else {
                      onDecrement(product.pid, product.productName);
                    }
                  }}
                >
                  −
                </button>
                <span style={{
                  fontSize: "1rem",
                  fontWeight: "bold",
                  minWidth: "24px",
                  textAlign: "center"
                }}>
                  {quantity}
                </span>
                <button
                  style={{
                    backgroundColor: "#03b723",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onClick={() => onIncrement(product.pid, product.productName, product.inventory)}
                  disabled={quantity >= product.inventory}
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
