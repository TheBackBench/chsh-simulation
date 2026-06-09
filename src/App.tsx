import React, { useState } from 'react';
import './index.css';
import { ClassicalSandbox } from './components/ClassicalSandbox';
import { QuantumSandbox } from './components/QuantumSandbox';
import { runSimulation, ClassicalStrategy, QuantumStrategy, SimulationResult } from './engine/Simulation';

function App() {
    const [mode, setMode] = useState<'classical' | 'quantum'>('classical');
    const [nGames, setNGames] = useState(10000);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<SimulationResult | null>(null);

    const [classicalStrategy, setClassicalStrategy] = useState<ClassicalStrategy>({
        alice0: true, alice1: true, bob0: true, bob1: true
    });
    const [quantumStrategy, setQuantumStrategy] = useState<QuantumStrategy>({
        a0: 0, a1: 90, b0: 45, b1: -45
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
    };

    return (
        <>
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
            
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
                    <QuantumSandbox isActive={mode === 'quantum'} strategy={quantumStrategy} setStrategy={setQuantumStrategy} />

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
                                className="run-btn" 
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
                                        borderColor: 'var(--quantum-magenta)',
                                        boxShadow: '0 0 20px var(--quantum-magenta-dim)'
                                    } : {}}
                                >
                                    <span className="label">Success Rate</span>
                                    <span 
                                        className="value"
                                        style={mode === 'quantum' && result.rate > 76 ? {
                                            background: 'linear-gradient(90deg, var(--quantum-magenta), #ff66ff)',
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
