import React from 'react';
import { ClassicalStrategy, BlockNode } from '../engine/Simulation';
import { BlockBuilder } from './BlockBuilder';

interface Props {
    strategy: ClassicalStrategy;
    setStrategy: React.Dispatch<React.SetStateAction<ClassicalStrategy>>;
    isActive: boolean;
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

export const ClassicalSandbox: React.FC<Props> = ({ strategy, setStrategy, isActive }) => {
    if (!isActive) return null;

    const handleAliceChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, alice: node }));
    };

    const handleBobChange = (node: BlockNode | null) => {
        setStrategy(prev => ({ ...prev, bob: node }));
    };

    return (
        <section id="classical-sandbox" className="sandbox active">
            <div className="sandbox-header">
                <h2>Local Hidden-Variable Strategy</h2>
                <p>Build a strategy for Alice and Bob using interlocking logic blocks.</p>
            </div>

            <div className="palette glass-panel" style={{ padding: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Block Palette</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Drag blocks from here into the slots below.</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                    <DraggableBlock type="IF_ELSE" label="If / Else" className="block-if" />
                    <DraggableBlock type="PROB" label="Return True with Probability of" className="block-prob" />
                    <DraggableBlock type="RETURN_TRUE" label="Return True" className="block-action" />
                    <DraggableBlock type="RETURN_FALSE" label="Return False" className="block-action" />
                    <DraggableBlock type="RECEIVED_1" label="Condition: Received 1" className="block-condition" />
                    <DraggableBlock type="RECEIVED_0" label="Condition: Received 0" className="block-condition" />
                    <DraggableBlock type="PROB_COND" label="Condition: Probability %" className="block-condition" />
                </div>
            </div>

            <div className="strategy-builder" style={{ alignItems: 'flex-start' }}>
                <div className="player-card alice">
                    <h3 style={{ margin: '0 0 1.5rem 0', padding: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', textAlign: 'center' }}>
                        Alice
                    </h3>
                    <div style={{ minHeight: '200px' }}>
                        <BlockBuilder node={strategy.alice} onChange={handleAliceChange} />
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Default Fallback</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            Have you covered all options in your blocks? If so, this default will never be invoked!
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

                <div className="entanglement-link" style={{ marginTop: '4rem' }}>
                    <div className="link-line"></div>
                    <span>Local Link</span>
                </div>

                <div className="player-card bob">
                    <h3 style={{ margin: '0 0 1.5rem 0', padding: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', textAlign: 'center' }}>
                        Bob
                    </h3>
                    <div style={{ minHeight: '200px' }}>
                        <BlockBuilder node={strategy.bob} onChange={handleBobChange} />
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Default Fallback</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            Have you covered all options in your blocks? If so, this default will never be invoked!
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
        </section>
    );
};
