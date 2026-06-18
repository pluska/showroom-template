import React from 'react';

interface BuildingFacadeSvgProps {
    isOpen: boolean;
    className?: string;
}

const BuildingFacadeSvg = ({ isOpen, className = '' }: BuildingFacadeSvgProps) => {
    // Floor levels for the 8 levels of Venecia building
    const floorLevels = [
        { top: 120, bottom: 201 }, // Floor 8
        { top: 209, bottom: 286 }, // Floor 7
        { top: 294, bottom: 371 }, // Floor 6
        { top: 379, bottom: 456 }, // Floor 5
        { top: 464, bottom: 541 }, // Floor 4
        { top: 549, bottom: 626 }, // Floor 3
        { top: 634, bottom: 711 }, // Floor 2
        { top: 719, bottom: 796 }, // Floor 1
    ];

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
            <svg
                viewBox="0 0 320 900"
                fill="none"
                stroke="currentColor"
                className={`w-full h-full transition-all duration-1000 ${isOpen ? 'is-open' : ''}`}
            >
                <style>{`
                    .facade-main {
                        stroke: #DDDBCF;
                        stroke-width: 1;
                        stroke-dasharray: 100;
                        stroke-dashoffset: 100;
                        transition: stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1);
                    }
                    .facade-details {
                        stroke: #EAE8DF;
                        stroke-width: 0.75;
                        stroke-dasharray: 100;
                        stroke-dashoffset: 100;
                        transition: stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1);
                        transition-delay: 0.4s;
                    }
                    .facade-accents {
                        stroke: #CECBC0;
                        stroke-width: 1;
                        stroke-dasharray: 100;
                        stroke-dashoffset: 100;
                        transition: stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1);
                        transition-delay: 0.8s;
                    }
                    
                    .is-open .facade-main,
                    .is-open .facade-details,
                    .is-open .facade-accents {
                        stroke-dashoffset: 0;
                    }

                    /* Interactive Blueprint Micro-Animations */
                    svg {
                        perspective: 600px;
                        opacity: 0.35;
                        transition: opacity 1.5s ease-in-out;
                    }

                    @keyframes swingDoor {
                        0%, 10%, 100% {
                            transform: rotateY(0deg);
                        }
                        25%, 75% {
                            transform: rotateY(-65deg);
                        }
                    }
                    .animated-door {
                        animation: swingDoor 14s ease-in-out infinite;
                        animation-delay: 3s;
                    }

                    @keyframes slideWindow {
                        0%, 30%, 100% {
                            transform: translateX(0);
                        }
                        45%, 85% {
                            transform: translateX(-24px);
                        }
                    }
                    .animated-window-pane {
                        animation: slideWindow 10s ease-in-out infinite;
                        animation-delay: 5s;
                    }

                    @keyframes flyBird1 {
                        0% { transform: translate(330px, 30px); }
                        100% { transform: translate(-30px, 60px); }
                    }
                    @keyframes flyBird2 {
                        0% { transform: translate(-30px, 55px) scaleX(-1); }
                        100% { transform: translate(330px, 35px) scaleX(-1); }
                    }
                    .animated-bird-1 {
                        animation: flyBird1 16s linear infinite;
                        animation-delay: 1s;
                    }
                    .animated-bird-2 {
                        animation: flyBird2 22s linear infinite;
                        animation-delay: 6s;
                    }

                    @keyframes driveCar {
                        0% {
                            transform: translate(-60px, 831px);
                            opacity: 0;
                        }
                        5% {
                            opacity: 1;
                        }
                        45% {
                            transform: translate(110px, 831px);
                            opacity: 1;
                        }
                        50%, 100% {
                            transform: translate(128px, 831px) scale(0.5);
                            opacity: 0;
                        }
                    }
                    .animated-car {
                        animation: driveCar 12s linear infinite;
                        animation-delay: 8s;
                    }
                `}</style>

                {/* Diagonal Notch in the top right corner (mockup alignment) */}
                <line x1="240" y1="0" x2="320" y2="80" className="facade-main" pathLength={100} />

                {/* Rooftop Greenery/Hedges (structure.png garden) */}
                <path
                    d="M 50 112 C 55 95, 65 95, 70 112 C 75 97, 85 97, 90 112 C 95 95, 105 95, 110 112 C 115 97, 125 97, 130 112 C 135 95, 145 95, 150 112 C 155 97, 165 97, 170 112 C 175 95, 185 95, 190 112 C 195 97, 205 97, 210 112 C 215 95, 225 95, 230 112 C 235 97, 245 97, 250 112 C 255 95, 265 95, 270 112"
                    className="facade-accents"
                    pathLength={100}
                />

                {/* Double horizontal lines for roof top slab */}
                <line x1="50" y1="112" x2="270" y2="112" className="facade-main" pathLength={100} />
                <line x1="50" y1="120" x2="270" y2="120" className="facade-main" pathLength={100} />

                {/* Vertical Thick Columns (Continuous frames) */}
                {/* Column 1 (Left Edge) */}
                <line x1="50" y1="120" x2="50" y2="850" className="facade-main" pathLength={100} />
                <line x1="55" y1="120" x2="55" y2="850" className="facade-main" pathLength={100} />

                {/* Column 2 (Left Balcony Border) */}
                <line x1="88" y1="120" x2="88" y2="850" className="facade-main" pathLength={100} />
                <line x1="93" y1="120" x2="93" y2="850" className="facade-main" pathLength={100} />

                {/* Column 3 (Center Divider) */}
                <line x1="157" y1="120" x2="157" y2="850" className="facade-main" pathLength={100} />
                <line x1="163" y1="120" x2="163" y2="850" className="facade-main" pathLength={100} />

                {/* Column 4 (Right Balcony Border) */}
                <line x1="227" y1="120" x2="227" y2="850" className="facade-main" pathLength={100} />
                <line x1="232" y1="120" x2="232" y2="850" className="facade-main" pathLength={100} />

                {/* Column 5 (Right Edge) */}
                <line x1="265" y1="120" x2="265" y2="850" className="facade-main" pathLength={100} />
                <line x1="270" y1="120" x2="270" y2="850" className="facade-main" pathLength={100} />

                {/* Ground floor line / base slab */}
                <line x1="50" y1="850" x2="270" y2="850" className="facade-main" pathLength={100} />

                {/* Loop to render floor slabs, balconies, and center window units */}
                {floorLevels.map((floor, idx) => {
                    const yTop = floor.top;
                    const yBottom = floor.bottom;
                    const yMid = (yTop + yBottom) / 2;

                    const isAnimatedWindow = idx === 4; // Floor 4
                    const isAnimatedDoor = idx === 2; // Floor 6

                    return (
                        <g key={idx}>
                            {/* Floor Slab Slices (Double lines representing concrete floor thickness) */}
                            {idx > 0 && (
                                <>
                                    <line x1="50" y1={yTop - 8} x2="270" y2={yTop - 8} className="facade-main" pathLength={100} />
                                    <line x1="50" y1={yTop} x2="270" y2={yTop} className="facade-main" pathLength={100} />
                                </>
                            )}

                            {/* --- LEFT COLUMN: BALCONIES --- */}
                            {/* Glass door frame behind the balcony (Floor 6 swings open) */}
                            <rect
                                x="59"
                                y={yTop + 5}
                                width="25"
                                height={yBottom - yTop - 5}
                                className={`facade-details ${isAnimatedDoor ? 'animated-door' : ''}`}
                                style={isAnimatedDoor ? { transformOrigin: `59px ${yTop + 5}px` } : undefined}
                                pathLength={100}
                            />
                            {/* Balcony Railing top & bottom bars */}
                            <line x1="55" y1={yBottom - 28} x2="88" y2={yBottom - 28} className="facade-accents" pathLength={100} />
                            <line x1="55" y1={yBottom - 4} x2="88" y2={yBottom - 4} className="facade-accents" pathLength={100} />
                            {/* Balcony Railing vertical bars */}
                            <line x1="61" y1={yBottom - 28} x2="61" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="68" y1={yBottom - 28} x2="68" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="75" y1={yBottom - 28} x2="75" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="82" y1={yBottom - 28} x2="82" y2={yBottom} className="facade-accents" pathLength={100} />

                            {/* --- CENTER COLUMN: DOUBLE WINDOWS --- */}
                            {/* Left center window bay (Floor 4 slides open) */}
                            {isAnimatedWindow ? (
                                <>
                                    {/* Outer frame */}
                                    <rect x="98" y={yTop + 5} width="54" height={yBottom - yTop - 10} className="facade-details" pathLength={100} />
                                    {/* Left pane (fixed) */}
                                    <rect x="98" y={yTop + 5} width="27" height={yBottom - yTop - 10} className="facade-details" pathLength={100} />
                                    {/* Right pane (slides open behind the left one) */}
                                    <rect x="125" y={yTop + 5} width="27" height={yBottom - yTop - 10} className="facade-details animated-window-pane" pathLength={100} />
                                </>
                            ) : (
                                <>
                                    <rect x="98" y={yTop + 5} width="54" height={yBottom - yTop - 10} className="facade-details" pathLength={100} />
                                    <line x1="125" y1={yTop + 5} x2="125" y2={yBottom - 5} className="facade-details" pathLength={100} />
                                    <line x1="98" y1={yMid} x2="152" y2={yMid} className="facade-details" pathLength={100} />
                                </>
                            )}

                            {/* Right center window bay */}
                            <rect x="168" y={yTop + 5} width="54" height={yBottom - yTop - 10} className="facade-details" pathLength={100} />
                            <line x1="195" y1={yTop + 5} x2="195" y2={yBottom - 5} className="facade-details" pathLength={100} />
                            <line x1="168" y1={yMid} x2="222" y2={yMid} className="facade-details" pathLength={100} />

                            {/* --- RIGHT COLUMN: BALCONIES --- */}
                            {/* Glass door frame behind the balcony */}
                            <rect x="236" y={yTop + 5} width="25" height={yBottom - yTop - 5} className="facade-details" pathLength={100} />
                            {/* Balcony Railing top & bottom bars */}
                            <line x1="232" y1={yBottom - 28} x2="265" y2={yBottom - 28} className="facade-accents" pathLength={100} />
                            <line x1="232" y1={yBottom - 4} x2="265" y2={yBottom - 4} className="facade-accents" pathLength={100} />
                            {/* Balcony Railing vertical bars */}
                            <line x1="238" y1={yBottom - 28} x2="238" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="245" y1={yBottom - 28} x2="245" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="252" y1={yBottom - 28} x2="252" y2={yBottom} className="facade-accents" pathLength={100} />
                            <line x1="259" y1={yBottom - 28} x2="259" y2={yBottom} className="facade-accents" pathLength={100} />
                        </g>
                    );
                })}

                {/* --- GROUND LEVEL (y=796 to y=850) --- */}
                {/* Double lines for ground floor slab */}
                <line x1="50" y1="796" x2="270" y2="796" className="facade-main" pathLength={100} />
                <line x1="50" y1="804" x2="270" y2="804" className="facade-main" pathLength={100} />

                {/* Left Pedestrian Gate */}
                <rect x="55" y="804" width="33" height="46" className="facade-accents" pathLength={100} />
                <line x1="61" y1="804" x2="61" y2="850" className="facade-accents" pathLength={100} />
                <line x1="68" y1="804" x2="68" y2="850" className="facade-accents" pathLength={100} />
                <line x1="75" y1="804" x2="75" y2="850" className="facade-accents" pathLength={100} />
                <line x1="82" y1="804" x2="82" y2="850" className="facade-accents" pathLength={100} />

                {/* Main Garage Gate */}
                <rect x="93" y="804" width="172" height="46" className="facade-accents" pathLength={100} />
                <line x1="93" y1="812" x2="265" y2="812" className="facade-accents" pathLength={100} />
                <line x1="93" y1="820" x2="265" y2="820" className="facade-accents" pathLength={100} />
                <line x1="93" y1="828" x2="265" y2="828" className="facade-accents" pathLength={100} />
                <line x1="93" y1="836" x2="265" y2="836" className="facade-accents" pathLength={100} />
                <line x1="93" y1="844" x2="265" y2="844" className="facade-accents" pathLength={100} />
                <line x1="128" y1="804" x2="128" y2="850" className="facade-accents" pathLength={100} />
                <line x1="160" y1="804" x2="160" y2="850" className="facade-accents" pathLength={100} />
                <line x1="195" y1="804" x2="195" y2="850" className="facade-accents" pathLength={100} />
                <line x1="230" y1="804" x2="230" y2="850" className="facade-accents" pathLength={100} />

                {/* --- ANIMATIONS GROUP --- */}
                {/* Flying Birds */}
                <g className="animated-bird-1">
                    <path d="M 0 3 Q 3 0 6 3 Q 9 0 12 3" className="facade-accents" strokeWidth="0.75" />
                </g>
                <g className="animated-bird-2">
                    <path d="M 0 3 Q 3 0 6 3 Q 9 0 12 3" className="facade-accents" strokeWidth="0.75" />
                </g>

                {/* Animated Car */}
                <g className="animated-car">
                    <path d="M 0 16 L 4 8 L 12 8 L 18 0 L 34 0 L 40 8 L 50 8 L 54 16 Z" fill="none" className="facade-accents" strokeWidth="0.75" />
                    <circle cx="12" cy="16" r="3" className="facade-accents" strokeWidth="0.75" />
                    <circle cx="40" cy="16" r="3" className="facade-accents" strokeWidth="0.75" />
                </g>
            </svg>
        </div>
    );
};

export default BuildingFacadeSvg;
