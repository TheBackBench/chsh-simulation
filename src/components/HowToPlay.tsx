import React from 'react';

export const HowToPlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <section className="how-to-play sandbox active glass-panel" style={{ padding: '2rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
            <h2 style={{ color: 'var(--accent-teal)', marginBottom: '1.5rem', fontSize: '2rem' }}>How to Play</h2>

            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                Welcome to the CHSH Game Simulator! Your goal is to construct a strategy for Alice and Bob that maximizes their win rate in the CHSH game.
            </p>

            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: '#fff', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Classical Mode</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                In Classical Mode, Alice and Bob can only rely on local hidden variables (pre-agreed strategies). 
                Use the <strong style={{ color: 'var(--accent-teal)' }}>If / Else</strong> block to branch on conditions, 
                and check inputs using the <strong style={{ color: 'var(--accent-teal)' }}>Received 1</strong> or <strong style={{ color: 'var(--accent-teal)' }}>Received 0</strong> blocks. 
                You can also use the <strong style={{ color: 'var(--accent-teal)' }}>Probability</strong> block for random choices. 
                Every branch must end with a <strong style={{ color: 'var(--accent-teal)' }}>Return 1</strong> or <strong style={{ color: 'var(--accent-teal)' }}>Return 0</strong> block.
            </p>

            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: 'var(--quantum-pink)', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Quantum Mode</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                In Quantum Mode, Alice and Bob share an entangled pair of particles. Instead of just looking at their received bits, they can perform quantum measurements! 
                Drag the <strong style={{ color: 'var(--quantum-pink)' }}>Spin</strong> block to measure the spin of their particle along a specific angle. 
                When you run the simulation, it runs <strong style={{ color: '#fff' }}>two parallel tracks</strong> to compare:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong style={{ color: 'var(--quantum-pink)' }}>True Entanglement</strong>: Uses quantum non-locality. The relative angles of Alice and Bob's measurements alter their correlation, unlocking higher win rates.</li>
                <li><strong style={{ color: 'var(--text-muted)' }}>Hidden Variable</strong>: Simulates the same measurement angles using local hidden variables (pre-determined spins), illustrating the classical constraint.</li>
            </ul>

            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: '#fff', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Building the Strategy</h3>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Drag blocks from the <strong>Block Bank</strong> into the player cards.</li>
                <li>Ensure every logic path ends with a <strong>Return 1</strong> or <strong>Return 0</strong> block.</li>
                <li>If an input case is not covered by your blocks, the strategy falls back to the <strong>Default Fallback</strong> dropdown value selected at the bottom of the player card.</li>
                <li>Click the angle numbers inside the <strong>Spin</strong> blocks to open the interactive dial and set the measurement directions.</li>
            </ul>
        </section>
    );
};
