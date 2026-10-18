import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { calculateApi } from '../api/calculateApi';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import useWakeup from '../utils/useWakeup';
import './Dashboard.css';

const TOOLS = [
  {
    id: 'calculator',
    title: 'Calculator',
    desc: 'Bhav & Quantity Calculator: Weight (kg/g/mg), Liquid (L/ml), and Counting (Bricks/Pcs) with on-screen dialpad.',
    icon: '🧮',
    category: 'converters',
    path: '/dashboard/calculator',
    badge: 'Special Calc',
    color: 'var(--teal)'
  },
  {
    id: 'map-auto',
    title: 'Map Auto',
    desc: 'Capture boundaries automatically using real-time GPS path tracking.',
    icon: '🛰️',
    category: 'map',
    path: '/dashboard/map-auto',
    badge: 'Simulator',
    color: 'var(--teal)'
  },
  {
    id: 'map-manual',
    title: 'Map Manual',
    desc: 'Input manual GPS latitude/longitude coordinates to plot custom boundaries.',
    icon: '✍️',
    category: 'map',
    path: '/dashboard/map-manual',
    badge: 'Interactive',
    color: 'var(--teal)'
  },
  {
    id: 'map-draw',
    title: 'Map Draw Calc',
    desc: 'Sketch boundaries manually on an interactive grid canvas to calculate area.',
    icon: '📐',
    category: 'map',
    path: '/dashboard/map-draw',
    badge: 'Interactive',
    color: 'var(--teal)'
  },
  {
    id: 'triangle',
    title: 'Area Triangle',
    desc: 'Calculate triangle area using the base and vertical height formula.',
    icon: '🔺',
    category: 'shapes',
    path: '/dashboard/triangle-area',
    badge: 'Functional',
    color: 'var(--magenta)'
  },
  {
    id: 'rectangle',
    title: 'Area Rectangle',
    desc: 'Calculate rectangle or square area using length and width dimensions.',
    icon: '⏹️',
    category: 'shapes',
    path: '/dashboard/rectangle-area',
    badge: 'Functional',
    color: 'var(--magenta)'
  },
  {
    id: 'area-convert',
    title: 'Area Convert',
    desc: 'Convert area metrics between square meters, square feet, yards, and acres.',
    icon: '🔄',
    category: 'converters',
    path: '/dashboard/area-convert',
    badge: 'Functional',
    color: 'var(--orange)'
  },
  {
    id: 'sq-mt-convert',
    title: 'SQ_MT Convert',
    desc: 'Convert square meters to traditional local subcontinental land measurement units.',
    icon: '🏢',
    category: 'converters',
    path: '/dashboard/convert-sq-mt',
    badge: 'Functional',
    color: 'var(--orange)'
  },
  {
    id: 'length-convert',
    title: 'Length Convert',
    desc: 'Convert distance and length metrics between meters, feet, yards, and miles.',
    icon: '📏',
    category: 'converters',
    path: '/dashboard/length-convert',
    badge: 'Functional',
    color: 'var(--orange)'
  }
];

