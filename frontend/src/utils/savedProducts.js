// ─────────────────────────────────────────────────────────────
// Saved Products Storage Helper
// Manages custom products saved by user in localStorage.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ac_saved_products_list';

// Default starter products so user has instant examples
export const DEFAULT_PRODUCTS = [
  // ⚖️ Weight items
  {
    id: 'prod_w1',
    name: 'Wheat Flour (Aata)',
    category: 'weight',
    price: '40',
    qty: '1',
    unit: 'kg',
    updatedAt: 1710000000001
  },
  {
    id: 'prod_w2',
    name: 'Basmati Rice (Chawal)',
    category: 'weight',
    price: '85',
    qty: '1',
    unit: 'kg',
    updatedAt: 1710000000002
  },
  {
    id: 'prod_w3',
    name: 'Sugar (Cheeni)',
    category: 'weight',
    price: '44',
    qty: '1',
    unit: 'kg',
    updatedAt: 1710000000003
  },
  {
    id: 'prod_w4',
    name: 'Tea (Chai Patti)',
    category: 'weight',
    price: '120',
    qty: '250',
    unit: 'g',
    updatedAt: 1710000000004
  },

  // 🥛 Liquid items
  {
    id: 'prod_l1',
    name: 'Mustard Oil (Sarson Tel)',
    category: 'liquid',
    price: '145',
    qty: '1',
    unit: 'L',
    updatedAt: 1710000000005
  },
  {
    id: 'prod_l2',
    name: 'Full Cream Milk (Doodh)',
    category: 'liquid',
    price: '66',
    qty: '1',
    unit: 'L',
    updatedAt: 1710000000006
  },
  {
    id: 'prod_l3',
    name: 'Desi Ghee',
    category: 'liquid',
    price: '650',
    qty: '1',
    unit: 'L',
    updatedAt: 1710000000007
  },

  // 🧱 Count / Pieces items (Pies)
  {
    id: 'prod_c1',
    name: 'Red Bricks (Lal Eent)',
    category: 'count',
    price: '4500',
    qty: '1000',
    unit: 'bricks',
    updatedAt: 1710000000008
  },
  {
    id: 'prod_c2',
    name: 'Cement Bag (Ultratech)',
    category: 'count',
    price: '380',
    qty: '1',
    unit: 'bag',
    updatedAt: 1710000000009
  },
  {
    id: 'prod_c3',
    name: 'Floor Tiles Box',
    category: 'count',
    price: '650',
    qty: '1',
    unit: 'pcs',
    updatedAt: 1710000000010
  },
  {
    id: 'prod_c4',
    name: 'Eggs (Anda)',
    category: 'count',
    price: '72',
    qty: '1',
    unit: 'dozen',
    updatedAt: 1710000000011
  }
];

/**
 * Get all saved products from localStorage.
 * Initializes with DEFAULT_PRODUCTS if first run.
 */
export function getSavedProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_PRODUCTS;
  } catch (err) {
    console.error('Failed to read saved products from localStorage', err);
    return DEFAULT_PRODUCTS;
  }
}

/**
 * Save or update a product.
 * @param {Object} product - { id?, name, category, price, qty, unit }
 * @returns {Array} Updated list of products
 */
export function saveProduct(product) {
  try {
    const products = getSavedProducts();
    const cleanProduct = {
      name: (product.name || 'Unnamed Product').trim(),
      category: product.category || 'weight',
      price: String(product.price || '0').trim(),
      qty: String(product.qty || '1').trim(),
      unit: product.unit || (product.category === 'liquid' ? 'L' : product.category === 'count' ? 'bricks' : 'kg'),
      updatedAt: Date.now()
    };

    let updatedList;
    if (product.id) {
      // Update existing
      updatedList = products.map((item) =>
        item.id === product.id ? { ...cleanProduct, id: product.id } : item
      );
    } else {
      // Add new
      const newProduct = {
        ...cleanProduct,
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      };
      updatedList = [newProduct, ...products];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch (err) {
    console.error('Failed to save product to localStorage', err);
    return getSavedProducts();
  }
}

/**
 * Delete a product by ID.
 * @param {string} productId
 * @returns {Array} Updated list of products
 */
export function deleteProduct(productId) {
  try {
    const products = getSavedProducts();
    const filtered = products.filter((item) => item.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete product from localStorage', err);
    return getSavedProducts();
  }
}

/**
 * Reset products back to factory defaults.
 */
export function resetSavedProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}
