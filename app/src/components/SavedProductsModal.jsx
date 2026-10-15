import { useState, useEffect, useMemo } from 'react';
import { getSavedProducts, saveProduct, deleteProduct } from '../utils/savedProducts';
import { showToast } from '../utils/toast';
import './SavedProductsModal.css';

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '📦' },
  { id: 'weight', label: 'Weight', icon: '⚖️' },
  { id: 'liquid', label: 'Liquid', icon: '🥛' },
  { id: 'count', label: 'Pieces (Pies)', icon: '🧱' }
];

const UNIT_OPTIONS = {
  weight: [
    { id: 'kg', label: 'Kilogram (kg)' },
    { id: 'g', label: 'Gram (g)' },
    { id: 'mg', label: 'Milligram (mg)' },
    { id: 'quintal', label: 'Quintal (100 kg)' }
  ],
  liquid: [
    { id: 'L', label: 'Litre (L)' },
    { id: 'ml', label: 'Millilitre (ml)' }
  ],
  count: [
    { id: 'bricks', label: 'Bricks (Pcs)' },
    { id: 'pcs', label: 'Pieces (Pcs)' },
    { id: 'dozen', label: 'Dozen (12 Pcs)' },
    { id: 'bag', label: 'Bag / Sack' }
  ]
};

