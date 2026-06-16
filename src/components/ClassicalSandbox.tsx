import React, { useState } from 'react';
import { ClassicalStrategy } from '../engine/Simulation';

interface Props {
    strategy: ClassicalStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<ClassicalStrategy>>;
    isActive: boolean;
}

export const ClassicalSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive }) => {
    const [isProbabilistic, setIsProbabilistic] = useState({
        alice: false,
        bob: false,
    });

    if (!isActive) return null;

    const handleChange = (key: keyof ClassicalStrategy, value: number) => {
        setStrategy(prev => ({ ...prev, [key]: value }));
    };

    const handlePlayerModeChange = (player: 'alice' | 'bob', prob: boolean) => {
        setIsProbabilistic(prev => ({ ...prev, [player]: prob }));
        if (!prob) {
            handleChange(`${player}0` as keyof ClassicalStrategy, strategy[`${player}0` as keyof ClassicalStrategy] >= 0.5 ? 1 : 0);
            handleChange(`${player}1` as keyof ClassicalStrategy, strategy[`${player}1` as keyof ClassicalStrategy] >= 0.5 ? 1 : 0);
        }
    };

    const renderPlayerHeader = (player: 'alice' | 'bob') => {
        const isProb = isProbabilistic[player];
        return (
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', padding: 0, border: 'none', textAlign: 'center' }}>
                    {player === 'alice' ? 'Alice' : 'Bob'}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                        style={{
                            fontSize: '0.75rem', padding: '4px 12px',
                            background: !isProb ? 'var(--accent-teal)' : 'transparent',
                            color: !isProb ? '#000' : 'var(--text-muted)',
                            border: '1px solid var(--accent-teal)',
                            borderRadius: '4px', cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => handlePlayerModeChange(player, false)}
                    >
                        Deterministic
                    </button>
                    <button
                        style={{
                            fontSize: '0.75rem', padding: '4px 12px',
                            background: isProb ? 'var(--accent-teal)' : 'transparent',
                            color: isProb ? '#000' : 'var(--text-muted)',
                            border: '1px solid var(--accent-teal)',
                            borderRadius: '4px', cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => handlePlayerModeChange(player, true)}
                    >
                        Probabilistic
                    </button>
                </div>
            </div>
        );
    };

    const renderInputGroup = (player: 'alice' | 'bob', instruction: '0' | '1') => {
        const key = `${player}${instruction}` as keyof ClassicalStrategy;
        const isProb = isProbabilistic[player];
        const value = strategy[key];

        return (
            <div className="input-group">
                <label style={{ marginBottom: '0.5rem' }}>If instruction is "{instruction}":</label>

                {!isProb ? (
                    <select style={{ width: '100%' }} value={value === 1 ? 'true' : 'false'} onChange={(e) => handleChange(key, e.target.value === 'true' ? 1 : 0)}>
                        <option value="true">Output True</option>
                        <option value="false">Output False</option>
                    </select>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="number"
                            min="0" max="100"
                            value={Math.round(value * 100).toString()}
                            onChange={(e) => {
                                let val = parseInt(e.target.value);
                                if (isNaN(val)) val = 0;
                                if (val > 100) val = 100;
                                if (val < 0) val = 0;
                                handleChange(key, val / 100);
                            }}
                            style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', minWidth: '45px' }}>% True</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id="classical-sandbox" className="sandbox active">
            <div className="sandbox-header">
                <h2>Local Hidden-Variable Strategy</h2>
                <p>Define a deterministic or probabilistic strategy for Alice and Bob.</p>
            </div>

            <div className="strategy-builder">
                <div className="player-card alice">
                    {renderPlayerHeader('alice')}
                    {renderInputGroup('alice', '0')}
                    {renderInputGroup('alice', '1')}
                </div>

                <div className="entanglement-link">
                    <div className="link-line"></div>
                    <span>Local Link</span>
                </div>

                <div className="player-card bob">
                    {renderPlayerHeader('bob')}
                    {renderInputGroup('bob', '0')}
                    {renderInputGroup('bob', '1')}
                </div>
            </div>
        </section>
    );
};
