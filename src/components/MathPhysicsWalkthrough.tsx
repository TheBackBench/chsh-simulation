import React, { useState, useEffect, useRef } from 'react';
import './MathPhysicsWalkthrough.css';

interface Props {
    isActive: boolean;
}

export const MathPhysicsWalkthrough: React.FC<Props> = ({ isActive }) => {
    // Entanglement section states
    const [entBobAngle, setEntBobAngle] = useState(45);
    const [showLightning, setShowLightning] = useState(false);
    const [entAliceResult, setEntAliceResult] = useState<'Up'|'Down' | null>(null);
    const [bobResult, setBobResult] = useState<'Up' | 'Down' | null>(null);

    // LHV section states
    const [lhvBobAngle, setLhvBobAngle] = useState(45);
    const [hiddenVar, setHiddenVar] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinStats, setSpinStats] = useState({ opposite: 0, same: 0, total: 0 });
    const scanRef = useRef({ angle: 0, same: 0, opposite: 0, total: 0 });

    const normalize = (a: number) => {
        let res = a % 360;
        if (res < 0) res += 360;
        return res;
    };

    // We keep Alice fixed at 0 degrees throughout the explanation to focus on relative phase.
    const ALICE_ANGLE = 0;

    const measureAlice = () => {
        setBobResult(null); // Reset bob's result
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 300);

        setTimeout(() => {
            const aliceIsUp = Math.random() > 0.5;
            setEntAliceResult(aliceIsUp ? 'Up' : 'Down');
        }, 150);
    };

    const measureBob = () => {
        if (!entAliceResult) return;
        const aliceIsUp = entAliceResult === 'Up';
        
        // Bob measures
        const diff = Math.abs(normalize(ALICE_ANGLE) - normalize(entBobAngle));
        const normDiff = Math.min(diff, 360 - diff);
        
        // The probability of getting the OPPOSITE result is cos^2(theta/2).
        const probOpposite = Math.pow(Math.cos(normDiff * Math.PI / 180), 2);
        
        const isOpposite = Math.random() < probOpposite;
        if (aliceIsUp) {
            setBobResult(isOpposite ? 'Down' : 'Up');
        } else {
            setBobResult(isOpposite ? 'Up' : 'Down');
        }
    };

    // 360 Scan logic (copied from our successful implementation)
    useEffect(() => {
        let timerId: NodeJS.Timeout;

        const tick = () => {
            const state = scanRef.current;
            if (state.total >= 360) {
                setIsSpinning(false);
                return;
            }

            const currentAngle = state.angle;
            
            const aliceDiff = Math.abs(normalize(ALICE_ANGLE) - normalize(currentAngle));
            const aliceNormDiff = aliceDiff > 180 ? 360 - aliceDiff : aliceDiff;
            const aliceResultUp = aliceNormDiff <= 90;

            const bobDiff = Math.abs(normalize(lhvBobAngle) - normalize(currentAngle + 180));
            const bobNormDiff = bobDiff > 180 ? 360 - bobDiff : bobDiff;
            const bobResultUp = bobNormDiff <= 90;

            const isOpposite = aliceResultUp !== bobResultUp;

            state.total += 1;
            if (isOpposite) {
                state.opposite += 1;
            } else {
                state.same += 1;
            }
            state.angle = (currentAngle + 1) % 360;

            setHiddenVar(state.angle);
            setSpinStats({ total: state.total, opposite: state.opposite, same: state.same });

            if (state.total >= 360) {
                setIsSpinning(false);
            }
        };

        if (isSpinning) {
            timerId = setInterval(tick, 10);
        }

        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [isSpinning, lhvBobAngle]);

    if (!isActive) return null;

    // Calculations for the UI
    const qDiff = Math.abs(normalize(ALICE_ANGLE) - normalize(entBobAngle));
    const qNormDiff = Math.min(qDiff, 360 - qDiff);
    const pSameQuantum = Math.pow(Math.cos(qNormDiff * Math.PI / 180), 2);

    const lDiff = Math.abs(normalize(ALICE_ANGLE) - normalize(lhvBobAngle));
    const lNormDiff = Math.min(lDiff, 360 - lDiff);
    const pOppositeLHV = 1 - (lNormDiff / 180);

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

    return (
        <section className="theory-section active">
            <div className="walkthrough-container">
                
                {/* 1. Introduction to Locality */}
                <div className="walkthrough-section glass-panel">
                    <h2>1. The Speed Limit of the Universe</h2>
                    <div className="walkthrough-text">
                        <p>
                            For a long time, physicists believed the universe was strictly <strong>local</strong>. This means that everything that happens must be caused by something nearby, and no influence can travel faster than the speed of light.
                        </p>
                        <p>
                            Imagine building a switch on Earth that instantly turns on a lightbulb on Mars. Under the rules of locality, this is impossible. The electrical signal would take minutes to travel through space. You are strictly limited by the speed of light.
                        </p>
                        <div className="rhetorical-q">
                            "But what about things that are already correlated at a distance?"
                        </div>
                        <p>
                            Good question! Imagine I have a pair of socks—one red and one blue. I put them in identical boxes, fly to Mars with one box, and leave the other on Earth.
                        </p>
                        <p>
                            When I open my box on Mars and see a red sock, I <em>instantly</em> know the sock on Earth is blue. Did the information travel faster than light? No! The colors were <strong>predetermined</strong> the moment I packed them. There is no "spooky action at a distance" here; just hidden information you didn't know until you checked.
                        </p>
                        <p>
                            This is what physicists call a <strong>Local Hidden Variable</strong>. Einstein believed that quantum mechanics must work the exact same way.
                        </p>
                    </div>
                </div>

                {/* 2. Entanglement */}
                <div className="walkthrough-section glass-panel">
                    <h2>2. Quantum Entanglement</h2>
                    <div className="walkthrough-text">
                        <p>
                            In quantum mechanics, when two particles become <em>entangled</em>, they share a single quantum state. Measuring the spin of one particle instantly guarantees the outcome of measuring the other, regardless of how far apart they are.
                        </p>
                        <p>
                            To make things simple, let's assume <strong>Alice always measures straight up (at angle 0°)</strong>. We only care about the relative angle between Alice and Bob's measurements anyway.
                        </p>
                        <p>
                            If Alice measures at 0° and gets "Up", Bob's entangled particle instantly collapses into the opposite state—meaning its spin points downwards (180°). But what if Bob measures at a different angle? 
                        </p>
                    </div>

                    <div className="interactive-box highlight">
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>Try it: Spooky Action</h3>
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Click "Measure" to collapse Alice's state and watch the entanglement instantly affect Bob's particle!
                        </p>
                        
                        <div className="particle-connection">
                            <div className="particle-node alice" style={{ opacity: entAliceResult ? 1 : 0.5 }}>A</div>
                            <div className={`lightning-effect ${showLightning ? 'lightning-active' : ''}`}></div>
                            <div className="particle-node bob" style={{ opacity: entAliceResult ? 1 : 0.5 }}>B</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                            <button className="quantum-btn" onClick={measureAlice} style={{ padding: '0.5rem 1rem' }}>
                                Measure Alice's Particle
                            </button>
                            <button className="quantum-btn" onClick={measureBob} disabled={!entAliceResult} style={{ padding: '0.5rem 1rem', opacity: entAliceResult ? 1 : 0.5, cursor: entAliceResult ? 'pointer' : 'not-allowed' }}>
                                Measure Bob's Particle
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            {/* Alice SVG */}
                            <div style={{ textAlign: 'center' }}>
                                <svg width="150" height="150" viewBox="-100 -100 200 200">
                                    <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.3)" />
                                    {/* Measurement line */}
                                    <g transform={`rotate(${-ALICE_ANGLE})`}>
                                        <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--quantum-pink)" strokeWidth="3" />
                                        <polygon points="-5,-85 5,-85 0,-95" fill="var(--quantum-pink)" />
                                    </g>
                                    <circle cx="0" cy="0" r="4" fill="white" />
                                    {/* Alice's Result State */}
                                    {entAliceResult && (
                                        <g transform={`rotate(${entAliceResult === 'Up' ? 0 : -180})`}>
                                            <line x1="0" y1="0" x2="0" y2="-60" stroke="white" strokeWidth="3" />
                                            <polygon points="-6,-55 6,-55 0,-70" fill="white" />
                                        </g>
                                    )}
                                </svg>
                                <div style={{ color: 'var(--quantum-pink)', marginTop: '0.5rem' }}>Alice's Measurement (0°)</div>
                                <div style={{ minHeight: '1.5rem', color: 'white', marginTop: '0.5rem' }}>
                                    {entAliceResult ? `Result: ${entAliceResult}` : ''}
                                </div>
                            </div>

                            {/* Bob SVG */}
                            <div style={{ textAlign: 'center' }}>
                                <svg width="150" height="150" viewBox="-100 -100 200 200">
                                    <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.3)" />
                                    
                                    {/* Bob's Measurement Angle */}
                                    <g transform={`rotate(${-entBobAngle})`}>
                                        <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--accent-teal)" strokeWidth="3" />
                                        <polygon points="-5,-85 5,-85 0,-95" fill="var(--accent-teal)" />
                                    </g>
                                    <circle cx="0" cy="0" r="4" fill="white" />
                                    
                                    {/* Bob's Instantly Collapsed State (Shadow) */}
                                    {entAliceResult && (
                                        <g transform={`rotate(${entAliceResult === 'Up' ? -180 : 0})`}>
                                            <line x1="0" y1="0" x2="0" y2="-60" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeDasharray="5" />
                                            <polygon points="-6,-55 6,-55 0,-70" fill="rgba(255,255,255,0.4)" />
                                        </g>
                                    )}
                                </svg>
                                <div style={{ color: 'var(--accent-teal)', marginTop: '0.5rem' }}>Bob's Measurement</div>
                                <div style={{ minHeight: '1.5rem', color: 'var(--accent-gold)', marginTop: '0.5rem' }}>
                                    {bobResult ? `Bob measures: ${bobResult}` : ''}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', gap: '1rem' }}>
                            <div className="angle-slider-container">
                                <label style={{ color: 'var(--accent-teal)' }}>Bob's Measurement: {entBobAngle}°</label>
                                <input type="range" min="0" max="360" value={entBobAngle} onChange={(e) => {
                                    setEntBobAngle(Number(e.target.value));
                                    setBobResult(null); // Force re-measuring if angle changes
                                }} />
                            </div>
                        </div>
                    </div>

                    <div className="walkthrough-text">
                        <div className="rhetorical-q">
                            "What happens if Alice and Bob measure at different angles?"
                        </div>
                        <p>
                            If Bob's measurement axis is slightly tilted compared to Alice's, the result is no longer guaranteed. Instead, quantum mechanics predicts the probability using the overlap of their mathematical states (eigenvectors). 
                        </p>
                        <p>
                            The probability they get the <strong>same</strong> result is governed by a cosine-squared curve:
                        </p>
                        <div className="math-highlight">
                            Probability(Same) = cos²(θ / 2)
                        </div>
                        <p style={{ textAlign: 'center' }}>
                            For your chosen angle ({entBobAngle}°), the relative difference is {qNormDiff}°. <br/>
                            <strong>Quantum prediction: {(pSameQuantum * 100).toFixed(1)}% Same.</strong>
                        </p>
                    </div>
                </div>

                {/* 3. Hidden Variables */}
                <div className="walkthrough-section glass-panel">
                    <h2>3. The Hidden Variable Alternative</h2>
                    <div className="walkthrough-text">
                        <p>
                            Einstein wasn't buying it. He suggested that, just like the red and blue socks, the particles must have some hidden "instruction set" embedded within them from the start. We just can't see it!
                        </p>
                        <p>
                            Let's imagine a <strong>Local Hidden Variable (LHV)</strong> model. Suppose the entangled particles carry a hidden arrow (an angle) that was set when they were created. 
                        </p>
                        <p>
                            <strong>The Rule of Spin:</strong> If the hidden variable points in a specific direction, any measurement within ±90° of that direction will result in "Up" (for that axis). If it's outside that ±90° window, it results in "Down".
                        </p>
                    </div>

                    <div className="interactive-box">
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>Inside the Particles</h3>
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            Adjust the Predetermined Hidden Variable to see how it forces the particles to answer Alice and Bob.
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            {/* Alice SVG */}
                            <div style={{ textAlign: 'center' }}>
                                <svg width="150" height="150" viewBox="-100 -100 200 200">
                                    <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.3)" />
                                    {renderHalfRing(80, 15, hiddenVar, 'rgba(0, 255, 159, 0.7)')}
                                    {renderHalfRing(80, 15, hiddenVar + 180, 'rgba(255, 68, 68, 0.7)')}
                                    <g transform={`rotate(${-ALICE_ANGLE})`}>
                                        <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--quantum-pink)" strokeWidth="3" />
                                        <polygon points="-5,-85 5,-85 0,-95" fill="var(--quantum-pink)" />
                                    </g>
                                    <circle cx="0" cy="0" r="4" fill="white" />
                                    <g transform={`rotate(${-hiddenVar})`}>
                                        <line x1="0" y1="0" x2="0" y2="-60" stroke="white" strokeWidth="2" strokeDasharray="4" />
                                        <polygon points="-4,-55 4,-55 0,-65" fill="white" />
                                    </g>
                                </svg>
                                <div style={{ color: 'var(--quantum-pink)', marginTop: '0.5rem' }}>Alice's Measurement (0°)</div>
                            </div>

                            {/* Bob SVG */}
                            <div style={{ textAlign: 'center' }}>
                                <svg width="150" height="150" viewBox="-100 -100 200 200">
                                    <circle cx="0" cy="0" r="80" fill="rgba(0,0,0,0.3)" />
                                    {renderHalfRing(80, 15, hiddenVar + 180, 'rgba(0, 255, 159, 0.7)')}
                                    {renderHalfRing(80, 15, hiddenVar, 'rgba(255, 68, 68, 0.7)')}
                                    <g transform={`rotate(${-lhvBobAngle})`}>
                                        <line x1="0" y1="-65" x2="0" y2="-85" stroke="var(--accent-teal)" strokeWidth="3" />
                                        <polygon points="-5,-85 5,-85 0,-95" fill="var(--accent-teal)" />
                                    </g>
                                    <circle cx="0" cy="0" r="4" fill="white" />
                                    <g transform={`rotate(${-(hiddenVar + 180)})`}>
                                        <line x1="0" y1="0" x2="0" y2="-60" stroke="white" strokeWidth="2" strokeDasharray="4" />
                                        <polygon points="-4,-55 4,-55 0,-65" fill="white" />
                                    </g>
                                </svg>
                                <div style={{ color: 'var(--accent-teal)', marginTop: '0.5rem' }}>Bob's Measurement</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem', gap: '1rem' }}>
                            <div className="angle-slider-container" style={{ width: '100%', maxWidth: '400px' }}>
                                <label style={{ color: 'var(--accent-gold)' }}>Predetermined Hidden Variable: {hiddenVar}°</label>
                                <input type="range" min="0" max="360" value={hiddenVar} onChange={(e) => setHiddenVar(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>
                            <div className="angle-slider-container">
                                <label style={{ color: 'var(--accent-teal)' }}>Bob: {lhvBobAngle}°</label>
                                <input type="range" min="0" max="360" value={lhvBobAngle} onChange={(e) => setLhvBobAngle(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div className="walkthrough-text">
                        <div className="rhetorical-q">
                            "But wait, we don't know what the hidden variable actually is!"
                        </div>
                        <p>
                            Exactly! The universe creates these particles randomly. Since space has no "preferred" direction, the hidden variable is equally likely to point in any direction. It is a <strong>homogeneous random variable</strong>.
                        </p>
                        <p>
                            To find the true probability of Alice and Bob getting the same or opposite results, we have to average over <em>every possible hidden variable angle</em> from 0 to 360 degrees.
                        </p>
                    </div>

                    <div className="interactive-box highlight">
                        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'white' }}>Scan All Possibilities</h3>
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Click Start to sweep the hidden variable through all 360 possible degrees and tally up the results!
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <button 
                                className="quantum-btn" 
                                onClick={() => {
                                    if (!isSpinning) {
                                        scanRef.current = { angle: 0, same: 0, opposite: 0, total: 0 };
                                        setHiddenVar(0);
                                        setSpinStats({ opposite: 0, same: 0, total: 0 });
                                        setIsSpinning(true);
                                    } else {
                                        setIsSpinning(false);
                                    }
                                }}
                                style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
                            >
                                {isSpinning ? 'Stop Scanning' : 'Start 360° Scan'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-around', height: '120px', alignItems: 'flex-end', maxWidth: '300px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                                <div style={{ height: '100px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${(1 - pOppositeLHV) * 100}%`, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderTop: '2px dashed rgba(255, 255, 255, 0.5)' }} />
                                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${(spinStats.same / 360) * 100}%`, backgroundColor: 'rgba(255, 68, 68, 0.8)' }} />
                                </div>
                                <span style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Same</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                                <div style={{ height: '100px', width: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${pOppositeLHV * 100}%`, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderTop: '2px dashed rgba(255, 255, 255, 0.5)' }} />
                                    <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${(spinStats.opposite / 360) * 100}%`, backgroundColor: 'rgba(0, 255, 159, 0.8)' }} />
                                </div>
                                <span style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Opposite</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
                            Angles Scanned: {spinStats.total} / 360
                        </div>
                    </div>
                </div>

                {/* 4. Conclusion & Bell's Theorem */}
                <div className="walkthrough-section glass-panel">
                    <h2>4. The CHSH Breakthrough</h2>
                    <div className="walkthrough-text">
                        <div className="rhetorical-q">
                            "So... does the universe use quantum non-locality or hidden socks?"
                        </div>
                        <p>
                            This is where John Bell and the CHSH team changed physics forever. If you look closely at the results from the 360° scan above, the math for Local Hidden Variables produces a straight, <strong>linear</strong> probability graph.
                        </p>
                        <div className="math-highlight">
                            LHV Probability(Opposite) = 1 - (|θA - θB| / 180°)
                        </div>
                        <p>
                            But quantum mechanics predicts a <strong>cosine-squared curve</strong>! The two predictions do not perfectly overlap.
                        </p>
                        <p>
                            By choosing specific, clever angles (like the 22.5° steps used in the CHSH game), the quantum curve dips lower or higher than the straight line of classical physics. This mathematical difference is exactly what you leverage when you play the CHSH game!
                        </p>
                        <p>
                            By using Quantum Entanglement, Alice and Bob can achieve an <strong>85.4%</strong> success rate. With local hidden variables (the socks), the absolute hard limit is <strong>75%</strong>.
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '1.2rem', color: 'var(--accent-gold)', marginTop: '2rem', padding: '1rem', border: '1px solid var(--accent-gold)', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.1)' }}>
                            We can run the game, count the wins, and literally test if the universe is fundamentally non-local!
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
};
