import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ messages, onRemove }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px'
    }}>
      {messages.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto remove after duration
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'linear-gradient(135deg, #48BB78 0%, #38A169 100%)';
      case 'error':
        return 'linear-gradient(135deg, #F56565 0%, #E53E3E 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #ED8936 0%, #DD6B20 100%)';
      case 'info':
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      style={{
        background: getBackgroundColor(),
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        transform: `translateX(${isVisible && !isLeaving ? '0' : '120%'})`,
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleRemove}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: 'rgba(255, 255, 255, 0.5)',
          animation: `progress ${toast.duration || 5000}ms linear`,
          width: '100%',
          transformOrigin: 'left'
        }}
      />
      
      {/* Icon */}
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        flexShrink: 0
      }}>
        {getIcon()}
      </div>
      
      {/* Message */}
      <div style={{
        flex: 1,
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.4'
      }}>
        {toast.message}
      </div>
      
      {/* Close button */}
      <button
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
      >
        ×
      </button>
      
      <style>{`
        @keyframes progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;