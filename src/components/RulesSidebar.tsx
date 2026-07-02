import React from 'react';

export const RulesSidebar: React.FC = () => {
    return (
        <aside className="rules-sidebar glass-panel" style={{ width: '100%', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--accent-teal)', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', textAlign: 'center' }}>Game Rules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--accent-teal)', fontWeight: 'bold', marginBottom: '0.5rem' }}>1. No Communication</div>
                    Alice and Bob are separated and cannot communicate
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--accent-teal)', fontWeight: 'bold', marginBottom: '0.5rem' }}>2. The Input</div>
                    They each receive a random bit:<br />0 or 1
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--accent-teal)', fontWeight: 'bold', marginBottom: '0.5rem' }}>3. The Output</div>
                    They must each output a bit:<br />1 or 0
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--accent-teal)', fontWeight: 'bold', marginBottom: '0.5rem' }}>4. Win Condition</div>
                    Outputs must be <strong>DIFFERENT</strong> if both received 1, and <strong>SAME</strong> otherwise
                </div>
            </div>
        </aside>
    );
};
