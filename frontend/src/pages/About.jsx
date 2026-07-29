import { Link } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';
import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <WaveBackground />

      {/* Nav */}
      <header className="about-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">◈</span>
          <span className="nav-logo-text">AreaCalculator</span>
        </div>
        <Link to="/home" className="back-home-btn">🏠 Go to Home</Link>
      </header>

      {/* Main Content */}
      <main className="about-main">
        <div className="about-card">
          <div className="about-glow" />
          <h1 className="about-title">About <span className="text-teal">AreaCalculator</span></h1>
          <p className="about-subtitle">A Premium Engineering and Mapping Solution</p>

          <div className="about-content">
            <section className="about-section">
              <h3>🎯 Our Mission</h3>
              <p>
                AreaCalculator was created with a simple yet powerful mission: to make architectural, engineering, and geographic area calculations effortless, secure, and visually beautiful. Whether you are mapping land boundaries using coordinate geometry or verifying structural dimensions, we provide high-fidelity simulators to calculate areas with speed and precision.
              </p>
            </section>

            <section className="about-section">
              <h3>🛠️ Core Capabilities</h3>
              <ul>
                <li><strong>Map-Based Area Measurement:</strong> Plot coordinates directly on maps to measure real-world land areas dynamically.</li>
                <li><strong>Interactive Shapes Suite:</strong> Compute area and perimeter for triangles, rectangles, polygons, and custom shapes in real time.</li>
                <li><strong>Stateless Security:</strong> Fully secure JWT authentication alongside Google OAuth 2.0 ensures seamless onboarding and data protection.</li>
                <li><strong>Cloud Synchronization:</strong> All calculations, profile details, and preferences are safely synced to our PostgreSQL database.</li>
              </ul>
            </section>

            <section className="about-section">
              <h3>💻 Technology Stack</h3>
              <div className="tech-stack-grid">
                <div className="tech-badge">Spring Boot 4.x</div>
                <div className="tech-badge">React JS</div>
                <div className="tech-badge">PostgreSQL (Supabase)</div>
                <div className="tech-badge">Hibernate JPA</div>
                <div className="tech-badge">Spring Security</div>
                <div className="tech-badge">Vite</div>
              </div>
            </section>
          </div>

          <div className="about-footer-action">
            <Link to="/signup" className="get-started-btn">Get Started Now</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
