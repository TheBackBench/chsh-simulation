import React from 'react';

interface Props {
    isActive: boolean;
}

export const Theory: React.FC<Props> = ({ isActive }) => {
    if (!isActive) return null;

    const mathBlockStyle = {
        padding: '1.25rem',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        textAlign: 'center' as const,
        fontFamily: 'monospace',
        fontSize: '1.3rem',
        margin: '1.5rem auto',
        maxWidth: 'fit-content',
        color: 'white',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
        overflowX: 'auto' as const
    };

    return (
        <section className="theory-section active">
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <h2 className="glow-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>The Physics and Mathematics of the CHSH Game</h2>
                
                <div style={{ marginTop: '1.5rem', lineHeight: '1.7', fontSize: '1.05rem' }}>
                    
                    <h3 style={{ color: 'var(--accent-teal)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>The Setup</h3>
                    <p style={{ marginTop: '1rem' }}>
                        The CHSH game is a foundational thought experiment in quantum mechanics, designed by John Clauser, Michael Horne, Abner Shimony, and Richard Holt. It falls under the category of nonlocal games.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Two players, Alice and Bob, are physically separated such that no communication between them is possible. A referee sends each player a single random bit: Alice receives <strong>x</strong> and Bob receives <strong>y</strong> (where both are either 0 or 1).
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        They must independently reply with their own bits, <strong>a</strong> and <strong>b</strong>. To win the game, their responses must satisfy the following logical condition:
                    </p>
                    <div style={mathBlockStyle}>
                        a ⊕ b = x ∧ y
                    </div>
                    <p style={{ marginTop: '1rem' }}>
                        In practical terms, this establishes a strict truth table for victory:
                    </p>
                    <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <tr>
                                    <th style={{ padding: '10px' }}>Alice's Input (x)</th>
                                    <th style={{ padding: '10px' }}>Bob's Input (y)</th>
                                    <th style={{ padding: '10px' }}>Required Output Condition</th>
                                    <th style={{ padding: '10px' }}>Winning Responses (a, b)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>0</td>
                                    <td style={{ padding: '10px' }}>0</td>
                                    <td style={{ padding: '10px' }}>Must be the same (a ⊕ b = 0)</td>
                                    <td style={{ padding: '10px' }}>(0,0) or (1,1)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>0</td>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>Must be the same (a ⊕ b = 0)</td>
                                    <td style={{ padding: '10px' }}>(0,0) or (1,1)</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>0</td>
                                    <td style={{ padding: '10px' }}>Must be the same (a ⊕ b = 0)</td>
                                    <td style={{ padding: '10px' }}>(0,0) or (1,1)</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>1</td>
                                    <td style={{ padding: '10px' }}>Must be different (a ⊕ b = 1)</td>
                                    <td style={{ padding: '10px' }}>(0,1) or (1,0)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <h3 style={{ color: 'var(--accent-teal)', marginTop: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>The Classical Limit</h3>
                    <p style={{ marginTop: '1rem' }}>
                        In a purely classical universe, Alice and Bob can agree on a shared strategy beforehand and utilize shared randomness, but they are strictly cut off from communicating once the inputs are received.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Because the inputs are uniformly randomized, the optimal deterministic strategies—such as both players always outputting 0, or Alice mirroring her input while Bob always outputs 0—will only satisfy the winning condition for 3 out of the 4 possible input pairs.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Furthermore, any probabilistic strategy is simply a weighted average of deterministic strategies. A weighted average can never exceed the maximum success rate of its highest-performing component. Thus, classical systems face a hard mathematical ceiling.
                    </p>
                    <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                        <li style={{ fontWeight: 'bold', color: '#ffb84d' }}>Classical Maximum Win Probability: 75%</li>
                    </ul>

                    <h3 style={{ color: 'var(--quantum-pink)', marginTop: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>The Quantum Advantage</h3>
                    <p style={{ marginTop: '1rem' }}>
                        Quantum mechanics bypasses this limit by allowing Alice and Bob to share a pair of entangled qubits before they separate. Upon receiving their respective bits, they perform specific quantum measurements on their entangled particles.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        When measuring an entangled state, the probability of Alice and Bob's outcomes matching is governed by <strong>cos²(θ)</strong>, where θ is the relative angle between their measurement bases. An optimal quantum strategy selects angles that maximize this probability when the rules demand matching answers, and minimizes it when the answers must differ.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        By setting Alice's measurement angles to 0° or 45° and Bob's to 22.5° or 337.5° (-22.5°), the relative angle between their measurements is forced to be exactly 22.5° or 67.5°.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Because the game's win condition aligns perfectly with this angular difference, this strategy maximizes their overall success rate.
                    </p>
                    <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                        <li style={{ fontWeight: 'bold', color: 'var(--quantum-pink)' }}>Quantum Maximum Win Probability: cos²(22.5°) ≈ 85.4%</li>
                    </ul>

                    <h3 style={{ color: 'var(--accent-teal)', marginTop: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Mathematical Formalization (The CHSH Inequality)</h3>
                    <p style={{ marginTop: '1rem' }}>
                        To rigorously define this gap, we shift from binary bits to expectation values. We map the classical inputs to measurement choices, and map the output bits (0, 1) to physical eigenvalues (+1, -1).
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        Let Alice's measurement choices be observables <strong>A</strong> and <strong>A′</strong>, and Bob's be <strong>B</strong> and <strong>B′</strong>. The correlation between their measurements is the expectation value of their product, denoted <strong>E(A, B)</strong>.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        The CHSH parameter, <strong>S</strong>, is constructed from these correlations:
                    </p>
                    <div style={mathBlockStyle}>
                        S = E(A, B) - E(A, B′) + E(A′, B) + E(A′, B′)
                    </div>

                    <h4 style={{ marginTop: '1.5rem', color: '#ffb84d' }}>The Classical Bound</h4>
                    <p style={{ marginTop: '1rem' }}>
                        Assume the universe operates on Local Realism.
                    </p>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '2rem' }}>
                        <li><strong>Realism:</strong> The particles already carry a definitive, pre-written "instruction set" for every possible measurement angle (+1 or -1).</li>
                        <li><strong>Locality:</strong> Alice's choice of measurement cannot instantly alter Bob's instruction set.</li>
                    </ul>
                    <p style={{ marginTop: '1rem' }}>
                        Because of Realism and Locality, for any single pair of particles, the values a, a′, b, and b′ must all simultaneously exist as specific, independent values of either +1 or -1.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        We can evaluate the correlation for a single pair of particles algebraically:
                    </p>
                    <div style={mathBlockStyle}>
                        S = a·b - a·b′ + a′·b + a′·b′
                    </div>
                    <p style={{ marginTop: '1rem' }}>
                        Factoring this yields:
                    </p>
                    <div style={mathBlockStyle}>
                        S = a(b - b′) + a′(b + b′)
                    </div>
                    <p style={{ marginTop: '1rem' }}>
                        Since b and b′ can only ever be +1 or -1, there are only two possible states for the terms in the parentheses:
                    </p>
                    <ol style={{ marginTop: '0.5rem', paddingLeft: '2.5rem' }}>
                        <li>If b and b′ share the same sign, (b - b′) = 0 and (b + b′) = ±2.</li>
                        <li>If b and b′ have different signs, (b - b′) = ±2 and (b + b′) = 0.</li>
                    </ol>
                    <p style={{ marginTop: '1rem' }}>
                        Because a and a′ are also restricted to ±1, the result of this equation for any conceivable hidden instruction set is always exactly ±2. Averaged over millions of iterations, the classical correlation cannot exceed this absolute bound:
                    </p>
                    <div style={{...mathBlockStyle, color: '#ffb84d'}}>
                        |S| ≤ 2
                    </div>

                    <h4 style={{ marginTop: '1.5rem', color: 'var(--quantum-pink)' }}>The Quantum Violation (Tsirelson's Bound)</h4>
                    <p style={{ marginTop: '1rem' }}>
                        When executing the optimal quantum strategy, Alice and Bob share the maximally entangled Bell state:
                    </p>
                    <div style={mathBlockStyle}>
                        |Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
                    </div>
                    <p style={{ marginTop: '1rem' }}>
                        They measure spin observables represented by Pauli operators. The expectation value for their joint measurement relies on the relative half-angle θ between their physical measurement bases: <strong>⟨Φ⁺| A ⊗ B |Φ⁺⟩ = cos(2θ)</strong>.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        By selecting the physical angles discussed previously (yielding a 22.5° difference for three pairs, and a 67.5° difference for the fourth), we observe the following correlations:
                    </p>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '2rem', fontFamily: 'monospace' }}>
                        <li>a · b = cos(45°) = 1/√2</li>
                        <li>a · b′ = -cos(135°) = 1/√2</li>
                        <li>a′ · b = cos(45°) = 1/√2</li>
                        <li>a′ · b′ = cos(45°) = 1/√2</li>
                    </ul>
                    <p style={{ marginTop: '1rem' }}>
                        Plugging these values back into the CHSH equation:
                    </p>
                    <div style={{...mathBlockStyle, color: 'var(--quantum-pink)'}}>
                        S = 1/√2 - (-1/√2) + 1/√2 + 1/√2 = 4/√2 = 2√2 ≈ 2.828
                    </div>

                    <h3 style={{ color: 'var(--accent-teal)', marginTop: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Conclusion</h3>
                    <p style={{ marginTop: '1rem' }}>
                        The measured quantum correlation, 2.828, strictly exceeds the absolute classical limit of 2.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        The particles coordinate their answers in a way that is algebraically impossible for any pre-written, independent instruction set. This mathematical violation forces us to abandon at least one pillar of classical physics. To accept the 2√2 outcome, one must surrender:
                    </p>
                    <ol style={{ marginTop: '0.5rem', paddingLeft: '2.5rem' }}>
                        <li><strong>Realism:</strong> Acknowledge that particles do not possess definite states prior to measurement (the Copenhagen interpretation).</li>
                        <li><strong>Locality:</strong> Acknowledge that an action in one location instantly dictates the state of a distant particle, defying the speed of light (Bohmian mechanics).</li>
                    </ol>
                    <p style={{ marginTop: '1.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        The CHSH game proves that a comfortable, local, clockwork universe is mathematically incompatible with observed reality.
                    </p>
                </div>
            </div>
        </section>
    );
};
