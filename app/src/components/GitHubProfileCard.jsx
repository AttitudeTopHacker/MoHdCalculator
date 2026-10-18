import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import './GitHubProfileCard.css';

const GITHUB_USERNAME = 'AttitudeTopHacker';
const CACHE_KEY = 'gh_profile_cache_attitudetophacker_v2';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export default function GitHubProfileCard({ variant = 'default' }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try local cache first for instant display & offline support
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        setProfile(data);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setLoading(false);
          return;
        }
      } catch (_) {}
    }

    // 2. First try our secure backend API (/api/v1/public/github-stats)
    adminApi.publicGetGitHubStats()
      .then((res) => {
        if (res.data && res.data.data) {
          const stats = res.data.data;
          setProfile(stats);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: stats, timestamp: Date.now() })
          );
          setLoading(false);
        } else {
          throw new Error('Invalid backend stats data');
        }
      })
      .catch((backendErr) => {
        console.warn('Backend GitHub stats fetch failed, falling back to direct GitHub API:', backendErr);
        // Fallback to direct public GitHub API
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}`)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch from GitHub API');
            return res.json();
          })
          .then((data) => {
            const mapped = {
              username: data.login || GITHUB_USERNAME,
              name: data.name || 'Mohd Salman',
              avatarUrl: data.avatar_url || 'https://avatars.githubusercontent.com/u/97902566?v=4',
              htmlUrl: data.html_url || `https://github.com/${GITHUB_USERNAME}`,
              bio: data.bio || 'Founder & Lead Architect at msm.movin 2022 ORG | Web, Android & Desktop Engineer',
              location: data.location || 'India',
              publicRepos: data.public_repos ?? 7,
              privateRepos: 0,
              totalRepos: data.public_repos ?? 7,
            };
            setProfile(mapped);
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ data: mapped, timestamp: Date.now() })
            );
            setLoading(false);
          })
          .catch((err) => {
            console.warn('GitHub direct API fallback failed, using defaults:', err);
            if (!profile) {
              setProfile({
                username: GITHUB_USERNAME,
                name: 'Mohd Salman',
                avatarUrl: 'https://avatars.githubusercontent.com/u/97902566?v=4',
                htmlUrl: `https://github.com/${GITHUB_USERNAME}`,
                bio: 'Founder & Lead Architect at msm.movin 2022 ORG | Web, Android & Desktop Engineer',
                location: 'India',
                publicRepos: 7,
                privateRepos: 0,
                totalRepos: 7,
              });
            }
            setLoading(false);
          });
      });
  }, []);

  if (loading && !profile) {
    return (
      <div className={`gh-profile-card gh-card-${variant} gh-skeleton-card`}>
        <div className="gh-card-glow" />
        <div className="gh-card-header">
          <div className="gh-avatar-wrapper">
            <div className="gh-skeleton-avatar gh-shimmer" />
          </div>
          <div className="gh-user-details" style={{ width: '100%' }}>
            <div className="gh-skeleton-name gh-shimmer" />
            <div className="gh-skeleton-handle gh-shimmer" />
            <div className="gh-skeleton-org gh-shimmer" />
          </div>
        </div>
        <div className="gh-skeleton-bio">
          <div className="gh-skeleton-line gh-skeleton-bio-1 gh-shimmer" />
          <div className="gh-skeleton-line gh-skeleton-bio-2 gh-shimmer" />
        </div>
        <div className="gh-stats-row">
          <div className="gh-skeleton-pill gh-shimmer" />
        </div>
        <div className="gh-actions-row">
          <div className="gh-skeleton-btn gh-shimmer" />
          <div className="gh-skeleton-btn gh-shimmer" />
        </div>
      </div>
    );
  }

  const name = profile?.name || 'Mohd Salman';
  const login = profile?.username || profile?.login || GITHUB_USERNAME;
  const avatar = profile?.avatarUrl || profile?.avatar_url || 'https://avatars.githubusercontent.com/u/97902566?v=4';
  const bio = profile?.bio || 'Founder & Lead Architect at msm.movin 2022 ORG | Web, Android & Desktop Engineer';
  const location = profile?.location || 'India';
  const totalRepos = profile?.totalRepos ?? profile?.public_repos ?? 7;
  const privateRepos = profile?.privateRepos ?? 0;
  const publicRepos = profile?.publicRepos ?? profile?.public_repos ?? 7;

  return (
    <div className={`gh-profile-card gh-card-${variant}`}>
      <div className="gh-card-glow" />

      {/* Top Header Row */}
      <div className="gh-card-header">
        <div className="gh-avatar-wrapper">
          <img
            src={avatar}
            alt={name}
            className="gh-avatar-img"
            loading="lazy"
          />
          <span className="gh-online-indicator" title="Active Developer" />
        </div>

        <div className="gh-user-details">
          <div className="gh-name-row">
            <h3 className="gh-user-name">{name}</h3>
            <span className="gh-verified-badge" title="Verified Architect">✓</span>
          </div>

          <div className="gh-handle-row">
            <a
              href={`https://github.com/${login}`}
              target="_blank"
              rel="noreferrer noopener"
              className="gh-user-handle"
            >
              @{login}
            </a>
            <span className="gh-sep">•</span>
            <span className="gh-location">📍 {location}</span>
          </div>

          <div className="gh-org-badge">
            <span className="gh-org-dot" />
            <span className="gh-org-name">msm.movin 2022 ORG</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="gh-bio-text">{bio}</p>

      {/* Live Stats Row */}
      <div className="gh-stats-row">
        <div className="gh-stat-pill">
          <span className="gh-stat-count">{loading ? '…' : totalRepos}</span>
          <span className="gh-stat-label">
            {privateRepos > 0
              ? `Total Repositories (${publicRepos} Public + ${privateRepos} Private)`
              : 'Repositories (Public)'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="gh-actions-row">
        <a
          href={`https://github.com/${login}`}
          target="_blank"
          rel="noreferrer noopener"
          className="gh-btn-primary"
        >
          <svg className="gh-octo-icon" height="18" viewBox="0 0 16 16" width="18" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          View Profile ↗
        </a>

        <a
          href="https://github.com/AttitudeTopHacker/MoHdCalculator"
          target="_blank"
          rel="noreferrer noopener"
          className="gh-btn-secondary"
        >
          ⭐ Star MoHdCalculator
        </a>
      </div>
    </div>
  );
}
