import React from 'react';
import { QuantumStrategy, BlockNode } from '../engine/Simulation';
import { BlockBuilder } from './BlockBuilder';
import './QuantumSandbox.css';

interface Props {
    strategy: QuantumStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<QuantumStrategy>>;
    isActive: boolean;
    onHelpClick?: () => void;
}

const DraggableBlock: React.FC<{ type: string, label: string, className: string }> = ({ type, label, className }) => {
    return (
        <div
            className={`block ${className}`}
            style={{ display: 'inline-block', margin: '4px', cursor: 'grab', fontSize: '0.9rem' }}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('blockType', type);
            }}
        >
            {label}
        </div>
    );
};

export const QuantumSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive, onHelpClick }) => {
    if (!isActive) return null;

    const handleAliceChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, alice: node }));
    };

    const handleBobChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, bob: node }));
    };

    const loadOptimal = () => {
        setStrategy({
            alice: {
                type: 'IF_ELSE',
                condition: { type: 'RECEIVED', expected: 0 },
                trueBranch: {
                    type: 'IF_ELSE',
                    condition: { type: 'MEASURE_SPIN_COND', angle: 0, expected: true },
                    trueBranch: { type: 'RETURN', value: true },
                    falseBranch: { type: 'RETURN', value: false }
                },
                falseBranch: {
                    type: 'IF_ELSE',
                    condition: { type: 'MEASURE_SPIN_COND', angle: 45, expected: true },
                    trueBranch: { type: 'RETURN', value: true },
                    falseBranch: { type: 'RETURN', value: false }
                }
            },
            bob: {
                type: 'IF_ELSE',
                condition: { type: 'RECEIVED', expected: 0 },
                trueBranch: {
                    type: 'IF_ELSE',
                    condition: { type: 'MEASURE_SPIN_COND', angle: 22.5, expected: true },
                    trueBranch: { type: 'RETURN', value: true },
                    falseBranch: { type: 'RETURN', value: false }
                },
                falseBranch: {
                    type: 'IF_ELSE',
                    condition: { type: 'MEASURE_SPIN_COND', angle: 337.5, expected: true },
                    trueBranch: { type: 'RETURN', value: true },
                    falseBranch: { type: 'RETURN', value: false }
                }
            },
            aliceDefault: false,
            bobDefault: false
        });
    };

    return (
        <section id="quantum-sandbox" className="sandbox active">
            <div className="sandbox-header">
                <h2>
                    Quantum Entanglement Strategy
                    {onHelpClick && (
                        <button
                            className="secondary-btn help-btn"
                            onClick={onHelpClick}
                            title="Show Help"
                        >
                            ?
                        </button>
                    )}
                </h2>
                <p>Build a strategy for Alice and Bob using quantum measurement blocks. They share an entangled pair of particles.</p>
            </div>

            <div className="palette glass-panel" style={{ padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Block Palette</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Drag blocks from here into the slots below.</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    <DraggableBlock type="IF_ELSE" label="If / Else" className="block-if" />
                    <DraggableBlock type="RETURN_TRUE" label="Return True" className="block-action" />
                    <DraggableBlock type="RETURN_FALSE" label="Return False" className="block-action" />
                    <DraggableBlock type="MEASURE_SPIN_COND" label="Condition: Spin is Up/Down" className="block-condition" />
                    <DraggableBlock type="RECEIVED_1" label="Condition: Received 1" className="block-condition" />
                    <DraggableBlock type="RECEIVED_0" label="Condition: Received 0" className="block-condition" />
                </div>
            </div>

            <div className="strategy-builder" style={{ alignItems: 'flex-start' }}>
                <div className="player-card alice quantum">
                    <h3 style={{ margin: '0 0 1.5rem 0', padding: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', textAlign: 'center' }}>
                        Alice
                    </h3>
                    <div style={{ minHeight: '200px' }}>
                        <BlockBuilder node={strategy.alice} onChange={handleAliceChange} />
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Default Fallback</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            Have you covered all options in your blocks?
                        </p>
                        <select
                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                            value={strategy.aliceDefault ? 'true' : 'false'}
                            onChange={(e) => setStrategy(prev => ({ ...prev, aliceDefault: e.target.value === 'true' }))}
                        >
                            <option value="true">Return True</option>
                            <option value="false">Return False</option>
                        </select>
                    </div>
                </div>

                <div className="entanglement-link glowing" style={{ marginTop: '4rem' }}>
                    <div className="link-line"></div>
                    <span>Entangled Pair</span>
                </div>

                <div className="player-card bob quantum">
                    <h3 style={{ margin: '0 0 1.5rem 0', padding: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', textAlign: 'center' }}>
                        Bob
                    </h3>
                    <div style={{ minHeight: '200px' }}>
                        <BlockBuilder node={strategy.bob} onChange={handleBobChange} />
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Default Fallback</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            Have you covered all options in your blocks?
                        </p>
                        <select
                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                            value={strategy.bobDefault ? 'true' : 'false'}
                            onChange={(e) => setStrategy(prev => ({ ...prev, bobDefault: e.target.value === 'true' }))}
                        >
                            <option value="true">Return True</option>
                            <option value="false">Return False</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="preset-controls">
                <button className="secondary-btn" onClick={loadOptimal}>Reveal Optimal Strategy</button>
            </div>
        </section>
    );
};
