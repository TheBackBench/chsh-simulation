import React from 'react';
import { QuantumStrategy, BlockNode } from '../engine/Simulation';
import { BlockBuilder } from './BlockBuilder';
import { MobileDragProvider, useMobileDrag } from './MobileDragContext';
import './QuantumSandbox.css';

interface Props {
    strategy: QuantumStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<QuantumStrategy>>;
    isActive: boolean;
}

const DraggableBlock: React.FC<{ type: string, label: string, className: string, title?: string }> = ({ type, label, className, title }) => {
    const { selectedBlock, setSelectedBlock } = useMobileDrag();
    const isSelected = selectedBlock === type;

    const handleClick = () => {
        if (window.innerWidth <= 768) {
            setSelectedBlock(isSelected ? null : type);
        }
    };

    return (
        <div className={title ? 'has-tooltip' : ''} data-tooltip={title} style={{ display: 'inline-block', margin: '4px' }}>
            <div
                className={`block ${className} ${isSelected ? 'mobile-selected-block' : ''}`}
                style={{ cursor: 'grab', fontSize: '0.9rem', width: '150px', textAlign: 'center', justifyContent: 'center' }}
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('blockType', type);
                }}
                onClick={handleClick}
            >
                {label}
            </div>
        </div>
    );
};

export const QuantumSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive }) => {
    if (!isActive) return null;

    const handleAliceChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, alice: node }));
    };

    const handleBobChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, bob: node }));
    };

    const clearBlocks = () => {
        setStrategy({
            alice: null,
            bob: null,
            aliceDefault: false,
            bobDefault: false
        });
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
        <MobileDragProvider>
            <section id="quantum-sandbox" className="sandbox active">

            <div className="palette glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}></div>
                    <h3 style={{ margin: 0, textAlign: 'center', flex: 1 }}>Block Bank</h3>
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                            className="secondary-btn"
                            onClick={loadOptimal}
                            title={`Builds the optimal strategy that achieves\nthe maximum possible success rate`}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            Build Optimal Strategy
                        </button>
                        <button
                            className="secondary-btn"
                            onClick={clearBlocks}
                            title="Clears all dragged strategy blocks"
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: 'rgba(255, 68, 68, 0.4)', color: '#ff7777' }}
                        >
                            Clear Blocks
                        </button>
                    </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>Drag blocks from here into the slots below.</p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'stretch', flexWrap: 'wrap' }}>
                    <div className="palette-sub-area" style={{ flex: 1, minWidth: '240px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--quantum-pink)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', textAlign: 'center' }}>Base Blocks</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <DraggableBlock type="IF_ELSE" label="If / Else" className="block-if" title="Branches based on condition" />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <DraggableBlock type="RETURN_TRUE" label="Return 1" className="block-action" title="Returns 1 and ends turn" />
                                <DraggableBlock type="RETURN_FALSE" label="Return 0" className="block-action" title="Returns 0 and ends turn" />
                            </div>
                        </div>
                    </div>

                    <div className="palette-sub-area" style={{ flex: 1, minWidth: '240px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--quantum-pink)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', textAlign: 'center' }}>Condition Blocks</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <DraggableBlock type="MEASURE_SPIN_COND" label="Spin" className="block-condition quantum-action" title="Checks whether the spin at a certain angle is up or down and returns 1 or 0 accordingly" />
                                <DraggableBlock type="PROB_COND" label="Probability" className="block-condition quantum-action" title="Evaluates to True with specified probability" />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <DraggableBlock type="RECEIVED_1" label="Received 1" className="block-condition" title="Checks if received bit is 1" />
                                <DraggableBlock type="RECEIVED_0" label="Received 0" className="block-condition" title="Checks if received bit is 0" />
                            </div>
                        </div>
                    </div>
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
                            <option value="true">Return 1</option>
                            <option value="false">Return 0</option>
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
                            <option value="true">Return 1</option>
                            <option value="false">Return 0</option>
                        </select>
                    </div>
                </div>
            </div>

            </section>
        </MobileDragProvider>
    );
};
