import { useState, useEffect } from 'react';
import { ordersAPI } from '../api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Orders</h1>
          <p>Track your design bookings and order status</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Browse the gallery and book your first design!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card" id={`order-${order.id}`}>
              <img
                src={`/uploads/${order.design_image}`}
                alt={order.design_title}
              />
              <div className="order-info">
                <h3>{order.design_title}</h3>
                <div className="order-meta">
                  <span>Qty: {order.quantity} kg</span>
                  <span>Total: ₹{order.total_price.toLocaleString()}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                {order.notes && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginTop: '4px' }}>
                    📝 {order.notes}
                  </p>
                )}
              </div>
              <span className={`status-badge ${order.status}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