export default function SavedProductsModal({
  isOpen,
  onClose,
  onLoadProduct,
  initialCategory = 'all',
  initialMode = 'list',
  presetProductData = null
}) {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('weight');
  const [formPrice, setFormPrice] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('kg');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Load products on modal open or refresh
  useEffect(() => {
    if (isOpen) {
      const list = getSavedProducts();
      setProducts(list);
      setDeleteConfirmId(null);

      if (initialMode === 'add') {
        // Preset form with current calculator values if passed
        setIsFormOpen(true);
        setEditingId(null);
        setFormName(presetProductData?.name || '');
        setFormCategory(presetProductData?.category || 'weight');
        setFormPrice(presetProductData?.price || '');
        setFormQty(presetProductData?.qty || '1');
        setFormUnit(presetProductData?.unit || (presetProductData?.category === 'liquid' ? 'L' : presetProductData?.category === 'count' ? 'bricks' : 'kg'));
      } else {
        setIsFormOpen(false);
        setActiveTab(initialCategory || 'all');
      }
    }
  }, [isOpen, initialCategory, initialMode, presetProductData]);

  // When form category changes, adjust unit if current unit not in that category
  const handleCategoryChange = (newCat) => {
    setFormCategory(newCat);
    const validUnits = UNIT_OPTIONS[newCat] || [];
    if (!validUnits.some(u => u.id === formUnit)) {
      setFormUnit(validUnits[0]?.id || 'kg');
    }
  };

  // Open Edit Form
  const handleOpenEdit = (product, e) => {
    e.stopPropagation();
    setEditingId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormQty(product.qty);
    setFormUnit(product.unit);
    setIsFormOpen(true);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    const targetCat = activeTab !== 'all' ? activeTab : 'weight';
    setFormCategory(targetCat);
    setFormPrice('');
    setFormQty('1');
    setFormUnit(UNIT_OPTIONS[targetCat]?.[0]?.id || 'kg');
    setIsFormOpen(true);
  };

  // Close Form
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Submit Form
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }
    const p = parseFloat(formPrice);
    if (isNaN(p) || p <= 0) {
      showToast('Please enter a valid price (₹)', 'error');
      return;
    }
    const q = parseFloat(formQty);
    if (isNaN(q) || q <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    const payload = {
      id: editingId,
      name: formName.trim(),
      category: formCategory,
      price: String(formPrice).trim(),
      qty: String(formQty).trim(),
      unit: formUnit
    };

    const updated = saveProduct(payload);
    setProducts(updated);
    setIsFormOpen(false);
    setEditingId(null);
    showToast(editingId ? 'Product updated successfully!' : 'Product saved successfully!', 'success');
  };

  // Delete product
  const handleDeleteProduct = (productId, e) => {
    e.stopPropagation();
    const updated = deleteProduct(productId);
    setProducts(updated);
    setDeleteConfirmId(null);
    showToast('Product deleted!', 'info');
  };

  // Load product into calculator
  const handleSelectProduct = (product) => {
    if (onLoadProduct) {
      onLoadProduct(product);
    }
    onClose();
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category tab filter
      if (activeTab !== 'all' && p.category !== activeTab) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchPrice = p.price.toString().includes(query);
        const matchUnit = p.unit.toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        return matchName || matchPrice || matchUnit || matchCat;
      }
      return true;
    });
  }, [products, activeTab, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: products.length, weight: 0, liquid: 0, count: 0 };
    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products]);

  if (!isOpen) return null;

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div 
        className="sp-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-modal-title"
      >
        {/* Header */}
        <div className="sp-modal-header">
          <div className="sp-modal-header-left">
            <span className="sp-modal-icon-badge">📦</span>
            <div className="sp-modal-title-group">
              <h2 id="sp-modal-title" className="sp-modal-title">
                <span>Products</span>
                <span className="sp-count-badge">{products.length}</span>
              </h2>
            </div>
          </div>

          <div className="sp-header-actions">
            {!isFormOpen && (
              <button
                type="button"
                className="sp-btn-new-product"
                onClick={handleOpenAdd}
                id="btn-add-product"
              >
                <span>➕ Add Product</span>
              </button>
            )}
            <button
              type="button"
              className="sp-btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="sp-modal-body">
          {/* Add / Edit Form Panel */}
          {isFormOpen ? (
            <div className="sp-form-container">
              <h3 className="sp-form-title">
                <span>{editingId ? '✏️ Update Product' : '➕ Save New Product'}</span>
              </h3>
              
              <form onSubmit={handleSubmitForm}>
                <div className="sp-form-grid">
                  {/* Category Selector Tabs */}
                  <div className="sp-form-group full-width">
                    <label className="sp-form-label">Category</label>
                    <div className="sp-category-selector-tabs">
                      <button
                        type="button"
                        className={`sp-category-tab-btn ${formCategory === 'weight' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('weight')}
                      >
                        <span>⚖️ Weight</span>
                      </button>
                      <button
                        type="button"
                        className={`sp-category-tab-btn ${formCategory === 'liquid' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('liquid')}
                      >
                        <span>🥛 Liquid</span>
                      </button>
                      <button
                        type="button"
                        className={`sp-category-tab-btn ${formCategory === 'count' ? 'active' : ''}`}
                        onClick={() => handleCategoryChange('count')}
                      >
                        <span>🧱 Pieces (Pies)</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="sp-form-group full-width">
                    <label className="sp-form-label">Product Name *</label>
                    <input
                      type="text"
                      className="sp-form-input"
                      placeholder="e.g. Basmati Rice, Mustard Oil, Red Bricks..."
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Rate Price */}
                  <div className="sp-form-group">
                    <label className="sp-form-label">Price (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      className="sp-form-input"
                      placeholder="e.g. 80"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>

                  {/* Quantity & Unit in same row */}
                  <div className="sp-form-group">
                    <label className="sp-form-label">Per Quantity & Unit *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        step="any"
                        className="sp-form-input"
                        style={{ width: '80px', flexShrink: 0 }}
                        placeholder="1"
                        value={formQty}
                        onChange={(e) => setFormQty(e.target.value)}
                        required
                      />
                      <select
                        className="sp-form-select"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                      >
                        {(UNIT_OPTIONS[formCategory] || []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="sp-form-actions">
                  <button
                    type="button"
                    className="sp-btn-cancel"
                    onClick={handleCancelForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sp-btn-save"
                    id="btn-save-product-submit"
                  >
                    <span>{editingId ? '✓ Update Product' : '💾 Save Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="sp-search-bar">
                <span className="sp-search-icon">🔍</span>
                <input
                  type="text"
                  className="sp-search-input"
                  placeholder="Search products by name or price (₹)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="input-product-search"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="sp-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="sp-filter-tabs" role="tablist">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const count = tabCounts[tab.id] || 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      id={`sp-tab-${tab.id}`}
                      className={`sp-filter-tab ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span>{tab.icon} {tab.label}</span>
                      <span className="sp-tab-badge">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cards List */}
              <div className="sp-cards-list">
                {filteredProducts.length === 0 ? (
                  <div className="sp-empty-state">
                    <div className="sp-empty-icon">📦</div>
                    <div className="sp-empty-title">No products found</div>
                    <div className="sp-empty-subtitle">
                      {searchQuery
                        ? `No results match "${searchQuery}" in this category.`
                        : 'No saved products in this category yet.'}
                    </div>
                    <button
                      type="button"
                      className="sp-btn-new-product"
                      onClick={handleOpenAdd}
                    >
                      <span>➕ Add First Product</span>
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const isConfirmingDelete = deleteConfirmId === product.id;
                    const catClass = product.category === 'liquid'
                      ? 'sp-cat-liquid'
                      : product.category === 'count'
                      ? 'sp-cat-count'
                      : 'sp-cat-weight';
                    const catIcon = product.category === 'liquid'
                      ? '🥛'
                      : product.category === 'count'
                      ? '🧱'
                      : '⚖️';
                    const catName = product.category === 'count'
                      ? 'Pieces'
                      : product.category === 'liquid'
                      ? 'Liquid'
                      : 'Weight';

                    return (
                      <div 
                        key={product.id} 
                        className="sp-product-card"
                        id={`card-product-${product.id}`}
                      >
                        <div className="sp-card-info">
                          <div className="sp-card-top-row">
                            <span className={`sp-category-pill ${catClass}`}>
                              <span>{catIcon}</span>
                              <span>{catName}</span>
                            </span>
                            <h4 className="sp-product-name" title={product.name}>
                              {product.name}
                            </h4>
                          </div>

                          <div className="sp-card-rate-details">
                            <span className="sp-card-price">₹ {product.price}</span>
                            <span className="sp-card-divider">per</span>
                            <span className="sp-card-qty">{product.qty} {product.unit}</span>
                          </div>

                          {/* Delete Confirmation Inline */}
                          {isConfirmingDelete && (
                            <div className="sp-delete-confirm-box" onClick={(e) => e.stopPropagation()}>
                              <span className="sp-delete-confirm-text">
                                Delete "{product.name}"?
                              </span>
                              <div className="sp-delete-confirm-actions">
                                <button
                                  type="button"
                                  className="sp-btn-cancel-delete"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="sp-btn-confirm-delete"
                                  onClick={(e) => handleDeleteProduct(product.id, e)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="sp-card-actions">
                          <button
                            type="button"
                            className="sp-btn-load"
                            id={`btn-load-prod-${product.id}`}
                            onClick={() => handleSelectProduct(product)}
                            title="Load into Calculator"
                          >
                            <span>⚡ Load</span>
                          </button>
                          
                          <button
                            type="button"
                            className="sp-btn-icon-action"
                            id={`btn-edit-prod-${product.id}`}
                            onClick={(e) => handleOpenEdit(product, e)}
                            title="Edit Product"
                            aria-label="Edit"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className="sp-btn-icon-action sp-btn-delete"
                            id={`btn-del-prod-${product.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(product.id);
                            }}
                            title="Delete Product"
                            aria-label="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
