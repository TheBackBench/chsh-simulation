import React, { useState } from 'react';
import './index.css';
import { ClassicalSandbox } from './components/ClassicalSandbox';
import { QuantumSandbox } from './components/QuantumSandbox';
import { runSimulation, ClassicalStrategy, QuantumStrategy, SimulationResult } from './engine/Simulation';
import './App.css';

function App() {
    const [mode, setMode] = useState<'classical' | 'quantum'>('classical');
    const [nGames, setNGames] = useState(10_000);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [showQuantumPopup, setShowQuantumPopup] = useState(false);
    const [hasSeenQuantumPopup, setHasSeenQuantumPopup] = useState(() => localStorage.getItem('hasSeenQuantumPopup') === 'true');
    const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem('cookieConsent') === 'true');

    const [classicalStrategy, setClassicalStrategy] = useState<ClassicalStrategy>({
        alice0: true, alice1: true, bob0: true, bob1: true
    });
    const [quantumStrategy, setQuantumStrategy] = useState<QuantumStrategy>({
        a0: 0, a1: 45, b0: 22.5, b1: -22.5
    });

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        setProgress(0);
        
        const res = await runSimulation(
            mode, 
            nGames, 
            classicalStrategy, 
            quantumStrategy, 
            (p) => setProgress(p)
        );
        
        setResult(res);
        setIsRunning(false);
    };

    const handleModeChange = (newMode: 'classical' | 'quantum') => {
        setMode(newMode);
        setResult(null);
        setProgress(0);
        
        if (newMode === 'quantum' && !hasSeenQuantumPopup) {
            setShowQuantumPopup(true);
            setHasSeenQuantumPopup(true);
            
            if (cookieConsent) {
                localStorage.setItem('hasSeenQuantumPopup', 'true');
            }
        }
    };

    const acceptCookies = () => {
        setCookieConsent(true);
        localStorage.setItem('cookieConsent', 'true');
        if (hasSeenQuantumPopup) {
            localStorage.setItem('hasSeenQuantumPopup', 'true');
        }
    };

    return (
        <>
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            
            {showQuantumPopup && (
                <div className="popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="popup-content glass-panel" style={{ padding: '2rem', maxWidth: '600px', textAlign: 'center' }}>
                        <h2 className="glow-text">Quantum Mode</h2>
                        <p style={{ margin: '1.5rem 0', lineHeight: '1.6' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                        <button className="run-btn" onClick={() => setShowQuantumPopup(false)}>
                            <span className="btn-text">Close</span>
                            <div className="btn-glow"></div>
                        </button>
                    </div>
                </div>
            )}
            
            {!cookieConsent && (
                <div className="cookie-banner glass-panel" style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '800px', margin: '0 auto', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 2rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                        We use local storage (similar to cookies) to remember your preferences, such as whether you've seen our introductory popups.
                    </p>
                    <button className="run-btn" onClick={acceptCookies} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', flexShrink: 0 }}>
                        <span className="btn-text">Accept</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>
            )}
            
            <div className="container">
                <header>
                    <h1 className="glow-text">CHSH Game Simulation</h1>
                    <p className="subtitle">Explore the limits of local hidden-variables vs quantum non-locality</p>
                </header>

                <div className="mode-selector">
                    <button 
                        className={`mode-btn ${mode === 'classical' ? 'active' : ''}`}
                        onClick={() => handleModeChange('classical')}
                    >
                        Classical Mode
                    </button>
                    <button 
                        id="btn-quantum"
                        className={`mode-btn ${mode === 'quantum' ? 'active' : ''}`}
                        onClick={() => handleModeChange('quantum')}
                    >
                        Quantum Mode
                    </button>
                </div>

                <main>
                    <ClassicalSandbox isActive={mode === 'classical'} strategy={classicalStrategy} setStrategy={setClassicalStrategy} />
                    <QuantumSandbox isActive={mode === 'quantum'} strategy={quantumStrategy} setStrategy={setQuantumStrategy} onHelpClick={() => setShowQuantumPopup(true)} />

                    <section className="simulation-controls">
                        <div className="run-panel glass-panel">
                            <div className="input-group inline">
                                <label htmlFor="num-games">Number of Games (N):</label>
                                <input 
                                    type="number" 
                                    id="num-games" 
                                    value={nGames} 
                                    onChange={(e) => setNGames(parseInt(e.target.value) || 100)}
                                    min="100" max="1000000" step="100" 
                                />
                            </div>
                            <button 
                                className={`run-btn ${mode === 'quantum' ? 'quantum' : ''}`}
                                onClick={handleRun}
                                disabled={isRunning}
                                style={{ opacity: isRunning ? 0.5 : 1 }}
                            >
                                <span className="btn-text">{isRunning ? 'Running...' : 'Run Simulation'}</span>
                                <div className="btn-glow"></div>
                            </button>
                        </div>
                        
                        {(isRunning || result) && (
                            <div className={`progress-container ${!isRunning && !result ? 'hidden' : ''}`}>
                                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                    </section>

                    {result && (
                        <section className="results-dashboard">
                            <h2>Simulation Results</h2>
                            <div className="results-grid">
                                <div className="result-card glass-panel">
                                    <span className="label">Games Won</span>
                                    <span className="value">{result.wins.toLocaleString()}</span>
                                </div>
                                <div className="result-card glass-panel">
                                    <span className="label">Total Games</span>
                                    <span className="value">{result.total.toLocaleString()}</span>
                                </div>
                                <div 
                                    className="result-card glass-panel highlight"
                                    style={mode === 'quantum' && result.rate > 76 ? {
                                        borderColor: 'var(--quantum-pink)',
                                        boxShadow: '0 0 20px var(--quantum-pink-dim)'
                                    } : {}}
                                >
                                    <span className="label">Success Rate</span>
                                    <span 
                                        className="value"
                                        style={mode === 'quantum' && result.rate > 76 ? {
                                            background: 'linear-gradient(90deg, var(--quantum-pink), #ff66ff)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent'
                                        } : {}}
                                    >
                                        {result.rate.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div className="theoretical-comparison glass-panel">
                                <div className="limit-row">
                                    <span>Classical Limit:</span>
                                    <span className="limit-value">75.00%</span>
                                </div>
                                <div className="limit-row">
                                    <span>Quantum Limit (Tsirelson's bound):</span>
                                    <span className="limit-value quantum-text">~85.35%</span>
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </>
    );
}

export default App;
