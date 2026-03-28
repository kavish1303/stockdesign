import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { designsAPI } from '../api';

export default function Gallery() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadDesigns();
    loadCategories();
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [search, category]);

  const loadDesigns = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const data = await designsAPI.getAll(params);
      setDesigns(data);
    } catch (err) {
      console.error('Failed to load designs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await designsAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const getStockBadgeClass = (stock) => {
    if (stock === 0) return 'stock-badge out-of-stock';
    if (stock < 3) return 'stock-badge low-stock';
    return 'stock-badge in-stock';
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 3) return `Only ${stock} kg left`;
    return `${stock} kg in stock`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Design Gallery</h1>
          <p>Browse our exclusive collection of fabric patterns and designs</p>
        </div>
      </div>

      <div className="gallery-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search designs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-designs"
          />
        </div>

        <div className="category-filter">
          <button
            className={`category-chip ${category === 'All' ? 'active' : ''}`}
            onClick={() => setCategory('All')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : designs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>No designs found</h3>
          <p>
            {search || category !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'No designs have been uploaded yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="design-grid">
          {designs.map((design) => (
            <Link
              key={design.id}
              to={`/design/${design.id}`}
              className="design-card"
              id={`design-card-${design.id}`}
            >
              <div className="design-card-image">
                <img
                  src={`/uploads/${design.image_path}`}
                  alt={design.title}
                />
                <span className={getStockBadgeClass(design.stock)}>
                  {getStockText(design.stock)}
                </span>
              </div>
              <div className="design-card-body">
                <span className="design-category">{design.category}</span>
                <h3>{design.title}</h3>
              </div>
              <div className="design-card-footer">
                {design.price > 0 && <span className="design-price">₹{design.price.toLocaleString()}/kg</span>}
                <span className="design-stock-count">{design.stock} kg</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
