import React, { useState, useEffect, useRef } from 'react';
import { ClassicalStrategy, QuantumStrategy, RoundResult, playSingleRound } from '../engine/Simulation';
import './SimulationDashboard.css';

interface Props {
    mode: 'classical' | 'quantum';
    nGames: number;
    evaluationOrder: 'alice' | 'bob' | 'random';
    classicalStrategy: ClassicalStrategy;
    quantumStrategy: QuantumStrategy;
    compareClassical: boolean;
    onClose: () => void;
}

type PlayState = 'playing' | 'paused' | 'finished' | 'pause-requested';
type RoundStage =
    | 'ready'
    | 'sending'
    | 'q-measure-1-pending'
    | 'q-measure-1-result'
    | 'q-measure-2-pending'
    | 'q-measure-2-result'
    | 'returning'
    | 'result';



export const SimulationDashboard: React.FC<Props> = ({
    mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy, compareClassical, onClose
}) => {
    const [round, setRound] = useState(0);
    const [playState, setPlayState] = useState<PlayState>('playing');
    const [speed, setSpeed] = useState<1 | 2 | 5 | 10 | 50 | 100>(1);

    // Stats
    const [wins, setWins] = useState(0);
    const [historyRates, setHistoryRates] = useState<number[]>([]);

    // Animation state
    const [currentStage, setCurrentStage] = useState<RoundStage>('ready');
    const [roundData, setRoundData] = useState<RoundResult | null>(null);

    // New State for No Entanglement parallel run
    const [noEntWins, setNoEntWins] = useState(0);
    const [noEntHistoryRates, setNoEntHistoryRates] = useState<number[]>([]);
    const [noEntRoundData, setNoEntRoundData] = useState<RoundResult | null>(null);

    const playStateRef = useRef(playState);
    playStateRef.current = playState;

    const baseDelay = 1600 / speed;

    const [showTheoreticalOptimum, setShowTheoreticalOptimum] = useState(false);
    const [showNoEntTheoreticalOptimum, setShowNoEntTheoreticalOptimum] = useState(false);
    const theoreticalOptimum = mode === 'classical' ? 75 : 85.355;
    const noEntTheoreticalOptimum = 75;

    const skipToEnd = () => {
        setPlayState('finished');
        let currentWins = wins;
        const newRates = [...historyRates];
        let currentNoEntWins = noEntWins;
        const newNoEntRates = [...noEntHistoryRates];

        let startFrom = round;
        if (roundData && currentStage !== 'result') {
            if (roundData.win) currentWins++;
            newRates.push((currentWins / (round + 1)) * 100);
            if (mode === 'quantum' && compareClassical && noEntRoundData) {
                if (noEntRoundData.win) currentNoEntWins++;
                newNoEntRates.push((currentNoEntWins / (round + 1)) * 100);
            }
            startFrom = round + 1;
        } else if (currentStage === 'result') {
            startFrom = round + 1;
        }

        for (let i = startFrom + 1; i <= nGames; i++) {
            const result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
            if (result.win) currentWins++;
            newRates.push((currentWins / i) * 100);
            if (mode === 'quantum' && compareClassical) {
                const noEntResult = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy, true, result.x, result.y);
                if (noEntResult.win) currentNoEntWins++;
                newNoEntRates.push((currentNoEntWins / i) * 100);
            }
        }

        setWins(currentWins);
        setHistoryRates(newRates);
        if (mode === 'quantum' && compareClassical) {
            setNoEntWins(currentNoEntWins);
            setNoEntHistoryRates(newNoEntRates);
        }
        setRound(nGames);
        setRoundData(null);
        setNoEntRoundData(null);
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
            if (currentStage === 'result') {
                setRoundData(null);
                if (mode === 'quantum' && compareClassical) {
                    setNoEntRoundData(null);
                }
                setCurrentStage('ready');
                setRound(r => r + 1);
                return;
            }

            // Retrieve or generate data for this round
            let data = roundData;
            let noEntData = noEntRoundData;
            if (!data) {
                const effectiveOrder = evaluationOrder === 'random' ? (Math.random() < 0.5 ? 'alice' : 'bob') : evaluationOrder;
                data = playSingleRound(mode, effectiveOrder, classicalStrategy, quantumStrategy);
                setRoundData(data);
                if (mode === 'quantum' && compareClassical) {
                    noEntData = playSingleRound(mode, effectiveOrder, classicalStrategy, quantumStrategy, true, data.x, data.y);
                    setNoEntRoundData(noEntData);
                }
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
            if (['sending', 'q-measure-1-pending', 'q-measure-1-result', 'q-measure-2-pending', 'q-measure-2-result', 'returning'].includes(startStage)) {
                setCurrentStage('result');
                const newWins = wins + (data.win ? 1 : 0);

                setWins(newWins);
                setHistoryRates(prev => [...prev, (newWins / (round + 1)) * 100]);

                if (mode === 'quantum' && compareClassical && noEntData) {
                    const newNoEntWins = noEntWins + (noEntData.win ? 1 : 0);
                    setNoEntWins(newNoEntWins);
                    setNoEntHistoryRates(prev => [...prev, (newNoEntWins / (round + 1)) * 100]);
                }

                // Wait for user to see the result
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || !['playing', 'pause-requested'].includes(playStateRef.current)) return;

                if (playStateRef.current === 'pause-requested') {
                    setPlayState('paused');
                    return;
                }

                setRoundData(null);
                if (mode === 'quantum' && compareClassical) {
                    setNoEntRoundData(null);
                }
                setCurrentStage('ready');
                setRound(r => r + 1);
            }
        };

        runLoop();

        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round, playState, speed, mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy]);

    const successRate = round > 0 ? (wins / round * 100).toFixed(2) : '0.00';

    const renderGraph = (isFinished: boolean = false, rates: number[] = historyRates, maxVal: number = theoreticalOptimum, showMax: boolean = showTheoreticalOptimum, isEntangled: boolean = true) => {
        const width = isFinished ? 500 : 300;
        const height = isFinished ? 200 : 150;
        const leftMargin = isFinished ? 35 : 30;
        const rightMargin = isFinished ? 35 : 10;
        const bottomMargin = isFinished ? 25 : 20;
        const topMargin = 20;
        const graphColor = isEntangled ? '#d400ff' : '#aaaaaa';
        const fontSize = isFinished ? 9 : 7.5;

        const graphW = width - leftMargin - rightMargin;
        const graphH = height - topMargin - bottomMargin;

        const currentTotal = rates.length;

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
            const points = rates.map((rate, idx) => {
                return `${xCoord(idx)},${yCoord(rate)}`;
            });
            path = `M ${points.join(' L ')}`;
        }

        const limitY = yCoord(maxVal);

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

                {/* Theoretical Limit Line */}
                {showMax && (
                    <>
                        <line x1={leftMargin} y1={limitY} x2={width - rightMargin} y2={limitY} stroke="#ff4444" strokeDasharray="4" />
                        <text x={width - rightMargin - 100} y={limitY - 5} fill="#ff4444" fontSize={fontSize - 0.5} fontWeight="bold">
                            Theoretical Max: {maxVal.toFixed(1)}%
                        </text>
                    </>
                )}

                {/* Success Rate Path */}
                {path && <path d={path} fill="none" stroke={graphColor} strokeWidth="2" />}

                {/* End Point Marker */}
                {rates.length > 0 && (
                    <circle
                        cx={xCoord(rates.length - 1)}
                        cy={yCoord(rates[rates.length - 1])}
                        r="3"
                        fill={graphColor}
                    />
                )}
            </svg>
        );
    };

    const getRowClass = (rowX: number, rowY: number) => {
        if (!roundData || roundData.x !== rowX || roundData.y !== rowY) return '';
        if (currentStage === 'result') {
            if (mode === 'quantum') return 'active-row';
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
        const labelX = 36 * Math.cos(rad);
        const labelY = -36 * Math.sin(rad);

        return (
            <svg width="100" height="100" viewBox="-50 -50 100 100" className="unit-circle-svg">
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

    const renderQuantumOverlay = (player: 'alice' | 'bob', data: RoundResult | null, isEntangled: boolean = true) => {
        if (mode !== 'quantum' || !data || !data.quantumDetails) return null;
        const details = data.quantumDetails;

        // Check if this player measures first
        if (details.firstMeasured === player) {
            if (currentStage === 'q-measure-1-pending') {
                return (
                    <div className={`quantum-overlay pending ${!isEntangled ? 'no-ent-overlay' : ''}`}>
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
                    <div className={`quantum-overlay measured ${!isEntangled ? 'no-ent-overlay' : ''}`}>
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
            const collapsedState = (isEntangled && firstResultMeasured) ? { angle: details.firstAngle, resultUp: details.firstResult } : undefined;

            if (currentStage === 'q-measure-2-pending') {
                const { pctUp, pctDown } = isEntangled ? getSecondMeasurementProbs(details) : { pctUp: 50, pctDown: 50 };
                return (
                    <div className={`quantum-overlay pending ${!isEntangled ? 'no-ent-overlay' : ''}`}>
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
                    <div className={`quantum-overlay measured ${!isEntangled ? 'no-ent-overlay' : ''}`}>
                        {renderUnitCircle(details.secondAngle, false, true, details.secondResult, collapsedState)}
                        <div className="quantum-spin-result">{details.secondResult ? '↑ (Up)' : '↓ (Down)'}</div>
                        <div className="quantum-status-text">Spin measured at {details.secondAngle.toFixed(0)}°</div>
                    </div>
                );
            }
        }

        return null;
    };

    const renderAnimationArea = (data: RoundResult | null, isEntangled: boolean) => (
        <div className="animation-area">
            <div className={`computer-node ${currentStage !== 'ready' ? 'active' : ''}`}>
                💻 Computer
                {data && currentStage === 'result' && (
                    <>
                        <div className="bit static-on-computer-top">{data.outA ? 1 : 0}</div>
                        <div className="bit static-on-computer-bottom">{data.outB ? 1 : 0}</div>
                    </>
                )}
            </div>

            <div className="players">
                <div className="player-node alice">
                    👩 Alice
                    {data && currentStage === 'sending' && (
                        <div className="bit flying-to-alice">{data.x}</div>
                    )}
                    {data && currentStage !== 'sending' && currentStage !== 'ready' && (
                        <div className="bit static-on-alice">{data.x}</div>
                    )}
                    {data && currentStage === 'returning' && (
                        <div className="bit returning-from-alice">{data.outA ? 1 : 0}</div>
                    )}
                    {renderQuantumOverlay('alice', data, isEntangled)}
                </div>

                {mode === 'quantum' && (
                    <div className={`quantum-link ${!isEntangled ? 'no-ent' : ''} ${data?.quantumMeasured && currentStage !== 'ready' && currentStage !== 'result' ? 'measured' : ''}`}>
                        {isEntangled ? '〰〰 Entanglement 〰〰' : '〰〰 No Entanglement 〰〰'}
                    </div>
                )}

                <div className="player-node bob">
                    👨 Bob
                    {data && currentStage === 'sending' && (
                        <div className="bit flying-to-bob">{data.y}</div>
                    )}
                    {data && currentStage !== 'sending' && currentStage !== 'ready' && (
                        <div className="bit static-on-bob">{data.y}</div>
                    )}
                    {data && currentStage === 'returning' && (
                        <div className="bit returning-from-bob">{data.outB ? 1 : 0}</div>
                    )}
                    {renderQuantumOverlay('bob', data, isEntangled)}
                </div>
            </div>

            {currentStage === 'result' && data && (
                <div className={`round-result-label ${data.win ? 'win' : 'loss'}`}>
                    {data.win ? 'SUCCESS!' : 'FAILURE'}
                </div>
            )}
        </div>
    );

    const renderColResult = (rowX: number, rowY: number, data: RoundResult | null, isClassical: boolean = false) => {
        if (!data || data.x !== rowX || data.y !== rowY) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
        if (currentStage === 'result') {
            return data.win
                ? <span style={{ color: '#00f59f', fontWeight: 'bold' }}>WIN</span>
                : <span style={{ color: '#ff4444', fontWeight: 'bold' }}>LOSS</span>;
        }
        return <span style={{ color: isClassical ? 'var(--text-muted)' : 'var(--accent-teal)' }}>...</span>;
    };

    return (
        <div className={`simulation-dashboard ${playState === 'paused' ? 'paused' : ''}`} style={{ '--animation-duration': `${baseDelay}ms` } as React.CSSProperties}>
            <div className="dashboard-header">
                <h2>{playState === 'finished' ? 'Simulation Results' : 'Simulation in Progress'}</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {playState === 'finished' ? (
                <div className="dashboard-content finished-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', width: '100%' }}>
                        <div className="pane glass-panel stats-pane finished-stats" style={{ flex: 1 }}>
                            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--accent-teal)' }}>{mode === 'quantum' ? 'True Quantum (Entangled)' : 'Simulation Stats'}</h3>
                            <div className="finished-stat-grid">
                                <div className="stat-box">
                                    <span className="stat-label">Success Rate</span>
                                    <span className="stat-value highlight-success-rate">{successRate}%</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Total Rounds</span>
                                    <span className="stat-value">{nGames}</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-label">Wins</span>
                                    <span className="stat-value">{wins}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pane glass-panel graph-pane finished-graph" style={{ flex: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Average Success Rate</h3>
                                <button
                                    className="secondary-btn"
                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                    onClick={() => setShowTheoreticalOptimum(prev => !prev)}
                                >
                                    {showTheoreticalOptimum ? 'Hide Theoretical Max' : 'Show Theoretical Max'}
                                </button>
                            </div>
                            {renderGraph(true, historyRates, theoreticalOptimum, showTheoreticalOptimum, true)}
                        </div>
                    </div>

                    {mode === 'quantum' && compareClassical && (
                        <div style={{ display: 'flex', gap: '2rem', width: '100%' }}>
                            <div className="pane glass-panel stats-pane finished-stats" style={{ flex: 1 }}>
                                <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>No Entanglement</h3>
                                <div className="finished-stat-grid">
                                    <div className="stat-box">
                                        <span className="stat-label">Success Rate</span>
                                        <span className="stat-value" style={{ color: 'var(--text-muted)' }}>{round > 0 ? (noEntWins / round * 100).toFixed(2) : '0.00'}%</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Total Rounds</span>
                                        <span className="stat-value" style={{ color: 'var(--text-muted)' }}>{nGames}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Wins</span>
                                        <span className="stat-value" style={{ color: 'var(--text-muted)' }}>{noEntWins}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pane glass-panel graph-pane finished-graph" style={{ flex: 2 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0 }}>Average Success Rate</h3>
                                    <button
                                        className="secondary-btn no-ent-btn"
                                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                        onClick={() => setShowNoEntTheoreticalOptimum(prev => !prev)}
                                    >
                                        {showNoEntTheoreticalOptimum ? 'Hide Theoretical Max' : 'Show Theoretical Max'}
                                    </button>
                                </div>
                                {renderGraph(true, noEntHistoryRates, noEntTheoreticalOptimum, showNoEntTheoreticalOptimum, false)}
                            </div>
                        </div>
                    )}

                    <div className="finished-controls" style={{ marginTop: '1rem' }}>
                        <button className="finish-btn" onClick={onClose}>Finish & Return</button>
                    </div>
                </div>
            ) : (
                <div className="dashboard-content">
                    <div className="left-column" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div className="pane glass-panel controls-window" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="turn-counter" style={{ position: 'static' }}>Turn {round} / {nGames}</div>
                            <div className="controls" style={{ margin: 0 }}>
                                <button onClick={() => setPlayState(p => p === 'playing' ? 'paused' : 'playing')}>
                                    {playState === 'playing' ? '⏸ Pause' : '▶ Play'}
                                </button>
                                <button onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 5 : s === 5 ? 10 : s === 10 ? 50 : s === 50 ? 100 : 1)}>
                                    Speed: {speed}x
                                </button>
                                <button onClick={skipToEnd}>⏭ Skip to End</button>
                            </div>
                        </div>

                        <div className="pane glass-panel" style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1 }}>
                            {mode === 'quantum' && <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--quantum-pink)' }}>True Quantum (Entangled)</h3>}

                            {renderAnimationArea(roundData, true)}
                        </div>

                        {mode === 'quantum' && compareClassical && (
                            <div className="pane glass-panel no-ent-live-window" style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--text-muted)' }}>No Entanglement</h4>

                                </div>
                                {renderAnimationArea(noEntRoundData, false)}
                            </div>
                        )}
                    </div>

                    <div className="right-panes">
                        <div className="pane glass-panel rules-pane">
                            <h3>Score Rules</h3>
                            <table className="rules-table">
                                <thead>
                                    <tr>
                                        <th title="Alice's Input">A</th>
                                        <th title="Bob's Input">B</th>
                                        <th>Target</th>
                                        {mode === 'quantum' && compareClassical && <th style={{ color: 'var(--quantum-pink)' }}>Entangled</th>}
                                        <th style={mode === 'quantum' && compareClassical ? { color: 'var(--text-muted)' } : {}}>{mode === 'quantum' && compareClassical ? 'Classical' : 'Result'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className={getRowClass(0, 0)}>
                                        <td>0</td>
                                        <td>0</td>
                                        <td>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(0, 0, roundData)}</td>}
                                        <td>{renderColResult(0, 0, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(0, 1)}>
                                        <td>0</td>
                                        <td>1</td>
                                        <td>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(0, 1, roundData)}</td>}
                                        <td>{renderColResult(0, 1, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(1, 0)}>
                                        <td>1</td>
                                        <td>0</td>
                                        <td>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(1, 0, roundData)}</td>}
                                        <td>{renderColResult(1, 0, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(1, 1)}>
                                        <td>1</td>
                                        <td>1</td>
                                        <td>A != B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(1, 1, roundData)}</td>}
                                        <td>{renderColResult(1, 1, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="pane glass-panel graph-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: mode === 'quantum' ? 'var(--quantum-pink)' : 'white' }}>{mode === 'quantum' ? 'With Entanglement' : 'Average Success Rate'}</h3>
                                <button
                                    className="secondary-btn"
                                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                    onClick={() => setShowTheoreticalOptimum(prev => !prev)}
                                >
                                    {showTheoreticalOptimum ? 'Hide Theoretical Max' : 'Show Theoretical Max'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                <div className="stat-box" style={{ padding: 0, background: 'none', border: 'none', flexDirection: 'column' }}>
                                    <span className="stat-label">Success Rate</span>
                                    <span className="stat-value">{successRate}%</span>
                                </div>
                                <div className="stat-box" style={{ padding: 0, background: 'none', border: 'none', flexDirection: 'column' }}>
                                    <span className="stat-label">Wins</span>
                                    <span className="stat-value">{wins}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minHeight: '150px' }}>
                                {renderGraph(false, historyRates, theoreticalOptimum, showTheoreticalOptimum, true)}
                            </div>
                        </div>

                        {mode === 'quantum' && compareClassical && (
                            <div className="pane glass-panel graph-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>No Entanglement</h3>
                                    <button
                                        className="secondary-btn no-ent-btn"
                                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                                        onClick={() => setShowNoEntTheoreticalOptimum(prev => !prev)}
                                    >
                                        {showNoEntTheoreticalOptimum ? 'Hide Theoretical Max' : 'Show Theoretical Max'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <div className="stat-box" style={{ padding: 0, background: 'none', border: 'none', flexDirection: 'column' }}>
                                        <span className="stat-label">Success Rate</span>
                                        <span className="stat-value">{round > 0 ? (noEntWins / round * 100).toFixed(2) : '0.00'}%</span>
                                    </div>
                                    <div className="stat-box" style={{ padding: 0, background: 'none', border: 'none', flexDirection: 'column' }}>
                                        <span className="stat-label">Wins</span>
                                        <span className="stat-value">{noEntWins}</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minHeight: '150px' }}>
                                    {renderGraph(false, noEntHistoryRates, noEntTheoreticalOptimum, showNoEntTheoreticalOptimum, false)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