export default function Dashboard() {
  const { user, logout, saveSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Silently wake up Render backend in background
  useWakeup();

  // Dropdown & Modal States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [calcChooserOpen, setCalcChooserOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Tab Filter State for Tools
  const [filter, setFilter] = useState('all');

  // Filtered tools computed property
  const filteredTools = filter === 'all' 
    ? TOOLS 
    : TOOLS.filter(t => t.category === filter);

  // Calculation History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchHistory = async (page = 0) => {
    setHistoryLoading(true);
    try {
      const res = await calculateApi.getHistory(page, 10);
      if (res.data.success) {
        setHistoryList(res.data.data.content);
        setHistoryPage(res.data.data.number);
        setHistoryTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch calculation history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'history') {
      fetchHistory(0);
    }
  }, [filter]);

  const handleDeleteHistory = async (id) => {
    try {
      const res = await calculateApi.deleteHistoryItem(id);
      if (res.data.success) {
        setHistoryList(prev => prev.filter(item => item.id !== id));
        setToast({ type: 'success', message: 'History record deleted successfully' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete history record' });
    }
  };

  // Edit Profile Form State
  const [form, setForm] = useState({
    fullName: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [picPreview, setPicPreview] = useState(null); // base64 preview of selected pic
  // Notification state for Google users without password
  const [showPasswordNotice, setShowPasswordNotice] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (user && !user.profileSetup) {
      navigate('/profile-setup', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Intercept browser back button to redirect to /home instead of Google Sign-in page
  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.pathname);
      navigate('/home', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Sync edit profile form with user details when modal opens
  useEffect(() => {
    if (user && modalOpen) {
      setForm({
        fullName: user.fullName || '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPicPreview(null); // reset preview on each modal open
      setErrors({});
    }
  }, [user, modalOpen]);

  // Show password notification to Google users who haven't set a password
  useEffect(() => {
    if (user && user.provider === 'GOOGLE' && !user.hasPassword) {
      setShowPasswordNotice(true);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowConfirm(true);
  };

  const confirmSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  // Convert selected image file to base64 for preview & upload
  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image size 2MB se kam honi chahiye.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.newPassword) {
      if (form.newPassword.length < 8) {
        e.newPassword = 'New password must be at least 8 characters';
      }
      if (form.newPassword !== form.confirmNewPassword) {
        e.confirmNewPassword = 'Passwords do not match';
      }
    }
    return e;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        fullName: form.fullName.trim(),
        newPassword: form.newPassword || null,
        confirmNewPassword: form.confirmNewPassword || null,
        pictureUrl: picPreview || null, // send base64 if user picked a new pic
      });
      
      const updatedUser = res.data.data;
      const token = localStorage.getItem('ac_token');
      saveSession(token, updatedUser);
      // Hide password notice after setting password
      if (form.newPassword) setShowPasswordNotice(false);
      
      setToast({ type: 'success', message: 'Profile updated successfully!' });
      setModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Get initials for avatar
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  // Profile picture URL (Google pic or null)
  const avatarPic = user.pictureUrl || null;

  return (
    <div className="dashboard">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Nav Header ─────────────────────────────────────────── */}
      <header className="dashboard-header">
        <Link to="/home" className="dashboard-logo" style={{ textDecoration: 'none' }}>
          <span className="logo-icon">◈</span>
          <span className="logo-text">AreaCalculator</span>
        </Link>

        <div className="dashboard-actions">
          <div className="profile-avatar-container" ref={dropdownRef}>
            <div className="profile-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {avatarPic
                ? <img src={avatarPic} alt="profile" className="profile-avatar-img" referrerPolicy="no-referrer" />
                : initials
              }
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-name">{user.fullName || 'User'}</div>
                  <div className="dropdown-email">{user.email}</div>
                </div>
                <Link
                  className="dropdown-item"
                  to="/home"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', textAlign: 'left' }}
                >
                  🏠 Go to Home
                </Link>
                {(user.admin || user.isAdmin) && (
                  <Link
                    className="dropdown-item"
                    to="/dashboard/admin"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', textAlign: 'left' }}
                  >
                    ⚙️ Admin Panel
                  </Link>
                )}
                <button
                  className="dropdown-item"
                  onClick={() => { setModalOpen(true); setDropdownOpen(false); }}
                >
                  👤 Edit Profile
                </button>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Dashboard ────────────────────────────────────── */}
      <main className="dashboard-main">
        <div className="dashboard-badges-row">
          <div className="welcome-badge">Phase 1 & 2 Complete ✓</div>
          <div className="org-shimmer-badge" title="msm.movin 2022 ORG">
            <span className="org-shimmer-dot" />
            <span className="org-shimmer-text">msm.movin 2022 ORG</span>
          </div>
        </div>
        <h1 className="dashboard-heading">
          Welcome, <span style={{ color: 'var(--teal)' }}>{user.fullName || user.email}</span>!
        </h1>
        
        {/* Account Info Ribbon */}
        <div className="user-profile-bar">
          <div className="profile-bar-item">
            <span className="profile-bar-label">Email</span>
            <span className="profile-bar-value">{user.email}</span>
          </div>
          <div className="profile-bar-item">
            <span className="profile-bar-label">Method</span>
            <span className="profile-bar-value">{user.provider}</span>
          </div>
          <div className="profile-bar-item">
            <span className="profile-bar-label">Status</span>
            <span className="profile-bar-value status-verified" style={{ color: user.verified ? 'var(--teal)' : 'var(--magenta)' }}>
              {user.verified ? 'Verified ✓' : 'Unverified'}
            </span>
          </div>
        </div>

        {/* Google Password Notification Banner */}
        {showPasswordNotice && (
          <div className="google-password-notice">
            <div className="notice-content">
              <span className="notice-icon">🔐</span>
              <div className="notice-text">
                <strong>Password Setup Recommended</strong>
                <span>Aapne Google se login kiya hai. Agar aap email + password se bhi login karna chahte hain to <button className="notice-link" onClick={() => { setModalOpen(true); setShowPasswordNotice(false); }}>Edit Profile</button> me jakar password set karein.</span>
              </div>
              <button className="notice-close" onClick={() => setShowPasswordNotice(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Dashboard Tools Suite */}
        <div className="tools-section">
          <div className="section-header">
            <h2 className="section-title">Calculator & Converter Suite</h2>
            <div className="filter-tabs">
              <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`filter-tab ${filter === 'map' ? 'active' : ''}`} onClick={() => setFilter('map')}>Map Tools</button>
              <button className={`filter-tab ${filter === 'shapes' ? 'active' : ''}`} onClick={() => setFilter('shapes')}>Shapes</button>
              <button className={`filter-tab ${filter === 'converters' ? 'active' : ''}`} onClick={() => setFilter('converters')}>Converters</button>
              <button className={`filter-tab ${filter === 'history' ? 'active' : ''}`} onClick={() => setFilter('history')}>History 🕒</button>
            </div>
          </div>

          {filter === 'history' ? (
            <div className="history-container">
              {historyLoading ? (
                <div className="loading-state" style={{ color: 'var(--teal)', padding: '40px', textAlign: 'center', fontSize: '1.1rem' }}>
                  Loading history...
                </div>
              ) : historyList.length === 0 ? (
                <div className="empty-state" style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  No calculations saved yet. Start calculating to see history here!
                </div>
              ) : (
                <>
                  <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {historyList.map((item) => (
                      <div key={item.id} className="history-card glass-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <span className="status-badge functional" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {item.calculationType}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          <button 
                            onClick={() => handleDeleteHistory(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', transition: 'transform 0.2s', padding: '4px' }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            title="Delete history record"
                          >
                            🗑️
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                          <div style={{ color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--teal)' }}>Inputs:</strong> {item.inputData}
                          </div>
                          <div style={{ color: '#fff' }}>
                            <strong style={{ color: 'var(--magenta)' }}>Result:</strong> {item.resultData}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {historyTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                      <button 
                        disabled={historyPage === 0} 
                        onClick={() => fetchHistory(historyPage - 1)}
                        className="tool-btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Previous
                      </button>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Page {historyPage + 1} of {historyTotalPages}
                      </span>
                      <button 
                        disabled={historyPage >= historyTotalPages - 1} 
                        onClick={() => fetchHistory(historyPage + 1)}
                        className="tool-btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="tools-grid">
              {filteredTools.map((tool) => (
                <div 
                  key={tool.id} 
                  className="tool-card" 
                  onClick={() => {
                    if (tool.id === 'calculator') {
                      setCalcChooserOpen(true);
                    } else {
                      navigate(tool.path);
                    }
                  }}
                  style={{ '--tool-glow-color': tool.color }}
                >
                  <div className="tool-card-glow" />
                  <div className="tool-card-header">
                    <span className="tool-card-icon">{tool.icon}</span>
                    <span className={`status-badge ${tool.badge === 'Functional' ? 'functional' : tool.badge === 'Simulator' ? 'simulated' : 'beta'}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="tool-card-title">{tool.title}</h3>
                  <p className="tool-card-desc">{tool.desc}</p>
                  <div className="tool-card-footer">
                    <span className="tool-card-action">Launch Calculator →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Calculator Category Chooser Modal ─────────────────── */}
      {calcChooserOpen && (
        <div className="modal-overlay" onClick={() => setCalcChooserOpen(false)}>
          <div className="modal-card calc-chooser-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calc-chooser-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>🧮</span>
                <div>
                  <h2 className="modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>Select Calculator</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Choose a category to start calculating:
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="notice-close" 
                onClick={() => setCalcChooserOpen(false)}
                style={{ fontSize: '1.3rem', padding: '4px 8px', cursor: 'pointer' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="calc-chooser-options">
              {/* Option 1: Weight */}
              <div 
                className="calc-option-card"
                onClick={() => {
                  setCalcChooserOpen(false);
                  navigate('/dashboard/calculator?category=weight');
                }}
              >
                <div className="calc-option-icon">⚖️</div>
                <div className="calc-option-content">
                  <div className="calc-option-title">Weight Calculator</div>
                  <div className="calc-option-desc">Kilogram (kg), Gram (g), Milligram (mg), Quintal</div>
                  <div className="calc-option-tag">Grocery, Farm Produce, Cement & Iron</div>
                </div>
                <div className="calc-option-arrow">➔</div>
              </div>

              {/* Option 2: Liquid / Volume */}
              <div 
                className="calc-option-card"
                onClick={() => {
                  setCalcChooserOpen(false);
                  navigate('/dashboard/calculator?category=liquid');
                }}
              >
                <div className="calc-option-icon">🥛</div>
                <div className="calc-option-content">
                  <div className="calc-option-title">Liquid / Volume Calculator</div>
                  <div className="calc-option-desc">Litre (L), Millilitre (ml)</div>
                  <div className="calc-option-tag">Milk, Edible Oil, Paint & Chemicals</div>
                </div>
                <div className="calc-option-arrow">➔</div>
              </div>

              {/* Option 3: Counting */}
              <div 
                className="calc-option-card"
                onClick={() => {
                  setCalcChooserOpen(false);
                  navigate('/dashboard/calculator?category=count');
                }}
              >
                <div className="calc-option-icon">🧱</div>
                <div className="calc-option-content">
                  <div className="calc-option-title">Counting & Units Calculator</div>
                  <div className="calc-option-desc">Bricks, Pieces (Pcs), Dozen (12), Bags</div>
                  <div className="calc-option-tag">Bricks, Floor Tiles, Sacks & Items</div>
                </div>
                <div className="calc-option-arrow">➔</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <p className="modal-desc">Update your personal details and password.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="auth-form" noValidate>

              {/* Profile Picture Upload */}
              <div className="modal-avatar-section">
                <div
                  className="modal-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change profile picture"
                >
                  {picPreview
                    ? <img src={picPreview} alt="preview" className="modal-avatar-img" />
                    : avatarPic
                      ? <img src={avatarPic} alt="profile" className="modal-avatar-img" referrerPolicy="no-referrer" />
                      : <span className="modal-avatar-initials">{initials}</span>
                  }
                  <div className="modal-avatar-overlay">
                    <span>📷</span>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePicChange}
                  id="profile-pic-input"
                />
                <p className="modal-avatar-hint">
                  {picPreview ? '✓ Nai photo selected' : 'Photo change karne ke liye click karein'}
                </p>
                {picPreview && (
                  <button
                    type="button"
                    className="modal-avatar-remove"
                    onClick={() => { setPicPreview(null); fileInputRef.current.value = ''; }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Full Name */}
              <div className="form-group">
                <InputField
                  id="edit-fullname"
                  name="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleFormChange}
                  icon="👤"
                  error={errors.fullName}
                />
              </div>

              {/* Password change instructions */}
              <div style={{ margin: '20px 0 10px', fontSize: '0.8rem', color: 'var(--teal)', fontWeight: '600' }}>
                CHANGE PASSWORD (optional)
              </div>
              {user.provider === 'GOOGLE' && !user.hasPassword && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', padding: '8px 12px', background: 'rgba(46,230,197,0.05)', borderRadius: '8px', border: '1px solid rgba(46,230,197,0.15)' }}>
                  💡 Google account hai — password set karne ke baad email + password se bhi login ho sakenge.
                </div>
              )}

              {/* New Password */}
              <div className="form-group">
                <InputField
                  id="edit-new-password"
                  name="newPassword"
                  type="password"
                  placeholder="New Password (min. 8 characters)"
                  value={form.newPassword}
                  onChange={handleFormChange}
                  icon="🔒"
                  error={errors.newPassword}
                />
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <InputField
                  id="edit-confirm-password"
                  name="confirmNewPassword"
                  type="password"
                  placeholder="Confirm New Password"
                  value={form.confirmNewPassword}
                  onChange={handleFormChange}
                  icon="🔒"
                  error={errors.confirmNewPassword}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <PrimaryButton type="submit" loading={loading} id="edit-profile-save-btn">
                  Save Changes
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={confirmSignOut}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
