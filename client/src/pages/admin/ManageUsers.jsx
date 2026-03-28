import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminAPI.users();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      setError('');
      await adminAPI.approveUser(userId);
      setSuccess(`✅ ${userName} has been approved!`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!confirm(`Are you sure you want to reject and remove ${userName}?`)) return;
    try {
      setError('');
      await adminAPI.rejectUser(userId);
      setSuccess(`🚫 ${userName} has been rejected and removed.`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
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

  const filteredUsers = users.filter((u) => {
    if (filter === 'pending') return !u.approved;
    if (filter === 'approved') return u.approved;
    return true;
  });

  const pendingCount = users.filter((u) => !u.approved).length;

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
          <h1>Manage Users</h1>
          <p>Approve or reject new account registrations</p>
        </div>
        {pendingCount > 0 && (
          <div className="alert alert-error" style={{ padding: '8px 16px', margin: 0, fontSize: 'var(--font-sm)' }}>
            🔔 {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Filter */}
      <div className="category-filter" style={{ marginBottom: 'var(--space-xl)' }}>
        <button
          className={`category-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({users.length})
        </button>
        <button
          className={`category-chip ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          ⏳ Pending ({pendingCount})
        </button>
        <button
          className={`category-chip ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          ✅ Approved ({users.filter((u) => u.approved).length})
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
          <p>{filter === 'pending' ? 'No pending approvals.' : 'No users registered yet.'}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>#{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className="user-avatar"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {u.name?.charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    {u.role === 'admin' ? (
                      <span className="admin-badge">Admin</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Customer</span>
                    )}
                  </td>
                  <td>
                    {u.approved ? (
                      <span className="status-badge confirmed">Approved</span>
                    ) : (
                      <span className="status-badge pending">Pending</span>
                    )}
                  </td>
                  <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    {formatDate(u.created_at)}
                  </td>
                  <td>
                    {u.role !== 'admin' && !u.approved && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(u.id, u.name)}
                          id={`approve-user-${u.id}`}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          onClick={() => handleReject(u.id, u.name)}
                          id={`reject-user-${u.id}`}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {u.approved && u.role !== 'admin' && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Active</span>
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
