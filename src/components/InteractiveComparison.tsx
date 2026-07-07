import React, { useState } from 'react';
import './InteractiveComparison.css';

type QuantumStep = 'ready' | 'alice_measured' | 'bob_measured';

export const InteractiveComparison: React.FC = () => {
    const [aliceAngle, setAliceAngle] = useState(0);
    const [bobAngle, setBobAngle] = useState(45);
    const [hiddenVar, setHiddenVar] = useState(90);
    
    const [qStep, setQStep] = useState<QuantumStep>('ready');
    const [qAliceOutcome, setQAliceOutcome] = useState<boolean | null>(null);
    const [qBobOutcome, setQBobOutcome] = useState<boolean | null>(null);
    const [showLightning, setShowLightning] = useState(false);

    // Normalize angle to 0-360
    const normalize = (a: number) => {
        let res = a % 360;
        if (res < 0) res += 360;
        return res;
    };

    const diff = Math.abs(normalize(aliceAngle) - normalize(bobAngle));
    const normDiff = Math.min(diff, 360 - diff);

    // LHV Anti-Correlated Math (Opposite Hidden Variables)
    const pOppositeLHV = 1 - (normDiff / 180);
    
    // Anti-correlated Singlet State math
    // Bob's state is opposite. P(opposite) = cos^2(theta/2)
    const pOppositeQuantum = Math.pow(Math.cos((normDiff / 2) * Math.PI / 180), 2);

    // LHV Outcomes
    const aliceDiff = Math.abs(normalize(aliceAngle) - normalize(hiddenVar));
    const aliceNormDiff = aliceDiff > 180 ? 360 - aliceDiff : aliceDiff;
    const aliceResultUp = aliceNormDiff <= 90;

    const bobDiff = Math.abs(normalize(bobAngle) - normalize(hiddenVar + 180));
    const bobNormDiff = bobDiff > 180 ? 360 - bobDiff : bobDiff;
    const bobResultUp = bobNormDiff <= 90;

    // Quantum States
    const aliceCollapsedStateAngle = qAliceOutcome !== null ? (qAliceOutcome ? aliceAngle : aliceAngle + 180) : null;
    const bobPreMeasuredStateAngle = aliceCollapsedStateAngle !== null ? normalize(aliceCollapsedStateAngle + 180) : null;

    const renderHalfRing = (radius: number, thickness: number, angle: number, color: string) => {
        const r = radius;
        return (
            <g transform={`rotate(${-angle})`}>
                <path
                    d={`M ${-r},0 A ${r},${r} 0 0,1 ${r},0`}
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness}
                />
            </g>
        );
    };

    const handleMeasureAlice = () => {
        setQAliceOutcome(Math.random() < 0.5);
        setQStep('alice_measured');
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 500);
    };

    const handleMeasureBob = () => {
        if (bobPreMeasuredStateAngle === null) return;
        
        // Probability of Bob getting UP along his measurement axis:
        // P = cos^2( (Axis - State) / 2 )
        const diffRad = (bobAngle - bobPreMeasuredStateAngle) * Math.PI / 180;
        const probBobUp = Math.pow(Math.cos(diffRad / 2), 2);
        
        const bobGetsUp = Math.random() < probBobUp;
        setQBobOutcome(bobGetsUp);
        setQStep('bob_measured');
    };

    const handleReset = () => {
        setQStep('ready');
        setQAliceOutcome(null);
        setQBobOutcome(null);
    };

    return (
        <div className="interactive-comparison">
            <div className="controls-panel glass-panel" style={{ marginBottom: '2rem' }}>
                <h4 className="glow-text" style={{ margin: '0 0 1rem 0' }}>Set Measurement Angles</h4>
                <div className="slider-group">
                    <label className="angle-label">
                        <span style={{ color: 'var(--quantum-pink)' }}>Alice's Angle: {aliceAngle}°</span>
                        <input type="range" min="0" max="360" value={aliceAngle} onChange={(e) => {
                            setAliceAngle(Number(e.target.value));
                            if (qStep !== 'ready') handleReset();
                        }} style={{ accentColor: 'var(--quantum-pink)' }} />
                    </label>
                    <label className="angle-label">
                        <span style={{ color: 'var(--accent-teal)' }}>Bob's Angle: {bobAngle}°</span>
                        <input type="range" min="0" max="360" value={bobAngle} onChange={(e) => {
                            setBobAngle(Number(e.target.value));
                            if (qStep === 'bob_measured') handleReset();
                        }} style={{ accentColor: 'var(--accent-teal)' }} />
                    </label>
                </div>
            </div>

            <div className="comparison-visuals">
                <div className="visual-panel lhv-panel">
                    <h3 style={{ color: '#ffb84d', margin: '0 0 1rem 0' }}>Local Hidden Variable</h3>
                    <p className="panel-desc">
                        The <strong>Hidden Variable</strong> acts as an internal pointer and determines the fixed "Up" (Green) and "Down" (Red) hemispheres. The measurement angles (fixed needles) reveal the deterministic outcome when the regions rotate past them.
                    </p>

                    <div className="svg-container" style={{ padding: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                        {/* ALICE'S CIRCLE */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--quantum-pink)', fontWeight: 'bold' }}>Alice's Particle</div>
                            <svg viewBox="-100 -100 200 200" width="130" height="130" style={{ overflow: 'visible' }}>
                                <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />

                                {/* Alice's Particle Hidden Variable Ring */}
                                {renderHalfRing(80, 15, hiddenVar, 'rgba(0, 255, 159, 0.7)')}
                                {renderHalfRing(80, 15, hiddenVar + 180, 'rgba(255, 68, 68, 0.7)')}

                                <circle cx="0" cy="0" r="65" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" />

                                {/* Alice's Measurement Needle (Fixed) */}
                                <g transform={`rotate(${-aliceAngle})`}>
                                    <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--quantum-pink)" strokeWidth="3" />
                                    <polygon points="-5,-85 5,-85 0,-95" fill="var(--quantum-pink)" />
                                </g>

                                {/* Alice's Particle Hidden Variable Arrow (Moves with Ring) */}
                                <g transform={`rotate(${-hiddenVar})`}>
                                    <line x1="0" y1="0" x2="0" y2="-55" stroke="white" strokeWidth="2" />
                                    <polygon points="-4,-50 4,-50 0,-60" fill="white" />
                                </g>
                            </svg>
                        </div>

                        {/* BOB'S CIRCLE */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 'bold' }}>Bob's Particle</div>
                            <svg viewBox="-100 -100 200 200" width="130" height="130" style={{ overflow: 'visible' }}>
                                <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />

                                {/* Bob's Particle Hidden Variable Ring (Opposite to Alice) */}
                                {renderHalfRing(80, 15, hiddenVar + 180, 'rgba(0, 255, 159, 0.7)')}
                                {renderHalfRing(80, 15, hiddenVar, 'rgba(255, 68, 68, 0.7)')}

                                <circle cx="0" cy="0" r="65" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" />

                                {/* Bob's Measurement Needle (Fixed) */}
                                <g transform={`rotate(${-bobAngle})`}>
                                    <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--accent-teal)" strokeWidth="3" />
                                    <polygon points="-5,-85 5,-85 0,-95" fill="var(--accent-teal)" />
                                </g>

                                {/* Bob's Particle Hidden Variable Arrow (Moves with Ring) */}
                                <g transform={`rotate(${-(hiddenVar + 180)})`}>
                                    <line x1="0" y1="0" x2="0" y2="-55" stroke="white" strokeWidth="2" />
                                    <polygon points="-4,-50 4,-50 0,-60" fill="white" />
                                </g>
                            </svg>
                        </div>
                    </div>

                    <div className="hv-control">
                        <label className="angle-label">
                            <span style={{ marginBottom: '0.5rem', display: 'block' }}>Predetermined Hidden Variable: {hiddenVar}°</span>
                            <input type="range" min="0" max="360" value={hiddenVar} onChange={(e) => setHiddenVar(Number(e.target.value))} />
                        </label>
                        <div className="hv-result">
                            <div className="result-badge">
                                Alice's Result: <strong style={{ color: aliceResultUp ? '#00ff9f' : '#ff4444', marginLeft: '0.5rem' }}>{aliceResultUp ? '↑ Up' : '↓ Down'}</strong>
                            </div>
                            <div className="result-badge">
                                Bob's Result: <strong style={{ color: bobResultUp ? '#00ff9f' : '#ff4444', marginLeft: '0.5rem' }}>{bobResultUp ? '↑ Up' : '↓ Down'}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="prob-box">
                        <div className="prob-title">Probability of OPPOSITE result</div>
                        <div className="prob-formula">Linear: 1 - (|θA - θB| / 180°)</div>
                        <div className="prob-value" style={{ color: '#ffb84d' }}>{(pOppositeLHV * 100).toFixed(1)}%</div>
                        <div className="prob-bar-container">
                            <div className="prob-bar" style={{ width: `${pOppositeLHV * 100}%`, background: '#ffb84d' }} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                            Spin the Hidden Variable! The % reflects the fraction of spins where both needles land on opposite colors.
                        </div>
                    </div>
                </div>

                <div className="visual-panel quantum-panel">
                    <h3 style={{ color: 'var(--quantum-pink)', margin: '0 0 1rem 0' }}>True Entanglement</h3>
                    <p className="panel-desc">
                        There are no hidden variables. Step through the measurement to see how Alice's random result instantly collapses Bob's state (into the exact opposite orientation).
                    </p>

                    <div className="svg-container" style={{ padding: '1rem', display: 'flex', gap: '2rem', justifyContent: 'center', position: 'relative' }}>
                        
                        {/* LIGHTNING ANIMATION */}
                        {showLightning && (
                            <div className="lightning-container">
                                <svg className="lightning-bolt" viewBox="0 0 24 24" width="60" height="60" fill="rgba(255, 255, 0, 0.8)">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                        )}

                        {/* ALICE */}
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--quantum-pink)', fontWeight: 'bold' }}>Alice's Particle</div>
                            <svg viewBox="-100 -100 200 200" width="130" height="130" style={{ overflow: 'visible' }}>
                                <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />

                                {/* Alice's Measurement Axis */}
                                <g transform={`rotate(${-aliceAngle})`}>
                                    <line x1="0" y1="-85" x2="0" y2="85" stroke="var(--quantum-pink)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                    <polygon points="-5,-85 5,-85 0,-95" fill="var(--quantum-pink)" opacity="0.5" />
                                </g>

                                {/* Alice's Collapsed State */}
                                {qStep !== 'ready' && aliceCollapsedStateAngle !== null && (
                                    <g transform={`rotate(${-aliceCollapsedStateAngle})`}>
                                        <line x1="0" y1="0" x2="0" y2="-75" stroke="#ff6bed" strokeWidth="4" />
                                        <polygon points="-6,-75 6,-75 0,-88" fill="#ff6bed" />
                                    </g>
                                )}
                            </svg>
                        </div>

                        {/* BOB */}
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 'bold' }}>Bob's Particle</div>
                            <svg viewBox="-100 -100 200 200" width="130" height="130" style={{ overflow: 'visible' }}>
                                <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.05)" />

                                {/* Bob's Measurement Axis */}
                                <g transform={`rotate(${-bobAngle})`}>
                                    <line x1="0" y1="-85" x2="0" y2="85" stroke="var(--accent-teal)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                    <polygon points="-5,-85 5,-85 0,-95" fill="var(--accent-teal)" opacity="0.5" />
                                </g>

                                {/* Bob's State Arrow (Pre-measured or Final) */}
                                {qStep !== 'ready' && bobPreMeasuredStateAngle !== null && (
                                    <g transform={`rotate(${- (qStep === 'bob_measured' && qBobOutcome !== null ? (qBobOutcome ? bobAngle : bobAngle + 180) : bobPreMeasuredStateAngle)})`} style={{ transition: 'transform 0.3s ease' }}>
                                        <line x1="0" y1="0" x2="0" y2="-75" stroke="#00ff9f" strokeWidth="4" />
                                        <polygon points="-6,-75 6,-75 0,-88" fill="#00ff9f" />
                                    </g>
                                )}
                            </svg>
                        </div>
                    </div>

                    <div className="hv-control" style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        {qStep === 'ready' && (
                            <button className="quantum-btn" onClick={handleMeasureAlice}>
                                1. Measure Alice
                            </button>
                        )}
                        {qStep === 'alice_measured' && (
                            <button className="quantum-btn" onClick={handleMeasureBob}>
                                2. Measure Bob
                            </button>
                        )}
                        {qStep === 'bob_measured' && (
                            <button className="quantum-btn reset" onClick={handleReset}>
                                Reset Entangled Pair
                            </button>
                        )}

                        <div className="hv-result" style={{ width: '100%', marginTop: '0' }}>
                            <div className="result-badge" style={{ opacity: qStep !== 'ready' ? 1 : 0.3 }}>
                                Alice's Result: {qAliceOutcome !== null && <strong style={{ color: qAliceOutcome ? '#00ff9f' : '#ff4444', marginLeft: '0.5rem' }}>{qAliceOutcome ? '↑ Up' : '↓ Down'}</strong>}
                            </div>
                            <div className="result-badge" style={{ opacity: qStep === 'bob_measured' ? 1 : 0.3 }}>
                                Bob's Result: {qBobOutcome !== null && <strong style={{ color: qBobOutcome ? '#00ff9f' : '#ff4444', marginLeft: '0.5rem' }}>{qBobOutcome ? '↑ Up' : '↓ Down'}</strong>}
                            </div>
                        </div>
                    </div>

                    <div className="prob-box" style={{ opacity: qStep === 'ready' ? 0.3 : 1, transition: 'opacity 0.3s' }}>
                        <div className="prob-title">Probability of OPPOSITE result</div>
                        <div className="prob-formula">cos²(θ/2)</div>
                        <div className="prob-value" style={{ color: 'var(--quantum-pink)' }}>{(pOppositeQuantum * 100).toFixed(1)}%</div>
                        <div className="prob-bar-container">
                            <div className="prob-bar" style={{ width: `${pOppositeQuantum * 100}%`, background: 'var(--quantum-pink)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
