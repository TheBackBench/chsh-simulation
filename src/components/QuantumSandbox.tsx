import React from 'react';
import { QuantumStrategy } from '../engine/Simulation';

interface Props {
    strategy: QuantumStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<QuantumStrategy>>;
    isActive: boolean;
}

export const QuantumSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive }) => {
    if (!isActive) return null;

    const handleChange = (key: keyof QuantumStrategy, value: number) => {
        setStrategy(prev => ({ ...prev, [key]: value }));
    };

    const loadOptimal = () => {
        setStrategy({ a0: 0, a1: 45, b0: 22.5, b1: -22.5 });
    };

    return (
        <section id="quantum-sandbox" className="sandbox active">
            <div className="sandbox-header">
                <h2>Quantum Entanglement Strategy</h2>
                <p>Define measurement angles for Alice and Bob. They share an entangled pair of particles.</p>
            </div>
            
            <div className="strategy-builder">
                <div className="player-card alice quantum">
                    <h3>Alice (Angles)</h3>
                    <div className="input-group">
                        <label>Axis A0 (for "0"):</label>
                        <div className="angle-input">
                            <input type="number" value={strategy.a0} onChange={(e) => handleChange('a0', parseFloat(e.target.value) || 0)} />
                            <span>°</span>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Axis A1 (for "1"):</label>
                        <div className="angle-input">
                            <input type="number" value={strategy.a1} onChange={(e) => handleChange('a1', parseFloat(e.target.value) || 0)} />
                            <span>°</span>
                        </div>
                    </div>
                </div>

                <div className="entanglement-link glowing">
                    <div className="link-line"></div>
                    <span>Entangled Pair</span>
                </div>

                <div className="player-card bob quantum">
                    <h3>Bob (Angles)</h3>
                    <div className="input-group">
                        <label>Axis B0 (for "0"):</label>
                        <div className="angle-input">
                            <input type="number" value={strategy.b0} onChange={(e) => handleChange('b0', parseFloat(e.target.value) || 0)} />
                            <span>°</span>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Axis B1 (for "1"):</label>
                        <div className="angle-input">
                            <input type="number" value={strategy.b1} onChange={(e) => handleChange('b1', parseFloat(e.target.value) || 0)} />
                            <span>°</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="preset-controls">
                <button className="secondary-btn" onClick={loadOptimal}>Load Optimal Angles</button>
            </div>
        </section>
    );
};
