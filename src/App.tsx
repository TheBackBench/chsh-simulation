import React, { useState, useEffect } from 'react';
import './index.css';
import { ClassicalSandbox } from './components/ClassicalSandbox';
import { QuantumSandbox } from './components/QuantumSandbox';
import { HowToPlay } from './components/HowToPlay';
import { RulesSidebar } from './components/RulesSidebar';
import { SimulationDashboard } from './components/SimulationDashboard';
import { ClassicalStrategy, QuantumStrategy } from './engine/Simulation';
import './App.css';
import { Theory } from './components/Theory';
import Tutorial from './components/Tutorial';

function App() {
    const [mode, setMode] = useState<'how-to' | 'classical' | 'quantum' | 'theory'>('how-to');
    const [nGames, setNGames] = useState<number | ''>(1000);
    const [evaluationOrder, setEvaluationOrder] = useState<'alice' | 'bob' | 'random'>('random');
    const [isAnimating, setIsAnimating] = useState(false);
    const [showQuantumPopup, setShowQuantumPopup] = useState(false);
    const [hasSeenQuantumPopup, setHasSeenQuantumPopup] = useState(() => localStorage.getItem('hasSeenQuantumPopup') === 'true');
    const [hasVisited, setHasVisited] = useState(() => localStorage.getItem('hasVisited') === 'true');
    const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem('cookieConsent') === 'true');
    const [compareClassical, setCompareClassical] = useState(false);

    const [classicalStrategy, setClassicalStrategy] = useState<ClassicalStrategy>({
        alice: null,
        bob: null,
        aliceDefault: true,
        bobDefault: false
    });
    const [quantumStrategy, setQuantumStrategy] = useState<QuantumStrategy>({
        alice: null,
        bob: null,
        aliceDefault: false,
        bobDefault: true
    });

    useEffect(() => {
        document.body.className = `theme-${mode}`;
    }, [mode]);

    const handleRun = () => {
        if (mode === 'how-to') return;
        if (nGames === '' || nGames < 1) {
            setNGames(1);
        }
        setIsAnimating(true);
    };

    const handleModeChange = (newMode: 'how-to' | 'classical' | 'quantum' | 'theory') => {
        setMode(newMode);

        if (newMode === 'quantum' && !hasSeenQuantumPopup) {
            setShowQuantumPopup(true);
            setHasSeenQuantumPopup(true);

            if (cookieConsent) {
                localStorage.setItem('hasSeenQuantumPopup', 'true');
            }
        }
    };

    const handleTutorialComplete = () => {
        setHasVisited(true);
        if (cookieConsent) {
            localStorage.setItem('hasVisited', 'true');
        }
    };

    const acceptCookies = () => {
        setCookieConsent(true);
        localStorage.setItem('cookieConsent', 'true');
        if (hasSeenQuantumPopup) {
            localStorage.setItem('hasSeenQuantumPopup', 'true');
        }
        if (hasVisited) {
            localStorage.setItem('hasVisited', 'true');
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

            <Tutorial showTutorial={!hasVisited} onComplete={handleTutorialComplete} />
            <div className="container" style={{ maxWidth: '1200px' }}>
                <header>
                    <h1 className="glow-text">CHSH Game Simulation</h1>
                    <p className="subtitle">Explore the limits of local hidden-variables vs quantum non-locality</p>
                </header>

                <div className="main-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }}>
                    <div className="content-area" style={{ width: '100%' }}>
                        {isAnimating ? (
                            <SimulationDashboard
                                mode={mode as 'classical' | 'quantum'}
                                nGames={nGames === '' ? 1 : nGames}
                                evaluationOrder={evaluationOrder}
                                classicalStrategy={classicalStrategy}
                                quantumStrategy={quantumStrategy}
                                compareClassical={compareClassical}
                                onClose={() => setIsAnimating(false)}
                            />
                        ) : (
                            <>
                                <div className="mode-selector">
                            <button
                                className={`mode-btn ${mode === 'how-to' ? 'active' : ''}`}
                                onClick={() => handleModeChange('how-to')}
                            >
                                How to Play
                            </button>
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
                    <button
                        className={`mode-btn ${mode === 'theory' ? 'active' : ''}`}
                        onClick={() => handleModeChange('theory')}
                    >
                        Math & Physics
                    </button>
                </div>
                
                {mode === 'quantum' && !isAnimating && (
                    <div className="sandbox-header" style={{ marginTop: '1rem' }}>
                        <h2>Quantum Entanglement Strategy</h2>
                        <p>Build a strategy for Alice and Bob using quantum measurement blocks. They share an entangled pair of particles.</p>
                    </div>
                )}
                {mode === 'classical' && !isAnimating && (
                    <div className="sandbox-header" style={{ marginTop: '1rem' }}>
                        <h2>Non-Entangled Quantum Strategy</h2>
                        <p>Build a strategy for Alice and Bob using interlocking logic blocks.</p>
                    </div>
                )}

                {!isAnimating && (mode === 'classical' || mode === 'quantum') && <RulesSidebar />}

                <main>
                    <HowToPlay isActive={mode === 'how-to'} />
                    <ClassicalSandbox isActive={mode === 'classical'} strategy={classicalStrategy} setStrategy={setClassicalStrategy} />
                    <QuantumSandbox isActive={mode === 'quantum'} strategy={quantumStrategy} setStrategy={setQuantumStrategy} onHelpClick={() => setShowQuantumPopup(true)} />
                    <Theory isActive={mode === 'theory'} />

                    {mode !== 'how-to' && mode !== 'theory' && (
                        <section className="simulation-controls">
                            <div className="run-panel glass-panel">
                            <div className="input-group inline">
                                <label htmlFor="num-games">Number of Games (N):</label>
                                <input
                                    type="number"
                                    id="num-games"
                                    value={nGames}
                                    onChange={(e) => {
                                        if (e.target.value === '') {
                                            setNGames('');
                                            return;
                                        }
                                        let val = parseInt(e.target.value);
                                        if (isNaN(val)) return;
                                        if (val > 1000000) val = 1000000;
                                        setNGames(val);
                                    }}
                                    onBlur={() => {
                                        if (nGames === '' || nGames < 1) {
                                            setNGames(1);
                                        }
                                    }}
                                    min="100" max="1000000" step="100"
                                />
                            </div>
                            <div className="input-group inline">
                                <label htmlFor="eval-order">Play Order:</label>
                                <select
                                    id="eval-order"
                                    value={evaluationOrder}
                                    onChange={(e) => setEvaluationOrder(e.target.value as 'alice' | 'bob' | 'random')}
                                    style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', padding: '4px 8px', borderRadius: '4px' }}
                                >
                                    <option value="alice">Alice First</option>
                                    <option value="bob">Bob First</option>
                                    <option value="random">Random (Per Game)</option>
                                </select>
                            </div>
                            {mode === 'quantum' && (
                                <div className="input-group inline" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label htmlFor="compare-classical" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                                        <input
                                            type="checkbox"
                                            id="compare-classical"
                                            checked={compareClassical}
                                            onChange={(e) => setCompareClassical(e.target.checked)}
                                            style={{ marginRight: '8px', cursor: 'pointer' }}
                                        />
                                        Compare to Classical (No Entanglement)
                                    </label>
                                </div>
                            )}
                            <button
                                className={`run-btn ${mode === 'quantum' ? 'quantum' : ''}`}
                                onClick={handleRun}
                            >
                                <span className="btn-text">Run Simulation</span>
                                <div className="btn-glow"></div>
                            </button>
                            </div>
                        </section>
                    )}
                </main>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
