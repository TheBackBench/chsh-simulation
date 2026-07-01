import React from 'react';

export const HowToPlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    if (!isActive) return null;

    return (
        <section className="how-to-play sandbox active glass-panel" style={{ padding: '2rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
            <h2 style={{ color: 'var(--accent-teal)', marginBottom: '1.5rem', fontSize: '2rem' }}>How to Play</h2>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                Welcome to the CHSH Game Simulator! Your goal is to construct a strategy for Alice and Bob that maximizes their win rate.
            </p>
            
            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: '#fff', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Classical Mode</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                In Classical Mode, Alice and Bob can only rely on local hidden variables (pre-agreed strategies). 
                Use the <strong style={{ color: '#0bc' }}>If / Else</strong> blocks to check which bit they received, 
                and use the <strong style={{ color: '#0bc' }}>Return True</strong> or <strong style={{ color: '#0bc' }}>Return False</strong> blocks to define their output.
            </p>
            
            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: 'var(--quantum-pink)', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Quantum Mode</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                In Quantum Mode, Alice and Bob share an entangled pair of particles. Instead of just looking at their received bit, they can perform quantum measurements! 
                Drag the <strong style={{ color: 'var(--quantum-pink)' }}>Condition: Spin at ___ is Up/Down</strong> block to measure the spin of their particle along a specific angle. 
                The difference between the angles chosen by Alice and Bob alters the probability of their results aligning, unlocking higher win rates due to quantum non-locality.
            </p>
            
            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem', color: '#fff', fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Building the Tree</h3>
            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Drag blocks from the palette into the dashed drop zones.</li>
                <li>Ensure every branch ends with a <strong>Return True</strong> or <strong>Return False</strong> block.</li>
                <li>If a case is not covered by your blocks, the strategy will fall back to the Default Fallback selected at the bottom of the player card.</li>
                <li>Click the angle numbers to open the interactive dial and set your measurement axes.</li>
            </ul>
        </section>
    );
};
