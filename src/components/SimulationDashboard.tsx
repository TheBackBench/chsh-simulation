import React, { useState, useEffect, useRef } from 'react';
import { ClassicalStrategy, QuantumStrategy, RoundResult, playSingleRound } from '../engine/Simulation';
import './SimulationDashboard.css';

interface Props {
    mode: 'classical' | 'quantum';
    nGames: number;
    evaluationOrder: 'alice' | 'bob' | 'random';
    classicalStrategy: ClassicalStrategy;
    quantumStrategy: QuantumStrategy;
    onClose: () => void;
}

type PlayState = 'playing' | 'paused' | 'finished';
type RoundStage = 
    | 'ready' 
    | 'sending' 
    | 'q-measure-1-pending' 
    | 'q-measure-1-result' 
    | 'q-measure-2-pending' 
    | 'q-measure-2-result' 
    | 'returning' 
    | 'result';

const estimateExpectedRate = (
    mode: 'classical' | 'quantum',
    evaluationOrder: 'alice' | 'bob' | 'random',
    classicalStrategy: ClassicalStrategy,
    quantumStrategy: QuantumStrategy
): number => {
    let wins = 0;
    const runs = 20000;
    for (let i = 0; i < runs; i++) {
        const result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
        if (result.win) wins++;
    }
    return (wins / runs) * 100;
};

