import React, { useEffect } from 'react';

const Notification = ({ message, type = 'success', onDismiss, autoDismiss = 3000 }) => {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  const backgroundColor = type === 'success' ? '#4caf50' : '#f44336';

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px', // Position it below the header
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor,
        color: 'white',
        padding: '12px 24px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        maxWidth: '90%',
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '8px',
          fontSize: '18px',
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
      >
        ×
      </button>
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translate(-50%, -20px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Notification;
