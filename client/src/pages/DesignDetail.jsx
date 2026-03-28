import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { designsAPI, ordersAPI } from '../api';

export default function DesignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0.5);
  const [notes, setNotes] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadDesign();
  }, [id]);

  const loadDesign = async () => {
    try {
      const data = await designsAPI.getOne(id);
      setDesign(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    setError('');
    setSuccess('');
    setOrdering(true);

    try {
      await ordersAPI.create({ design_id: parseInt(id), quantity, notes });
      setSuccess(`Order placed successfully for ${quantity} kg!`);
      setDesign((prev) => ({ ...prev, stock: prev.stock - quantity }));
      setQuantity(0.5);
      setNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'var(--danger)';
    if (stock < 3) return 'var(--warning)';
    return 'var(--success)';
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>Design not found</h3>
          <p>This design may have been removed.</p>
          <button className="btn btn-primary" onClick={() => navigate('/gallery')} style={{ marginTop: '16px' }}>
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate('/gallery')}>
        ← Back to Gallery
      </button>

      <div className="design-detail">
        <div className="design-detail-image">
          <img src={`/uploads/${design.image_path}`} alt={design.title} />
        </div>

        <div className="design-detail-info">
          <span className="detail-category">{design.category}</span>
          <h1>{design.title}</h1>

          {design.description && (
            <p className="detail-description">{design.description}</p>
          )}

          <div className="detail-price-stock">
            {design.price > 0 && <span className="detail-price">₹{design.price.toLocaleString()}/kg</span>}
            <div className="detail-stock">
              <span className="stock-label">Available Stock</span>
              <span className="stock-value" style={{ color: getStockColor(design.stock) }}>
                {design.stock} kg
              </span>
            </div>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          {design.stock > 0 ? (
            <>
              <div className="quantity-selector">
                <label>Quantity (kg):</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(0.5, parseFloat((quantity - 0.5).toFixed(1))))}
                    disabled={quantity <= 0.5}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0.5;
                      setQuantity(Math.min(Math.max(0.5, val), design.stock));
                    }}
                    min="0.5"
                    max={design.stock}
                    step="0.5"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(design.stock, parseFloat((quantity + 0.5).toFixed(1))))}
                    disabled={quantity >= design.stock}
                  >
                    +
                  </button>
                </div>
                {design.price > 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                    Total: ₹{(design.price * quantity).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="order-notes">
                <div className="form-group">
                  <label htmlFor="notes">Order Notes (optional)</label>
                  <textarea
                    id="notes"
                    className="form-input"
                    placeholder="Any specific requirements, color preferences, delivery instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleOrder}
                disabled={ordering}
                id="place-order-btn"
              >
                {ordering ? 'Placing Order...' : `Book ${quantity} kg`}
              </button>
            </>
          ) : (
            <div className="alert alert-error">
              🚫 This design is currently out of stock. Please check back later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
