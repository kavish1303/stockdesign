import { useState, useEffect } from 'react';
import { designsAPI } from '../../api';

export default function ManageDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [tempStock, setTempStock] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const data = await designsAPI.getAll();
      setDesigns(data);
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStock('');
    setPrice('');
    setCategory('General');
    setImageFile(null);
    setImagePreview('');
    setEditingDesign(null);
    setError('');
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (design) => {
    setEditingDesign(design);
    setTitle(design.title);
    setDescription(design.description || '');
    setStock(design.stock.toString());
    setPrice(design.price.toString());
    setCategory(design.category || 'General');
    setImagePreview(`/uploads/${design.image_path}`);
    setImageFile(null);
    setShowModal(true);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('stock', stock);
      formData.append('price', price);
      formData.append('category', category);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingDesign) {
        await designsAPI.update(editingDesign.id, formData);
        setSuccess('Design updated successfully!');
      } else {
        if (!imageFile) {
          setError('Please upload an image.');
          setSubmitting(false);
          return;
        }
        await designsAPI.create(formData);
        setSuccess('Design added successfully!');
      }

      setShowModal(false);
      resetForm();
      loadDesigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    try {
      await designsAPI.delete(id);
      setSuccess('Design deleted successfully!');
      loadDesigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditStock = (design) => {
    setEditingStock(design.id);
    setTempStock(design.stock.toString());
  };

  const saveStock = async (designId) => {
    try {
      const formData = new FormData();
      formData.append('stock', tempStock);
      await designsAPI.update(designId, formData);
      setEditingStock(null);
      loadDesigns();
      setSuccess('Stock updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    }
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
      <div className="manage-header">
        <div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Manage Designs
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upload, edit, and manage your fabric designs</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} id="add-design-btn">
          ➕ Add New Design
        </button>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}
      {error && !showModal && <div className="alert alert-error">⚠️ {error}</div>}

      {designs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No designs yet</h3>
          <p>Upload your first design to get started!</p>
          <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: '16px' }}>
            ➕ Add First Design
          </button>
        </div>
      ) : (
        designs.map((design) => (
          <div key={design.id} className="design-manage-card" id={`manage-design-${design.id}`}>
            <img src={`/uploads/${design.image_path}`} alt={design.title} />
            <div className="design-manage-info">
              <h3>{design.title}</h3>
              <div className="manage-meta">
                <span>{design.category}</span>
                {design.price > 0 && <span>₹{design.price.toLocaleString()}/kg</span>}
                <span>
                  Stock:{' '}
                  {editingStock === design.id ? (
                    <span className="inline-edit">
                      <input
                        type="number"
                        value={tempStock}
                        onChange={(e) => setTempStock(e.target.value)}
                        min="0"
                        step="0.1"
                        autoFocus
                      />
                      <button className="btn btn-success btn-sm" onClick={() => saveStock(design.id)}>✓</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingStock(null)}>✕</button>
                    </span>
                  ) : (
                    <span
                      onClick={() => startEditStock(design)}
                      style={{
                        cursor: 'pointer',
                        color: design.stock === 0 ? 'var(--danger)' : design.stock < 3 ? 'var(--warning)' : 'var(--success)',
                        fontWeight: 700,
                        borderBottom: '1px dashed currentColor'
                      }}
                      title="Click to edit stock"
                    >
                      {design.stock} kg
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="design-manage-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(design)}>
                ✏️ Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(design.id)}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDesign ? 'Edit Design' : 'Add New Design'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Design Image</label>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="design-image-upload"
                  />
                  {imagePreview ? (
                    <div className="file-upload-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  ) : (
                    <>
                      <div className="upload-icon">📤</div>
                      <p>Click or drag to upload an image</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>JPEG, PNG, WebP • Max 10MB</p>
                    </>
                  )}
                  {imageFile && <p className="file-name">{imageFile.name}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="design-title">Title *</label>
                <input
                  id="design-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Paisley Silk Pattern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="design-desc">Description</label>
                <textarea
                  id="design-desc"
                  className="form-input"
                  placeholder="Describe the design, fabric type, colors..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label htmlFor="design-stock">Stock (kg) *</label>
                  <input
                    id="design-stock"
                    type="number"
                    className="form-input"
                    placeholder="e.g., 10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="design-price">Price per kg (₹)</label>
                  <input
                    id="design-price"
                    type="number"
                    className="form-input"
                    placeholder="Optional"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="design-category">Category</label>
                <select
                  id="design-category"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Silk">Silk</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Wool">Wool</option>
                  <option value="Linen">Linen</option>
                  <option value="Embroidered">Embroidered</option>
                  <option value="Printed">Printed</option>
                  <option value="Woven">Woven</option>
                  <option value="Digital Print">Digital Print</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {submitting
                    ? (editingDesign ? 'Updating...' : 'Adding...')
                    : (editingDesign ? 'Update Design' : 'Add Design')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
