import { useState, useEffect } from 'react';
import './SlidingBackground.css';

export default function SlidingBackground() {
  const [current, setCurrent] = useState(0);

  const slides = [
    // Slide 1: World Map Survey & Coordinate Grid
    (
      <svg viewBox="0 0 1000 600" className="slide-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Futuristic Grid Map */}
        <defs>
          <pattern id="world-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(46, 230, 197, 0.05)" />
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#world-grid)" />

        {/* Stylized World Continent Outlines (High-Tech Minimalist) */}
        <g stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5" fill="none">
          {/* North America */}
          <path d="M 120 120 L 250 80 L 320 180 L 260 250 L 220 230 L 150 280 Z" fill="rgba(255, 255, 255, 0.01)" />
          {/* South America */}
          <path d="M 240 280 L 280 300 L 300 380 L 260 480 L 220 420 L 230 330 Z" fill="rgba(255, 255, 255, 0.01)" />
          {/* Eurasia (Europe + Asia) */}
          <path d="M 450 100 L 600 60 L 850 110 L 880 250 L 780 320 L 680 300 L 520 280 L 480 200 Z" fill="rgba(255, 255, 255, 0.01)" />
          {/* Africa */}
          <path d="M 460 220 L 540 210 L 590 280 L 570 380 L 500 450 L 460 350 Z" fill="rgba(255, 255, 255, 0.01)" />
          {/* Australia */}
          <path d="M 750 360 L 850 370 L 880 430 L 780 440 Z" fill="rgba(255, 255, 255, 0.01)" />
        </g>

        {/* Lat/Long Lines */}
        <path d="M 500 0 A 400 300 0 0 0 500 600" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <path d="M 500 0 A 200 300 0 0 0 500 600" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <path d="M 500 0 A 200 300 0 0 1 500 600" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <path d="M 500 0 A 400 300 0 0 1 500 600" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="300" x2="1000" y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

        {/* Global Highlighted Surveying Zones (Polygons) */}
        <polygon points="620,150 710,130 730,220 640,240" stroke="#2EE6C5" strokeWidth="2" strokeDasharray="6,4" fill="rgba(46, 230, 197, 0.05)" />
        <circle cx="620" cy="150" r="5" fill="#2EE6C5" />
        <circle cx="710" cy="130" r="5" fill="#2EE6C5" />
        <circle cx="730" cy="220" r="5" fill="#2EE6C5" />
        <circle cx="640" cy="240" r="5" fill="#2EE6C5" />
        
        {/* GPS location and area labels on Map */}
        <g transform="translate(740, 150)">
          <rect x="0" y="0" width="180" height="60" rx="6" fill="rgba(8, 12, 24, 0.85)" stroke="rgba(46, 230, 197, 0.4)" strokeWidth="1" />
          <text x="12" y="20" fill="#2EE6C5" fontSize="11" fontWeight="bold" fontFamily="monospace">GOOGLE MAP ZONE A</text>
          <text x="12" y="36" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="monospace">Area: 1,452.80 m²</text>
          <text x="12" y="48" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace">Breakdown: 4.59 Bigha</text>
        </g>
        
        {/* India/Asia Pulse Target */}
        <g transform="translate(680, 180)">
          <circle cx="0" cy="0" r="30" fill="none" stroke="#2EE6C5" strokeWidth="1" opacity="0.5" className="map-radar-pulse" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#2EE6C5" strokeWidth="2" />
          <circle cx="0" cy="0" r="3" fill="#2EE6C5" />
        </g>
        
        <text x="50" y="550" fill="rgba(255,255,255,0.15)" fontSize="14" fontFamily="monospace">GLOBAL SURVEY TRACKER v2.4</text>
      </svg>
    ),
    // Slide 2: Concentric Circle Boundary & Radar
    (
      <svg viewBox="0 0 1000 600" className="slide-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Radar Rings representing circular area measurement */}
        <circle cx="500" cy="300" r="250" stroke="rgba(255, 78, 161, 0.05)" strokeWidth="1" />
        <circle cx="500" cy="300" r="200" stroke="rgba(46, 230, 197, 0.15)" strokeWidth="1.5" strokeDasharray="8,6" />
        <circle cx="500" cy="300" r="150" stroke="rgba(46, 230, 197, 0.08)" strokeWidth="1" />
        <circle cx="500" cy="300" r="100" stroke="rgba(255, 78, 161, 0.12)" strokeWidth="1" />
        <circle cx="500" cy="300" r="50" stroke="rgba(46, 230, 197, 0.25)" strokeWidth="1.5" />

        {/* Crosshair measuring markings */}
        <line x1="500" y1="30" x2="500" y2="570" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5,5" />
        <line x1="230" y1="300" x2="770" y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="5,5" />

        {/* Degree ticks */}
        <text x="505" y="45" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">000° N</text>
        <text x="780" y="304" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">090° E</text>
        <text x="505" y="565" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">180° S</text>
        <text x="190" y="304" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">270° W</text>

        {/* Radar Line & Area Calculation */}
        <line x1="500" y1="300" x2="641" y2="159" stroke="#2EE6C5" strokeWidth="2.5" />
        <circle cx="641" cy="159" r="6" fill="#2EE6C5" className="pulse-dot" />

        <g transform="translate(660, 130)">
          <rect x="0" y="0" width="220" height="75" rx="8" fill="rgba(8, 12, 24, 0.85)" stroke="rgba(255, 78, 161, 0.3)" strokeWidth="1" />
          <text x="15" y="22" fill="#FF4EA1" fontSize="12" fontWeight="bold" fontFamily="var(--font-main)">CIRCULAR LAND AREA</text>
          <text x="15" y="42" fill="rgba(255,255,255,0.8)" fontSize="14" fontWeight="bold" fontFamily="monospace">28,274.33 m²</text>
          <text x="15" y="58" fill="rgba(46, 230, 197, 0.7)" fontSize="11" fontFamily="monospace">Radius: 95 Gatta (238.8m)</text>
        </g>

        {/* Area formula hint */}
        <text x="440" y="335" fill="rgba(255,255,255,0.15)" fontSize="12" fontFamily="monospace">Area = π · r²</text>
        <text x="390" y="530" fill="rgba(255, 255, 255, 0.15)" fontSize="14" fontFamily="var(--font-main)">GOOGLE MAPS RADIAL LAND SURVEY</text>
      </svg>
    ),
    // Slide 3: Google Maps Satellite Interface & Polygon Area
    (
      <svg viewBox="0 0 1000 600" className="slide-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sat-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1"/>
            <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="rgba(46, 230, 197, 0.015)" strokeWidth="0.5" strokeDasharray="2,2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sat-grid)" />

        {/* Boundary Coordinates Polygon */}
        <polygon points="250,150 750,110 820,450 300,410" stroke="#2EE6C5" strokeWidth="2.5" strokeDasharray="8,6" fill="rgba(46, 230, 197, 0.02)" />
        
        {/* Vertices & Markers */}
        <g>
          <circle cx="250" cy="150" r="7" fill="#2EE6C5" />
          <circle cx="250" cy="150" r="14" stroke="#2EE6C5" strokeWidth="1" opacity="0.5" className="map-radar-pulse" />
          
          <circle cx="750" cy="110" r="7" fill="#2EE6C5" />
          <circle cx="750" cy="110" r="14" stroke="#2EE6C5" strokeWidth="1" opacity="0.5" className="map-radar-pulse" />
          
          <circle cx="820" cy="450" r="7" fill="#2EE6C5" />
          <circle cx="820" cy="450" r="14" stroke="#2EE6C5" strokeWidth="1" opacity="0.5" className="map-radar-pulse" />
          
          <circle cx="300" cy="410" r="7" fill="#2EE6C5" />
          <circle cx="300" cy="410" r="14" stroke="#2EE6C5" strokeWidth="1" opacity="0.5" className="map-radar-pulse" />
        </g>

        {/* Angle indications */}
        <path d="M 250 180 A 30 30 0 0 0 280 150" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <text x="290" y="180" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="monospace">92.4°</text>

        {/* Measured dimensions labels */}
        <g fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="monospace" textAnchor="middle">
          <text x="500" y="115">501.6m (200 Gatta)</text>
          <text x="795" y="280" transform="rotate(78 795 280)">347.3m (138 Gatta)</text>
          <text x="560" y="445">521.5m (208 Gatta)</text>
          <text x="260" y="280" transform="rotate(-78 260 280)">264.8m (106 Gatta)</text>
        </g>

        {/* Center detailed Area Banner */}
        <g transform="translate(500, 240)">
          <rect x="-140" y="-30" width="280" height="70" rx="8" fill="rgba(8, 12, 24, 0.9)" stroke="rgba(46, 230, 197, 0.5)" strokeWidth="1.5" />
          <text x="0" y="-10" fill="#2EE6C5" fontSize="13" fontWeight="bold" fontFamily="var(--font-main)" textAnchor="middle">GPS SATELLITE PLOT RESULT</text>
          <text x="0" y="15" fill="#FFFFFF" fontSize="20" fontWeight="bold" fontFamily="monospace" textAnchor="middle">1,56,800.00 m²</text>
          <text x="0" y="32" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="monospace" textAnchor="middle">248.0 Bigha · 12.4 Acres</text>
        </g>
      </svg>
    ),
    // Slide 4: World Map Pin Points (Locations)
    (
      <svg viewBox="0 0 1000 600" className="slide-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* World Map Background Dotted Design */}
        <g fill="rgba(255,255,255,0.02)">
          {/* North America dots */}
          <rect x="120" y="100" width="120" height="80" rx="4" />
          <rect x="180" y="180" width="80" height="60" rx="4" />
          {/* South America dots */}
          <rect x="230" y="280" width="70" height="150" rx="4" />
          {/* Africa dots */}
          <rect x="460" y="240" width="100" height="140" rx="4" />
          {/* Europe/Asia dots */}
          <rect x="480" y="80" width="350" height="150" rx="4" />
          <rect x="680" y="230" width="150" height="80" rx="4" />
          {/* Australia dots */}
          <rect x="760" y="360" width="100" height="70" rx="4" />
        </g>

        {/* Global coordinate grid lines */}
        <path d="M 100 0 L 100 600 M 300 0 L 300 600 M 500 0 L 500 600 M 700 0 L 700 600 M 900 0 L 900 600" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        <path d="M 0 100 L 1000 100 M 0 250 L 1000 250 M 0 400 L 1000 400 M 0 550 L 1000 550" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

        {/* GPS Pins on World map representing multiple location measurements */}
        {/* Pin 1: India */}
        <g transform="translate(680, 190)">
          <circle cx="0" cy="0" r="25" fill="rgba(46, 230, 197, 0.08)" />
          <path d="M 0,-15 C -6,-15 -10,-10 -10,-5 C -10,2 0,15 0,15 C 0,15 10,2 10,-5 C 10,-10 6,-15 0,-15 Z" fill="#2EE6C5" />
          <circle cx="0" cy="-5" r="3" fill="#080c18" />
          <text x="15" y="-5" fill="rgba(46, 230, 197, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">SURVEY PIN 01 (India)</text>
          <text x="15" y="8" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">Area: 8.35 Hectares</text>
        </g>

        {/* Pin 2: Middle East */}
        <g transform="translate(540, 200)">
          <circle cx="0" cy="0" r="20" fill="rgba(255, 78, 161, 0.08)" />
          <path d="M 0,-15 C -6,-15 -10,-10 -10,-5 C -10,2 0,15 0,15 C 0,15 10,2 10,-5 C 10,-10 6,-15 0,-15 Z" fill="#FF4EA1" />
          <circle cx="0" cy="-5" r="3" fill="#080c18" />
          <text x="15" y="-5" fill="rgba(255, 78, 161, 0.8)" fontSize="11" fontWeight="bold" fontFamily="monospace">SURVEY PIN 02 (ME)</text>
          <text x="15" y="8" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">Area: 12.40 Hectares</text>
        </g>
        
        <text x="50" y="50" fill="rgba(255,255,255,0.15)" fontSize="14" fontFamily="monospace">ACTIVE WORLD GPS SATELLITE PING</text>
      </svg>
    )
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000); // changes slides every 6s
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="sliding-bg-container">
      {/* Background radial gradient glow overlay */}
      <div className="sliding-bg-glow" />

      {/* Render slides */}
      <div className="sliding-bg-track" style={{ transform: `translateX(-${current * 100}vw)` }}>
        {slides.map((slide, index) => (
          <div key={index} className="sliding-bg-slide">
            {slide}
          </div>
        ))}
      </div>
    </div>
  );
}

