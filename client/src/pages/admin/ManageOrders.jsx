import { useState, useEffect } from 'react';
import { ordersAPI } from '../../api';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await ordersAPI.getAll(params);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setSuccess(`Order #${orderId} updated to ${newStatus}`);
      loadOrders();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to update status:', err);
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

  const statuses = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

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
          <h1>All Orders</h1>
          <p>Manage and track all customer orders</p>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Status Filter */}
      <div className="category-filter" style={{ marginBottom: 'var(--space-xl)' }}>
        {statuses.map((s) => (
          <button
            key={s}
            className={`category-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} 
            {s === 'all' ? ` (${orders.length})` : ''}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No orders found</h3>
          <p>{statusFilter !== 'all' ? `No ${statusFilter} orders.` : 'No orders have been placed yet.'}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Design</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>#{order.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={`/uploads/${order.design_image}`}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>{order.design_title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{order.user_name}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{order.user_email}</div>
                    </div>
                  </td>
                  <td>{order.quantity} kg</td>
                  <td style={{ fontWeight: 600 }}>₹{order.total_price.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                  </td>
                  <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    {formatDate(order.created_at)}
                  </td>
                  <td>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
