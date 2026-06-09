import React from 'react';
import { ClassicalStrategy } from '../engine/Simulation';

interface Props {
    strategy: ClassicalStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<ClassicalStrategy>>;
    isActive: boolean;
}

export const ClassicalSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive }) => {
    if (!isActive) return null;

    const handleChange = (key: keyof ClassicalStrategy, value: boolean) => {
        setStrategy(prev => ({ ...prev, [key]: value }));
    };

    return (
        <section id="classical-sandbox" className="sandbox active">
            <div className="sandbox-header">
                <h2>Local Hidden-Variable Strategy</h2>
                <p>Define a deterministic strategy for Alice and Bob. What will they output for each instruction?</p>
            </div>
            
            <div className="strategy-builder">
                <div className="player-card alice">
                    <h3>Alice</h3>
                    <div className="input-group">
                        <label>If instruction is "0":</label>
                        <select value={strategy.alice0.toString()} onChange={(e) => handleChange('alice0', e.target.value === 'true')}>
                            <option value="true">Output True</option>
                            <option value="false">Output False</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>If instruction is "1":</label>
                        <select value={strategy.alice1.toString()} onChange={(e) => handleChange('alice1', e.target.value === 'true')}>
                            <option value="true">Output True</option>
                            <option value="false">Output False</option>
                        </select>
                    </div>
                </div>

                <div className="entanglement-link">
                    <div className="link-line"></div>
                    <span>Local Link</span>
                </div>

                <div className="player-card bob">
                    <h3>Bob</h3>
                    <div className="input-group">
                        <label>If instruction is "0":</label>
                        <select value={strategy.bob0.toString()} onChange={(e) => handleChange('bob0', e.target.value === 'true')}>
                            <option value="true">Output True</option>
                            <option value="false">Output False</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>If instruction is "1":</label>
                        <select value={strategy.bob1.toString()} onChange={(e) => handleChange('bob1', e.target.value === 'true')}>
                            <option value="true">Output True</option>
                            <option value="false">Output False</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
};
