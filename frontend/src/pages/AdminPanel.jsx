import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import './AdminPanel.css';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tabs: 'users' or 'team'
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // Team State
  const [team, setTeam] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: '', email: '', about: '' });
  const [teamPic, setTeamPic] = useState(null); // base64
  const [teamLoading, setTeamLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, suspended: 0, teamCount: 0 });

  // Confirmation Modal State
  const [confirm, setConfirm] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: null
  });

  // Notifications
  const [toast, setToast] = useState(null);

  // Crop Modal State
  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: '',
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchTeam();
  }, []);

  // Recalculate stats whenever users or team lists change
  useEffect(() => {
    const totalUsers = users.length;
    const suspended = users.filter((u) => u.suspended).length;
    const teamCount = team.length;
    setStats({ totalUsers, suspended, teamCount });
  }, [users, team]);

  const fetchUsers = async (query = search) => {
    setUserLoading(true);
    try {
      const res = await adminApi.getUsers(query);
      setUsers(res.data.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch users.' });
    } finally {
      setUserLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await adminApi.publicGetTeam();
      setTeam(res.data.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch team members.' });
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    fetchUsers(e.target.value);
  };

  const handleToggleSuspend = (targetUser) => {
    setConfirm({
      isOpen: true,
      title: targetUser.suspended ? 'Activate Account' : 'Suspend Account',
      message: `Are you sure you want to ${targetUser.suspended ? 'activate' : 'suspend'} the account for ${targetUser.fullName || targetUser.email}?`,
      confirmText: targetUser.suspended ? 'Activate' : 'Suspend',
      action: async () => {
        try {
          const res = await adminApi.toggleUserSuspension(targetUser.id);
          setToast({ type: 'success', message: res.data.message });
          fetchUsers();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to update user status.';
          setToast({ type: 'error', message: msg });
        }
      }
    });
  };

  const handleDeleteUser = (targetUser) => {
    setConfirm({
      isOpen: true,
      title: 'Delete Account',
      message: `Are you sure you want to permanently DELETE ${targetUser.fullName || targetUser.email}? This action is irreversible!`,
      confirmText: 'Delete Permanently',
      action: async () => {
        try {
          const res = await adminApi.deleteUser(targetUser.id);
          setToast({ type: 'success', message: res.data.message });
          fetchUsers();
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to delete user.';
          setToast({ type: 'error', message: msg });
        }
      }
    });
  };

  // Add Team Member Upload & Open Cropper
  const handleTeamPicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image size should be less than 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModal({
        isOpen: true,
        imageSrc: ev.target.result,
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      });
    };
    reader.readAsDataURL(file);
  };

  const closeCropModal = () => {
    setCropModal({ isOpen: false, imageSrc: '', zoom: 1, offsetX: 0, offsetY: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyCrop = () => {
    const img = new Image();
    img.src = cropModal.imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, 200, 200);

      // Math for drawing centered
      const imgAspectRatio = img.width / img.height;
      let drawWidth, drawHeight;

      if (imgAspectRatio > 1) {
        drawHeight = 200;
        drawWidth = 200 * imgAspectRatio;
      } else {
        drawWidth = 200;
        drawHeight = 200 / imgAspectRatio;
      }

      // Apply zoom
      drawWidth *= cropModal.zoom;
      drawHeight *= cropModal.zoom;

      // Centered positions
      const centerX = 100;
      const centerY = 100;

      // Offset scale adjustment: container is 250px, canvas is 200px (factor = 0.8)
      const scaleFactor = 200 / 250;
      const startX = centerX - (drawWidth / 2) + (cropModal.offsetX * scaleFactor);
      const startY = centerY - (drawHeight / 2) + (cropModal.offsetY * scaleFactor);

      ctx.drawImage(img, startX, startY, drawWidth, drawHeight);

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      setTeamPic(croppedBase64);
      setCropModal({ isOpen: false, imageSrc: '', zoom: 1, offsetX: 0, offsetY: 0 });
    };
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.email.trim()) {
      setToast({ type: 'error', message: 'Name and Email are required.' });
      return;
    }

    setTeamLoading(true);
    try {
      await adminApi.addTeamMember({
        name: teamForm.name.trim(),
        email: teamForm.email.trim().toLowerCase(),
        about: teamForm.about.trim(),
        pictureUrl: teamPic // base64
      });

      setToast({ type: 'success', message: 'Team member added successfully!' });
      setTeamForm({ name: '', email: '', about: '' });
      setTeamPic(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchTeam();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add team member.';
      setToast({ type: 'error', message: msg });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleDeleteTeamMember = (member) => {
    setConfirm({
      isOpen: true,
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${member.name} from the team list?`,
      confirmText: 'Remove',
      action: async () => {
        try {
          await adminApi.deleteTeamMember(member.id);
          setToast({ type: 'success', message: 'Team member removed.' });
          fetchTeam();
        } catch (err) {
          setToast({ type: 'error', message: 'Failed to remove team member.' });
        }
      }
    });
  };

  return (
    <div className="admin-panel">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <Link to="/dashboard" className="back-link">← Dashboard</Link>
          <h1 className="admin-title">Admin Control Center</h1>
        </div>
        <div className="admin-badge">Admin Mode</div>
      </header>

      <main className="admin-main">
        {/* Stats Section */}
        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">👥</span>
            <div className="admin-stat-details">
              <span className="admin-stat-num">{stats.totalUsers}</span>
              <span className="admin-stat-label">Total Registered Users</span>
            </div>
          </div>
          <div className="admin-stat-card suspended">
            <span className="admin-stat-icon">🚫</span>
            <div className="admin-stat-details">
              <span className="admin-stat-num">{stats.suspended}</span>
              <span className="admin-stat-label">Suspended Accounts</span>
            </div>
          </div>
          <div className="admin-stat-card team">
            <span className="admin-stat-icon">🤝</span>
            <div className="admin-stat-details">
              <span className="admin-stat-num">{stats.teamCount}</span>
              <span className="admin-stat-label">Team Members Added</span>
            </div>
          </div>
        </section>

        {/* Tab Toggle Navigation */}
        <div className="admin-tabs-nav">
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👤 User Management
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            👥 Team Members
          </button>
        </div>

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <section className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Manage Registered Users</h2>
              <div className="admin-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={handleSearchChange}
                  className="admin-search-input"
                />
              </div>
            </div>

            {userLoading ? (
              <div className="admin-spinner-container">
                <div className="admin-spinner" /> Loading users list...
              </div>
            ) : users.length === 0 ? (
              <div className="admin-empty-state">No users found matching query.</div>
            ) : (
              <div className="admin-table-container">
                {/* Desktop Table View */}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Profile</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const userInitials = u.fullName
                        ? u.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                        : u.email.substring(0, 2).toUpperCase();

                      return (
                        <tr key={u.id} className={u.suspended ? 'row-suspended' : ''}>
                          <td>
                            <div className="table-avatar">
                              {u.pictureUrl ? (
                                <img src={u.pictureUrl} alt={u.fullName} className="table-avatar-img" />
                              ) : (
                                userInitials
                              )}
                            </div>
                          </td>
                          <td className="font-weight-600">
                            {u.fullName || '—'} 
                            {u.id === user.id && <span className="table-self-badge">(You)</span>}
                          </td>
                          <td className="table-email-cell">{u.email}</td>
                          <td>
                            <span className={`table-provider-badge ${u.provider.toLowerCase()}`}>
                              {u.provider}
                            </span>
                          </td>
                          <td>
                            <span className={`table-status-badge ${u.suspended ? 'suspended' : 'active'}`}>
                              {u.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions-container">
                              <button
                                type="button"
                                className={`table-action-btn suspend-btn ${u.suspended ? 'activate' : ''}`}
                                onClick={() => handleToggleSuspend(u)}
                                disabled={u.id === user.id}
                                title={u.suspended ? 'Activate User' : 'Suspend User'}
                              >
                                {u.suspended ? 'Activate' : 'Suspend'}
                              </button>
                              <button
                                type="button"
                                className="table-action-btn delete-btn"
                                onClick={() => handleDeleteUser(u)}
                                disabled={u.id === user.id}
                                title="Delete User"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile Cards List View */}
                <div className="admin-mobile-list">
                  {users.map((u) => {
                    const userInitials = u.fullName
                      ? u.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                      : u.email.substring(0, 2).toUpperCase();

                    return (
                      <div key={u.id} className={`admin-mobile-card ${u.suspended ? 'suspended' : ''}`}>
                        <div className="card-header-row">
                          <div className="table-avatar">
                            {u.pictureUrl ? (
                              <img src={u.pictureUrl} alt={u.fullName} className="table-avatar-img" />
                            ) : (
                              userInitials
                            )}
                          </div>
                          <div className="card-user-info">
                            <span className="card-user-name">
                              {u.fullName || '—'}
                              {u.id === user.id && <span className="table-self-badge">(You)</span>}
                            </span>
                            <span className="card-user-email">{u.email}</span>
                          </div>
                        </div>

                        <div className="card-badges-row">
                          <div className="badge-item">
                            <span className="badge-label">Method</span>
                            <span className={`table-provider-badge ${u.provider.toLowerCase()}`}>
                              {u.provider}
                            </span>
                          </div>
                          <div className="badge-item">
                            <span className="badge-label">Status</span>
                            <span className={`table-status-badge ${u.suspended ? 'suspended' : 'active'}`}>
                              {u.suspended ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </div>

                        <div className="card-actions-row">
                          <button
                            type="button"
                            className={`table-action-btn suspend-btn ${u.suspended ? 'activate' : ''}`}
                            onClick={() => handleToggleSuspend(u)}
                            disabled={u.id === user.id}
                          >
                            {u.suspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user.id}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Content: Team Members */}
        {activeTab === 'team' && (
          <section className="admin-section">
            <div className="team-split-layout">
              {/* Add Team Member Form */}
              <div className="team-form-card">
                <h3 className="team-card-title">Add Team Member</h3>
                <form onSubmit={handleAddTeamMember} className="team-form" noValidate>
                  {/* Photo Upload */}
                  <div className="team-pic-upload-section">
                    <div
                      className="team-pic-preview-circle"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload profile picture"
                    >
                      {teamPic ? (
                        <img src={teamPic} alt="Team preview" className="team-pic-preview-img" />
                      ) : (
                        <span>📷</span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleTeamPicChange}
                    />
                    <span className="team-pic-hint">Click circle to upload member photo (max 2MB)</span>
                  </div>

                  <div className="team-form-group">
                    <label className="team-form-label">Full Name</label>
                    <input
                      type="text"
                      className="team-form-input"
                      placeholder="e.g. Mohd Salman"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="team-form-group">
                    <label className="team-form-label">Email Address</label>
                    <input
                      type="email"
                      className="team-form-input"
                      placeholder="e.g. salman@example.com"
                      value={teamForm.email}
                      onChange={(e) => setTeamForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="team-form-group">
                    <label className="team-form-label">About / Bio</label>
                    <textarea
                      className="team-form-textarea"
                      placeholder="Write a brief intro about this team member..."
                      value={teamForm.about}
                      onChange={(e) => setTeamForm((f) => ({ ...f, about: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <button type="submit" className="team-form-submit-btn" disabled={teamLoading}>
                    {teamLoading ? 'Adding Member...' : 'Add Team Member'}
                  </button>
                </form>
              </div>

              {/* Current Team Members Grid */}
              <div className="team-list-section">
                <h3 className="team-card-title">Current Team ({team.length})</h3>
                {team.length === 0 ? (
                  <div className="admin-empty-state">No team members added yet. Added members will show here and on the Home Page.</div>
                ) : (
                  <div className="team-members-admin-grid">
                    {team.map((member) => (
                      <div className="team-admin-card" key={member.id}>
                        <button
                          type="button"
                          className="team-admin-remove-btn"
                          onClick={() => handleDeleteTeamMember(member)}
                          title="Remove Team Member"
                        >
                          ✕
                        </button>
                        <div className="team-admin-card-avatar">
                          {member.pictureUrl ? (
                            <img src={member.pictureUrl} alt={member.name} className="team-admin-card-avatar-img" />
                          ) : (
                            member.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="team-admin-card-info">
                          <h4 className="team-admin-card-name">{member.name}</h4>
                          <span className="team-admin-card-email">{member.email}</span>
                          <p className="team-admin-card-about">{member.about || 'No bio description provided.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        onConfirm={() => {
          if (confirm.action) confirm.action();
          setConfirm((c) => ({ ...c, isOpen: false }));
        }}
        onCancel={() => setConfirm((c) => ({ ...c, isOpen: false }))}
      />

      {/* Image Cropper Modal */}
      {cropModal.isOpen && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-card">
            <div className="crop-modal-header">
              <h3>Crop Profile Picture</h3>
              <button className="close-crop-btn" onClick={closeCropModal}>✕</button>
            </div>

            <div className="crop-modal-body">
              {/* Preview Viewport */}
              <div className="crop-viewport-container">
                <img
                  src={cropModal.imageSrc}
                  alt="To Crop"
                  className="crop-image-preview"
                  style={{
                    transform: `translate(${cropModal.offsetX}px, ${cropModal.offsetY}px) scale(${cropModal.zoom})`,
                  }}
                />
                <div className="crop-ring-overlay" />
              </div>

              {/* Sliders */}
              <div className="crop-sliders-container">
                <div className="crop-slider-group">
                  <label>🔍 Zoom ({cropModal.zoom.toFixed(1)}x)</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropModal.zoom}
                    onChange={(e) => setCropModal(c => ({ ...c, zoom: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="crop-slider-group">
                  <label>↔ Horizontal Position</label>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropModal.offsetX}
                    onChange={(e) => setCropModal(c => ({ ...c, offsetX: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="crop-slider-group">
                  <label>↕ Vertical Position</label>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropModal.offsetY}
                    onChange={(e) => setCropModal(c => ({ ...c, offsetY: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="crop-modal-footer">
              <button className="crop-cancel-btn" onClick={closeCropModal}>Cancel</button>
              <button className="crop-apply-btn" onClick={applyCrop}>Apply Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
