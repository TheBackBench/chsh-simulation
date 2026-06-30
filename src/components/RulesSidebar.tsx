import React from 'react';

export const RulesSidebar: React.FC = () => {
    return (
        <aside className="rules-sidebar glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '1.5rem', margin: '0 auto' }}>
            <h3 style={{ color: 'var(--accent-teal)', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', textAlign: 'center' }}>Game Rules</h3>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px', margin: '0 auto' }}>
                <li>Alice and Bob are separated and cannot communicate.</li>
                <li>They each receive a random bit (0 or 1).</li>
                <li>They must each output a bit (True = 1, False = 0).</li>
                <li><strong>Win Condition:</strong> Their outputs must be DIFFERENT if they both received 1, and the SAME otherwise.</li>
            </ul>
        </aside>
    );
};
