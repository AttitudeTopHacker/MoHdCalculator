import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout, saveSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Dropdown & Modal States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Edit Profile Form State
  const [form, setForm] = useState({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
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

  // Sync edit profile form with user details when modal opens
  useEffect(() => {
    if (user && modalOpen) {
      setForm({
        fullName: user.fullName || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setErrors({});
    }
  }, [user, modalOpen]);

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
    logout();
    navigate('/login');
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.newPassword) {
      if (user.provider === 'LOCAL' && !form.currentPassword) {
        e.currentPassword = 'Current password is required to change password';
      }
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
        currentPassword: form.currentPassword || null,
        newPassword: form.newPassword || null,
        confirmNewPassword: form.confirmNewPassword || null,
      });
      
      const updatedUser = res.data.data;
      const token = localStorage.getItem('ac_token');
      saveSession(token, updatedUser);
      
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
        <div className="dashboard-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">AreaCalculator</span>
        </div>

        <div className="dashboard-actions">
          <div className="profile-avatar-container" ref={dropdownRef}>
            <div className="profile-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
              {initials}
            </div>

            {dropdownOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-name">{user.fullName || 'User'}</div>
                  <div className="dropdown-email">{user.email}</div>
                </div>
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
        <div className="welcome-badge">Phase 1 Complete ✓</div>
        <h1 className="dashboard-heading">
          Welcome, <span style={{ color: 'var(--teal)' }}>{user.fullName || user.email}</span>!
        </h1>
        <p className="dashboard-subtitle">
          Authentication is live. Calculator features coming soon.
        </p>

        <div className="dashboard-cards">
          <div className="dash-card">
            <div className="dash-card-icon">✉</div>
            <div className="dash-card-label">Email</div>
            <div className="dash-card-value">{user.email}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">🔐</div>
            <div className="dash-card-label">Auth Method</div>
            <div className="dash-card-value">{user.provider}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">✓</div>
            <div className="dash-card-label">Status</div>
            <div className="dash-card-value" style={{ color: 'var(--teal)' }}>
              {user.verified ? 'Verified' : 'Unverified'}
            </div>
          </div>
        </div>
      </main>

      {/* ── Edit Profile Modal ────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <p className="modal-desc">Update your personal details and password.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="auth-form" noValidate>
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

              {/* Current Password (if local) */}
              {user.provider === 'LOCAL' && (
                <div className="form-group">
                  <InputField
                    id="edit-current-password"
                    name="currentPassword"
                    type="password"
                    placeholder="Current Password"
                    value={form.currentPassword}
                    onChange={handleFormChange}
                    icon="🔒"
                    error={errors.currentPassword}
                  />
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
    </div>
  );
}
