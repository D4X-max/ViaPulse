import React from 'react';

export default function TopographicBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full object-cover opacity-85"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep base dark green background */}
        <rect width="1440" height="900" fill="#0c231c" />

        {/* Subtle radial gradient to give depth */}
        <radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a473b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#081813" stopOpacity="1" />
        </radialGradient>
        <rect width="1440" height="900" fill="url(#radial-glow)" />

        {/* Topographic Layer 1: Darkest Forest Green */}
        <path
          d="M-100 400 C300 200, 500 600, 900 300 C1200 100, 1400 300, 1600 200 L1600 1000 L-100 1000 Z"
          fill="#113026"
        />

        {/* Contour lines for Layer 1 */}
        <path d="M-100 420 C300 220, 500 620, 900 320 C1200 120, 1400 320, 1600 220" stroke="#163f32" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M-100 440 C300 240, 500 640, 900 340 C1200 140, 1400 340, 1600 240" stroke="#163f32" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M-100 460 C300 260, 500 660, 900 360 C1200 160, 1400 360, 1600 260" stroke="#163f32" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M-100 480 C300 280, 500 680, 900 380 C1200 180, 1400 380, 1600 280" stroke="#163f32" strokeWidth="1" strokeOpacity="0.5" />

        {/* Topographic Layer 2: Deep Emerald Green */}
        <path
          d="M-100 500 C200 400, 400 700, 800 500 C1100 350, 1300 550, 1600 450 L1600 1000 L-100 1000 Z"
          fill="#174134"
        />

        {/* Contour lines for Layer 2 */}
        <path d="M-100 520 C200 420, 400 720, 800 520 C1100 370, 1300 570, 1600 470" stroke="#1e5443" strokeWidth="1" strokeOpacity="0.6" />
        <path d="M-100 540 C200 440, 400 740, 800 540 C1100 390, 1300 590, 1600 490" stroke="#1e5443" strokeWidth="1" strokeOpacity="0.6" />
        <path d="M-100 560 C200 460, 400 760, 800 560 C1100 410, 1300 610, 1600 510" stroke="#1e5443" strokeWidth="1" strokeOpacity="0.6" />
        <path d="M-100 580 C200 480, 400 780, 800 580 C1100 430, 1300 630, 1600 530" stroke="#1e5443" strokeWidth="1" strokeOpacity="0.6" />

        {/* Topographic Layer 3: Vibrant Sage/Forest Green */}
        <path
          d="M-100 620 C250 550, 450 820, 750 620 C1050 420, 1250 700, 1600 600 L1600 1000 L-100 1000 Z"
          fill="#225d4a"
        />

        {/* Contour lines for Layer 3 */}
        <path d="M-100 635 C250 565, 450 835, 750 635 C1050 435, 1250 715, 1600 615" stroke="#2c7860" strokeWidth="1.2" strokeOpacity="0.7" />
        <path d="M-100 650 C250 580, 450 850, 750 650 C1050 450, 1250 730, 1600 630" stroke="#2c7860" strokeWidth="1.2" strokeOpacity="0.7" />
        <path d="M-100 665 C250 595, 450 865, 750 665 C1050 465, 1250 745, 1600 645" stroke="#2c7860" strokeWidth="1.2" strokeOpacity="0.7" />
        <path d="M-100 680 C250 610, 450 880, 750 680 C1050 480, 1250 760, 1600 660" stroke="#2c7860" strokeWidth="1.2" strokeOpacity="0.7" />

        {/* Topographic Layer 4: Lighter Forest/Leaf Green */}
        <path
          d="M-100 720 C300 680, 500 900, 850 700 C1100 550, 1300 800, 1600 720 L1600 1000 L-100 1000 Z"
          fill="#2d775f"
        />

        {/* Contour lines for Layer 4 */}
        <path d="M-100 735 C300 695, 500 915, 850 715 C1100 565, 1300 815, 1600 735" stroke="#3b9679" strokeWidth="1.2" strokeOpacity="0.8" />
        <path d="M-100 750 C300 710, 500 930, 850 730 C1100 580, 1300 830, 1600 750" stroke="#3b9679" strokeWidth="1.2" strokeOpacity="0.8" />
        <path d="M-100 765 C300 725, 500 945, 850 745 C1100 595, 1300 845, 1600 765" stroke="#3b9679" strokeWidth="1.2" strokeOpacity="0.8" />

        {/* Topographic Layer 5: Beautiful Creamy Ribbon Wave */}
        <path
          d="M-100 800 C350 780, 550 960, 900 780 C1150 650, 1350 900, 1600 820 L1600 1000 L-100 1000 Z"
          fill="#ede8cf"
        />

        {/* Contour lines for Layer 5 (Cream) */}
        <path d="M-100 810 C350 790, 550 970, 900 790 C1150 660, 1350 910, 1600 830" stroke="#f6f3e6" strokeWidth="1.5" strokeOpacity="0.9" />
        <path d="M-100 820 C350 800, 550 980, 900 800 C1150 670, 1350 920, 1600 840" stroke="#f4f1db" strokeWidth="1.5" strokeOpacity="0.9" />
        <path d="M-100 830 C350 810, 550 990, 900 810 C1150 680, 1350 930, 1600 850" stroke="#ebe6cc" strokeWidth="1.5" strokeOpacity="0.9" />

        {/* Topographic Layer 6: Accent Deep Sage green coming from bottom right */}
        <path
          d="M800 1000 C950 880, 1150 950, 1300 880 C1450 810, 1550 850, 1600 840 L1600 1000 Z"
          fill="#1b4c3e"
        />
        <path d="M800 990 C950 870, 1150 940, 1300 870 C1450 800, 1550 840, 1600 830" stroke="#256754" strokeWidth="1.2" strokeOpacity="0.6" />
        <path d="M800 980 C950 860, 1150 930, 1300 860 C1450 790, 1550 830, 1600 820" stroke="#256754" strokeWidth="1.2" strokeOpacity="0.6" />

        {/* Fine topographical lines pattern overlay on the upper dark area */}
        <g stroke="#1a4d3f" strokeWidth="0.8" strokeOpacity="0.35">
          <path d="M-100 100 C200 50, 400 150, 700 80 C1000 10, 1200 120, 1600 50" />
          <path d="M-100 150 C200 100, 400 200, 700 130 C1000 60, 1200 170, 1600 100" />
          <path d="M-100 200 C200 150, 400 250, 700 180 C1000 110, 1200 220, 1600 150" />
          <path d="M-100 250 C200 200, 400 300, 700 230 C1000 160, 1200 270, 1600 200" />
          <path d="M-100 300 C200 250, 400 350, 700 280 C1000 210, 1200 320, 1600 250" />
          <path d="M-100 350 C200 300, 400 400, 700 330 C1000 260, 1200 370, 1600 300" />
        </g>
      </svg>
    </div>
  );
}