export const SimulationDashboard: React.FC<Props> = ({
    mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy, onClose
}) => {
    const [round, setRound] = useState(0);
    const [playState, setPlayState] = useState<PlayState>('playing');
    const [speed, setSpeed] = useState<1 | 3 | 10 | 20 | 50 | 100>(1);

    // Stats
    const [wins, setWins] = useState(0);
    const [historyRates, setHistoryRates] = useState<number[]>([]);

    // Animation state
    const [currentStage, setCurrentStage] = useState<RoundStage>('ready');
    const [roundData, setRoundData] = useState<RoundResult | null>(null);

    const playStateRef = useRef(playState);
    playStateRef.current = playState;

    const baseDelay = 1600 / speed;

    const expectedRate = React.useMemo(() => {
        return estimateExpectedRate(mode, evaluationOrder, classicalStrategy, quantumStrategy);
    }, [mode, evaluationOrder, classicalStrategy, quantumStrategy]);

    const skipToEnd = () => {
        setPlayState('finished');
        let currentWins = wins;
        const newRates = [...historyRates];

        let startFrom = round;
        if (roundData) {
            if (roundData.win) currentWins++;
            newRates.push((currentWins / (round + 1)) * 100);
            startFrom = round + 1;
        }

        for (let i = startFrom + 1; i <= nGames; i++) {
            const result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
            if (result.win) currentWins++;
            newRates.push((currentWins / i) * 100);
        }

        setWins(currentWins);
        setHistoryRates(newRates);
        setRound(nGames);
        setRoundData(null);
        setCurrentStage('result');
    };

    useEffect(() => {
        if (playState !== 'playing' || round >= nGames) {
            if (round >= nGames && playState !== 'finished') {
                setPlayState('finished');
            }
            return;
        }

        let isCancelled = false;

        const runLoop = async () => {
            // Retrieve or generate data for this round
            let data = roundData;
            if (!data) {
                data = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
                setRoundData(data);
            }

            const details = data.quantumDetails;
            const startStage = currentStage === 'ready' ? 'sending' : currentStage;

            // Sending Stage
            if (startStage === 'sending') {
                setCurrentStage('sending');
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;
            }

            // Quantum Measurement Stages
            if (mode === 'quantum' && data.quantumMeasured && details) {
                if (details.firstMeasured) {
                    if (['sending', 'q-measure-1-pending'].includes(startStage)) {
                        setCurrentStage('q-measure-1-pending');
                        await new Promise(r => setTimeout(r, baseDelay));
                        if (isCancelled || playStateRef.current !== 'playing') return;
                    }

                    if (['sending', 'q-measure-1-pending', 'q-measure-1-result'].includes(startStage)) {
                        setCurrentStage('q-measure-1-result');
                        await new Promise(r => setTimeout(r, baseDelay));
                        if (isCancelled || playStateRef.current !== 'playing') return;
                    }
                }

                if (details.secondMeasured) {
                    if (['sending', 'q-measure-1-pending', 'q-measure-1-result', 'q-measure-2-pending'].includes(startStage)) {
                        setCurrentStage('q-measure-2-pending');
                        await new Promise(r => setTimeout(r, baseDelay));
                        if (isCancelled || playStateRef.current !== 'playing') return;
                    }

                    if (['sending', 'q-measure-1-pending', 'q-measure-1-result', 'q-measure-2-pending', 'q-measure-2-result'].includes(startStage)) {
                        setCurrentStage('q-measure-2-result');
                        await new Promise(r => setTimeout(r, baseDelay));
                        if (isCancelled || playStateRef.current !== 'playing') return;
                    }
                }
            }

            // Returning Stage
            if (['sending', 'q-measure-1-pending', 'q-measure-1-result', 'q-measure-2-pending', 'q-measure-2-result', 'returning'].includes(startStage)) {
                setCurrentStage('returning');
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;
            }

            // Result Stage
            if (['sending', 'q-measure-1-pending', 'q-measure-1-result', 'q-measure-2-pending', 'q-measure-2-result', 'returning', 'result'].includes(startStage)) {
                setCurrentStage('result');
                const newWins = wins + (data.win ? 1 : 0);

                // Wait for user to see the result
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;

                setWins(newWins);
                setHistoryRates(prev => [...prev, (newWins / (round + 1)) * 100]);
                setRoundData(null);
                setCurrentStage('ready');
                setRound(r => r + 1);
            }
        };

        runLoop();

        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round, playState, speed, wins, mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy]);

    const successRate = round > 0 ? (wins / round * 100).toFixed(2) : '0.00';

    // SVG Graph rendering
    const renderGraph = (isFinished: boolean = false) => {
        const width = isFinished ? 500 : 300;
        const height = isFinished ? 200 : 150;
        const leftMargin = isFinished ? 35 : 30;
        const rightMargin = 20;
        const topMargin = 15;
        const bottomMargin = isFinished ? 25 : 20;
        const fontSize = isFinished ? 9 : 7.5;

        const graphW = width - leftMargin - rightMargin;
        const graphH = height - topMargin - bottomMargin;

        const currentTotal = historyRates.length;

        // Y coordinate mapping
        const yCoord = (rate: number) => topMargin + graphH - (rate / 100) * graphH;

        // X coordinate mapping (for round 1-based index starting at 1, mapped from index 0)
        const xCoord = (idx: number) => {
            if (currentTotal <= 1) return leftMargin;
            return leftMargin + (idx / (currentTotal - 1)) * graphW;
        };

        const getTickX = (val: number) => {
            const denom = currentTotal > 0 ? (currentTotal - 1) : (nGames - 1);
            if (denom <= 0) return leftMargin;
            return leftMargin + ((val - 1) / denom) * graphW;
        };

        let path = '';
        if (currentTotal > 0) {
            const points = historyRates.map((rate, idx) => {
                return `${xCoord(idx)},${yCoord(rate)}`;
            });
            path = `M ${points.join(' L ')}`;
        }

        const limitY = yCoord(expectedRate);

        // Generate Y-axis grid lines and labels
        const yTicks = [0, 25, 50, 75, 100];

        // Generate X-axis grid lines and labels
        const xTicks: number[] = [];
        if (currentTotal > 0) {
            if (isFinished) {
                xTicks.push(1);
                xTicks.push(Math.round(currentTotal * 0.25) || 1);
                xTicks.push(Math.round(currentTotal * 0.5));
                xTicks.push(Math.round(currentTotal * 0.75));
                xTicks.push(currentTotal);
            } else {
                xTicks.push(1);
                xTicks.push(Math.round(currentTotal * 0.5));
                xTicks.push(currentTotal);
            }
        } else {
            xTicks.push(1);
            xTicks.push(nGames);
        }

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="live-graph">
                {/* Grid Lines & Labels for Y-axis */}
                {yTicks.map(val => {
                    const y = yCoord(val);
                    return (
                        <g key={`y-${val}`}>
                            <line
                                x1={leftMargin}
                                y1={y}
                                x2={width - rightMargin}
                                y2={y}
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeDasharray="2, 2"
                            />
                            <text
                                x={leftMargin - 6}
                                y={y + 3}
                                fill="rgba(255, 255, 255, 0.5)"
                                fontSize={fontSize}
                                textAnchor="end"
                            >
                                {val}%
                            </text>
                        </g>
                    );
                })}

                {/* Grid Lines & Labels for X-axis */}
                {xTicks.map((val, idx) => {
                    // Prevent duplicate tick labels if rounds count is very small
                    if (idx > 0 && val === xTicks[idx - 1]) return null;
                    const x = getTickX(val);
                    return (
                        <g key={`x-${val}-${idx}`}>
                            <line
                                x1={x}
                                y1={topMargin}
                                x2={x}
                                y2={height - bottomMargin}
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeDasharray="2, 2"
                            />
                            <text
                                x={x}
                                y={height - bottomMargin + 14}
                                fill="rgba(255, 255, 255, 0.5)"
                                fontSize={fontSize}
                                textAnchor="middle"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* Axes */}
                <line x1={leftMargin} y1={topMargin} x2={leftMargin} y2={height - bottomMargin} stroke="#666" />
                <line x1={leftMargin} y1={height - bottomMargin} x2={width - rightMargin} y2={height - bottomMargin} stroke="#666" />

                {/* Expected Limit Line */}
                <line x1={leftMargin} y1={limitY} x2={width - rightMargin} y2={limitY} stroke="#ff4444" strokeDasharray="4" />
                <text x={width - rightMargin - 75} y={limitY - 5} fill="#ff4444" fontSize={fontSize - 0.5} fontWeight="bold">
                    Expected: {expectedRate.toFixed(1)}%
                </text>

                {/* Success Rate Path */}
                {path && <path d={path} fill="none" stroke="var(--accent-teal)" strokeWidth="2" />}

                {/* End Point Marker */}
                {historyRates.length > 0 && (
                    <circle
                        cx={xCoord(historyRates.length - 1)}
                        cy={yCoord(historyRates[historyRates.length - 1])}
                        r="3"
                        fill="var(--accent-teal)"
                    />
                )}
            </svg>
        );
    };

    const getRowClass = (rowX: number, rowY: number) => {
        if (!roundData || roundData.x !== rowX || roundData.y !== rowY) return '';
        if (currentStage === 'result') {
            return roundData.win ? 'active-row win' : 'active-row loss';
        }
        return 'active-row';
    };

    const getSecondMeasurementProbs = (details: NonNullable<RoundResult['quantumDetails']>) => {
        if (!details.firstMeasured || !details.secondMeasured) return { pctUp: 50, pctDown: 50 };
        const diffRad = (details.firstAngle - details.secondAngle) * (Math.PI / 180);
        const pSame = Math.pow(Math.cos(diffRad), 2);
        const pUp = details.firstResult ? pSame : (1 - pSame);
        const pctUp = Math.round(pUp * 100);
        const pctDown = 100 - pctUp;
        return { pctUp, pctDown };
    };

    const renderUnitCircle = (
        angle: number,
        isPending: boolean,
        showResult: boolean,
        resultUp: boolean,
        collapsedState?: { angle: number; resultUp: boolean }
    ) => {
        const rad = (angle * Math.PI) / 180;
        const labelX = 33 * Math.cos(rad);
        const labelY = -33 * Math.sin(rad);

        return (
            <svg width="90" height="90" viewBox="-38 -38 76 76" className="unit-circle-svg">
                <circle cx="0" cy="0" r="24" className="circle-outline" />
                <line x1="-28" y1="0" x2="28" y2="0" className="axis-faint" />
                <line x1="0" y1="-28" x2="0" y2="28" className="axis-faint" />
                <text x={labelX} y={labelY} className="compass-label" textAnchor="middle" dominantBaseline="middle">Up</text>
                
                {collapsedState && (
                    <g transform={`rotate(${-collapsedState.angle})`}>
                        <line x1="-24" y1="0" x2="24" y2="0" className="first-axis-faint" />
                        <path
                            d={collapsedState.resultUp ? "M 0,0 L 20,0 M 15,-3 L 20,0 L 15,3" : "M 0,0 L -20,0 M -15,-3 L -20,0 L -15,3"}
                            className="first-arrow-faint"
                        />
                    </g>
                )}

                <g transform={`rotate(${-angle})`}>
                    <line x1="-24" y1="0" x2="24" y2="0" className="measuring-axis" />
                    {isPending && (
                        <line x1="28" y1="0" x2="-28" y2="0" className="laser-beam" />
                    )}
                    {showResult && (
                        <path
                            d={resultUp ? "M 0,0 L 22,0 M 16,-4 L 22,0 L 16,4" : "M 0,0 L -22,0 M -16,-4 L -22,0 L -16,4"}
                            className="arrow-reveal"
                        />
                    )}
                </g>
            </svg>
        );
    };

    const renderQuantumOverlay = (player: 'alice' | 'bob') => {
        if (mode !== 'quantum' || !roundData || !roundData.quantumDetails) return null;
        const details = roundData.quantumDetails;
        
        // Check if this player measures first
        if (details.firstMeasured === player) {
            if (currentStage === 'q-measure-1-pending') {
                return (
                    <div className="quantum-overlay pending">
                        {renderUnitCircle(details.firstAngle, true, false, false)}
                        <div className="quantum-prob">50% ↑ / 50% ↓</div>
                        <div className="quantum-status-text">Measuring spin ({details.firstAngle.toFixed(0)}°)...</div>
                    </div>
                );
            }
            const showResult = [
                'q-measure-1-result',
                'q-measure-2-pending',
                'q-measure-2-result',
                'returning',
                'result'
            ].includes(currentStage);
            if (showResult) {
                return (
                    <div className="quantum-overlay measured">
                        {renderUnitCircle(details.firstAngle, false, true, details.firstResult)}
                        <div className="quantum-spin-result">{details.firstResult ? '↑ (Up)' : '↓ (Down)'}</div>
                        <div className="quantum-status-text">Spin measured at {details.firstAngle.toFixed(0)}°</div>
                    </div>
                );
            }
        }

        // Check if this player measures second
        if (details.secondMeasured === player) {
            const firstResultMeasured = ['q-measure-2-pending', 'q-measure-2-result', 'returning', 'result'].includes(currentStage);
            const collapsedState = firstResultMeasured ? { angle: details.firstAngle, resultUp: details.firstResult } : undefined;

            if (currentStage === 'q-measure-2-pending') {
                const { pctUp, pctDown } = getSecondMeasurementProbs(details);
                return (
                    <div className="quantum-overlay pending">
                        {renderUnitCircle(details.secondAngle, true, false, false, collapsedState)}
                        <div className="quantum-prob">{pctUp}% ↑ / {pctDown}% ↓</div>
                        <div className="quantum-status-text">Measuring spin ({details.secondAngle.toFixed(0)}°)...</div>
                    </div>
                );
            }
            const showResult = [
                'q-measure-2-result',
                'returning',
                'result'
            ].includes(currentStage);
            if (showResult) {
                return (
                    <div className="quantum-overlay measured">
                        {renderUnitCircle(details.secondAngle, false, true, details.secondResult, collapsedState)}
                        <div className="quantum-spin-result">{details.secondResult ? '↑ (Up)' : '↓ (Down)'}</div>
                        <div className="quantum-status-text">Spin measured at {details.secondAngle.toFixed(0)}°</div>
                    </div>
                );
            }
        }

        return null;
    };

    return (
        <div className={`simulation-dashboard ${playState === 'paused' ? 'paused' : ''}`} style={{ '--animation-duration': `${baseDelay}ms` } as React.CSSProperties}>
            <div className="dashboard-header">
                <h2>{playState === 'finished' ? 'Simulation Results' : 'Simulation in Progress'}</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {playState === 'finished' ? (
                <div className="dashboard-content finished-layout">
                    <div className="pane glass-panel stats-pane finished-stats">
                        <div className="finished-stat-grid">
                            <div className="stat-box">
                                <span className="stat-label">Success Rate</span>
                                <span className="stat-value highlight-success-rate">{successRate}%</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Total Rounds</span>
                                <span className="stat-value">{round} / {nGames}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Wins</span>
                                <span className="stat-value">{wins}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Expected Rate</span>
                                <span className="stat-value">{expectedRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="pane glass-panel graph-pane finished-graph">
                        <h3>Average Success Rate</h3>
                        {renderGraph(true)}
                    </div>

                    <div className="finished-controls">
                        <button className="finish-btn" onClick={onClose}>Finish & Return</button>
                    </div>
                </div>
            ) : (
                <div className="dashboard-content">
                    <div className="pane left-pane glass-panel">
                        <div className="turn-counter">Turn {round} / {nGames}</div>

                        <div className="animation-area">
                            <div className={`computer-node ${currentStage !== 'ready' ? 'active' : ''}`}>
                                💻 Computer
                                {roundData && currentStage === 'result' && (
                                    <>
                                        <div className="bit static-on-computer-top">{roundData.outA ? 1 : 0}</div>
                                        <div className="bit static-on-computer-bottom">{roundData.outB ? 1 : 0}</div>
                                    </>
                                )}
                            </div>

                            <div className="players">
                                <div className="player-node alice">
                                    👩 Alice
                                    {roundData && currentStage === 'sending' && (
                                        <div className="bit flying-to-alice">{roundData.x}</div>
                                    )}
                                    {roundData && currentStage !== 'sending' && currentStage !== 'ready' && (
                                        <div className="bit static-on-alice">{roundData.x}</div>
                                    )}
                                    {roundData && currentStage === 'returning' && (
                                        <div className="bit returning-from-alice">{roundData.outA ? 1 : 0}</div>
                                    )}
                                    {renderQuantumOverlay('alice')}
                                </div>

                                {mode === 'quantum' && (
                                    <div className={`quantum-link ${roundData?.quantumMeasured && currentStage !== 'ready' && currentStage !== 'result' ? 'measured' : ''}`}>
                                        〰〰 Entanglement 〰〰
                                    </div>
                                )}

                                <div className="player-node bob">
                                    👨 Bob
                                    {roundData && currentStage === 'sending' && (
                                        <div className="bit flying-to-bob">{roundData.y}</div>
                                    )}
                                    {roundData && currentStage !== 'sending' && currentStage !== 'ready' && (
                                        <div className="bit static-on-bob">{roundData.y}</div>
                                    )}
                                    {roundData && currentStage === 'returning' && (
                                        <div className="bit returning-from-bob">{roundData.outB ? 1 : 0}</div>
                                    )}
                                    {renderQuantumOverlay('bob')}
                                </div>
                            </div>

                            {currentStage === 'result' && roundData && (
                                <div className={`round-result-label ${roundData.win ? 'win' : 'loss'}`}>
                                    {roundData.win ? 'SUCCESS!' : 'FAILURE'}
                                </div>
                            )}
                        </div>

                        <div className="controls">
                            <button onClick={() => setPlayState(p => p === 'playing' ? 'paused' : 'playing')}>
                                {playState === 'playing' ? '⏸ Pause' : '▶ Play'}
                            </button>
                            <button onClick={() => setSpeed(s => s === 1 ? 3 : s === 3 ? 10 : s === 10 ? 20 : s === 20 ? 50 : s === 50 ? 100 : 1)}>
                                Speed: {speed}x
                            </button>
                            <button onClick={skipToEnd}>⏭ Skip to End</button>
                        </div>
                    </div>

                    <div className="right-panes">
                        <div className="pane glass-panel rules-pane">
                            <h3>Score Rules</h3>
                            <table className="rules-table">
                                <thead>
                                    <tr>
                                        <th>Alice's Input</th>
                                        <th>Bob's Input</th>
                                        <th>Winning Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className={getRowClass(0, 0)}>
                                        <td>0</td>
                                        <td>0</td>
                                        <td>Alice == Bob</td>
                                    </tr>
                                    <tr className={getRowClass(0, 1)}>
                                        <td>0</td>
                                        <td>1</td>
                                        <td>Alice == Bob</td>
                                    </tr>
                                    <tr className={getRowClass(1, 0)}>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>Alice == Bob</td>
                                    </tr>
                                    <tr className={getRowClass(1, 1)}>
                                        <td>1</td>
                                        <td>1</td>
                                        <td>Alice != Bob</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="pane glass-panel stats-pane">
                            <div className="stat-box">
                                <span className="stat-label">Success Rate</span>
                                <span className="stat-value">{successRate}%</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Wins</span>
                                <span className="stat-value">{wins}</span>
                            </div>
                        </div>

                        <div className="pane glass-panel graph-pane">
                            <h3>Average Success Rate</h3>
                            {renderGraph(false)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
