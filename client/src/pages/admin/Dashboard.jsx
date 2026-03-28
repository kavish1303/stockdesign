import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#7c5cfc', '#c084fc', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await adminAPI.dashboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
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

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>Unable to load dashboard</h3>
      </div>
    );
  }

  const { stats, topDesigns, lowStockDesigns, recentOrders, ordersByStatus } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of your garment design business</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124, 92, 252, 0.15)', color: '#7c5cfc' }}>🎨</div>
          <div className="stat-value">{stats.totalDesigns}</div>
          <div className="stat-label">Total Designs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>📦</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>💰</div>
          <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>⏳</div>
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>👥</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: stats.outOfStock > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: stats.outOfStock > 0 ? '#ef4444' : '#22c55e' }}>📊</div>
          <div className="stat-value">{stats.totalStock}</div>
          <div className="stat-label">Total Stock in kg ({stats.outOfStock} out of stock)</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left: Charts & Recent Orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Top Designs Chart */}
          {topDesigns.length > 0 && (
            <div className="dashboard-section">
              <h2>📈 Most In-Demand Designs</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topDesigns.slice(0, 8)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: '#a0a0b8', fontSize: 12 }}
                    tickFormatter={(val) => val.length > 12 ? val.slice(0, 12) + '…' : val}
                  />
                  <YAxis tick={{ fill: '#a0a0b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a28',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#f0f0f5',
                    }}
                  />
                  <Bar dataKey="total_ordered" fill="#7c5cfc" radius={[6, 6, 0, 0]} name="KG Ordered" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Order Status Distribution */}
          {ordersByStatus.length > 0 && (
            <div className="dashboard-section">
              <h2>📊 Orders by Status</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={({ status, count }) => `${status} (${count})`}
                    labelLine={true}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a28',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#f0f0f5',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Orders Table */}
          <div className="dashboard-section">
            <h2>🕐 Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No orders yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Design</th>
                      <th>Customer</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={`/uploads/${order.design_image}`}
                            alt=""
                            style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                          />
                          {order.design_title}
                        </td>
                        <td>{order.user_name}</td>
                        <td>{order.quantity} kg</td>
                        <td>₹{order.total_price.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${order.status}`}>{order.status}</span>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Low Stock Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="dashboard-section">
            <h2 style={{ color: lowStockDesigns.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {lowStockDesigns.length > 0 ? '⚠️ Low Stock Alerts' : '✅ Stock Healthy'}
            </h2>
            {lowStockDesigns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                All designs have sufficient stock
              </p>
            ) : (
              <div className="low-stock-list">
                {lowStockDesigns.map((design) => (
                  <div key={design.id} className="low-stock-item">
                    <img src={`/uploads/${design.image_path}`} alt={design.title} />
                    <div className="item-info">
                      <h4>{design.title}</h4>
                      <span>{design.category}</span>
                    </div>
                    <span className="low-stock-count">
                      {design.stock === 0 ? '⛔ 0' : `⚠️ ${design.stock}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Designs List */}
          <div className="dashboard-section">
            <h2>🏆 Top Designs</h2>
            {topDesigns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No data yet</p>
            ) : (
              <div className="low-stock-list">
                {topDesigns.slice(0, 5).map((design, i) => (
                  <div key={design.id} className="low-stock-item">
                    <span style={{ 
                      width: 28, height: 28, borderRadius: '50%', 
                      background: CHART_COLORS[i], color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, flexShrink: 0
                    }}>
                      {i + 1}
                    </span>
                    <img src={`/uploads/${design.image_path}`} alt={design.title} />
                    <div className="item-info">
                      <h4>{design.title}</h4>
                      <span>{design.total_ordered} kg ordered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
