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

const ProbabilityAnimation: React.FC<{ prob: number, result: boolean, duration: number }> = ({ prob, result, duration }) => {
    const [currentVal, setCurrentVal] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let finalVal: number;
        if (result) {
            // Must be < prob
            finalVal = Math.floor(Math.random() * prob);
        } else {
            // Must be >= prob
            finalVal = Math.floor(Math.random() * (100 - prob)) + prob;
        }

        const intervalTime = 50;
        const spinTime = duration > 600 ? duration - 500 : Math.max(0, duration - 50);
        const totalSpins = Math.floor(spinTime / intervalTime);
        let spinCount = 0;

        if (totalSpins <= 0) {
            setCurrentVal(finalVal);
            setIsFinished(true);
            return;
        }

        const interval = setInterval(() => {
            spinCount++;
            if (spinCount >= totalSpins) {
                clearInterval(interval);
                setCurrentVal(finalVal);
                setIsFinished(true);
            } else {
                setCurrentVal(Math.floor(Math.random() * 100));
            }
        }, intervalTime);

        return () => clearInterval(interval);
    }, [prob, result, duration]);

    return (
        <div className={`prob-animation-container ${isFinished ? (result ? 'success' : 'failure') : ''}`}>
            <div className="prob-value">
                {currentVal !== null ? currentVal : '--'}
            </div>
            <div className="prob-target">
                &lt; {prob}
            </div>
            {isFinished && (
                <div className="prob-result-label">
                    {result ? '→ 1' : '→ 0'}
                </div>
            )}
        </div>
    );
};

type PlayState = 'playing' | 'paused' | 'finished' | 'pause-requested';
type RoundStage =
    | 'ready'
    | 'generating-pair'
    | 'sending'
    | 'executing'
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

    const [activeEventIndex, setActiveEventIndex] = useState<number>(-1);
    const [activeEventSubstage, setActiveEventSubstage] = useState<'pending' | 'result'>('pending');

    const activeEventIndexRef = useRef(activeEventIndex);
    activeEventIndexRef.current = activeEventIndex;
    
    const activeEventSubstageRef = useRef(activeEventSubstage);
    activeEventSubstageRef.current = activeEventSubstage;

    // New State for No Entanglement parallel run run
    const [noEntWins, setNoEntWins] = useState(0);
    const [noEntHistoryRates, setNoEntHistoryRates] = useState<number[]>([]);
    const [noEntRoundData, setNoEntRoundData] = useState<RoundResult | null>(null);

    const playStateRef = useRef(playState);
    playStateRef.current = playState;

    const baseDelay = 2500 / speed;

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
        setActiveEventIndex(-1);
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
                setActiveEventIndex(-1);
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


            const startStage = currentStage === 'ready' ? 'generating-pair' : currentStage;

            // Generating Pair Stage
            if (startStage === 'generating-pair') {
                setCurrentStage('generating-pair');
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;
            }

            // Sending Stage
            if (['generating-pair', 'sending'].includes(startStage)) {
                setCurrentStage('sending');
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;
            }

            // Executing Stage (Dynamic Execution Trace)
            if (data.executionTrace && data.executionTrace.length > 0) {
                let startIndex = 0;
                let startSubstage = 'pending';
                if (startStage === 'executing') {
                    startIndex = activeEventIndexRef.current;
                    startSubstage = activeEventSubstageRef.current;
                }

                for (let i = startIndex; i < data.executionTrace.length; i++) {
                    const event = data.executionTrace[i];
                    setCurrentStage('executing');
                    setActiveEventIndex(i);
                    activeEventIndexRef.current = i;
                    
                    if (event.type === 'PROB') {
                        if (startSubstage === 'pending' || i > startIndex) {
                            setActiveEventSubstage('pending');
                            await new Promise(r => setTimeout(r, baseDelay * 1.5));
                            if (isCancelled || playStateRef.current !== 'playing') return;
                        }
                    } else if (event.type === 'MEASURE_SPIN') {
                        if (startSubstage === 'pending' || i > startIndex) {
                            setActiveEventSubstage('pending');
                            activeEventSubstageRef.current = 'pending';
                            await new Promise(r => setTimeout(r, baseDelay));
                            if (isCancelled || playStateRef.current !== 'playing') return;
                        }
                        
                        if (startSubstage === 'pending' || startSubstage === 'result' || i > startIndex) {
                            setActiveEventSubstage('result');
                            activeEventSubstageRef.current = 'result';
                            await new Promise(r => setTimeout(r, baseDelay));
                            if (isCancelled || playStateRef.current !== 'playing') return;
                        }
                    }
                }
            }

            // Returning Stage
            if (['generating-pair', 'sending', 'executing', 'returning'].includes(startStage)) {
                setCurrentStage('returning');
                setActiveEventIndex(-1);
                await new Promise(r => setTimeout(r, baseDelay));
                if (isCancelled || playStateRef.current !== 'playing') return;
            }

            // Result Stage
            if (['generating-pair', 'sending', 'executing', 'returning'].includes(startStage)) {
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


    const renderUnitCircle = (
        angle: number,
        isPending: boolean,
        showResult: boolean,
        resultUp: boolean,
        collapsedState?: { angle: number; resultUp: boolean },
        hiddenVar?: number,
        isAlice?: boolean
    ) => {
        const rad = (angle * Math.PI) / 180;
        const labelX = 36 * Math.cos(rad);
        const labelY = -36 * Math.sin(rad);

        let upArc = null;
        let downArc = null;
        let hiddenAxis = null;
        if (hiddenVar !== undefined && isAlice !== undefined) {
            const h = isAlice ? hiddenVar : hiddenVar + 180;
            const r = 24;
            const startRad = (h - 90) * Math.PI / 180;
            const endRad = (h + 90) * Math.PI / 180;
            const p1 = { x: r * Math.cos(startRad), y: -r * Math.sin(startRad) };
            const p2 = { x: r * Math.cos(endRad), y: -r * Math.sin(endRad) };

            upArc = <path d={`M ${p1.x},${p1.y} A ${r},${r} 0 0,0 ${p2.x},${p2.y} Z`} fill="rgba(0, 255, 159, 0.15)" stroke="rgba(0, 255, 159, 0.3)" strokeDasharray="2 2" />;
            downArc = <path d={`M ${p2.x},${p2.y} A ${r},${r} 0 0,0 ${p1.x},${p1.y} Z`} fill="rgba(255, 68, 68, 0.15)" stroke="rgba(255, 68, 68, 0.3)" strokeDasharray="2 2" />;

            const hRad = h * Math.PI / 180;
            const hx = r * Math.cos(hRad);
            const hy = -r * Math.sin(hRad);
            hiddenAxis = <line x1="0" y1="0" x2={hx} y2={hy} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="2 2" />;
        }

        return (
            <svg width="100" height="100" viewBox="-50 -50 100 100" className="unit-circle-svg">
                {upArc}
                {downArc}
                <circle cx="0" cy="0" r="24" className="circle-outline" />
                <line x1="-28" y1="0" x2="28" y2="0" className="axis-faint" />
                <line x1="0" y1="-28" x2="0" y2="28" className="axis-faint" />
                {hiddenAxis}
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
        if (mode !== 'quantum' || !data || currentStage === 'ready' || currentStage === 'generating-pair' || currentStage === 'sending' || currentStage === 'result' || currentStage === 'returning') return null;

        if (currentStage === 'executing' && activeEventIndex >= 0 && data.executionTrace) {
            const event = data.executionTrace[activeEventIndex];
            if (event && event.type === 'MEASURE_SPIN' && event.player === player) {
                const isPending = activeEventSubstage === 'pending';
                const showResult = activeEventSubstage === 'result';
                
                let collapsedState = undefined;
                if (!event.isFirst && isEntangled) {
                    const firstEvent = data.executionTrace.find(e => e.type === 'MEASURE_SPIN' && e.isFirst);
                    if (firstEvent && firstEvent.type === 'MEASURE_SPIN') {
                        collapsedState = { angle: firstEvent.angle, resultUp: firstEvent.result };
                    }
                }

                return (
                    <div className={`quantum-overlay ${showResult ? 'measured' : 'pending'} ${!isEntangled ? 'no-ent-overlay' : ''}`}>
                        {renderUnitCircle(event.angle, isPending, showResult, event.result, collapsedState, !isEntangled ? event.hiddenVar : undefined, player === 'alice')}
                        <div className="quantum-spin-result">{showResult ? (event.result ? '↑ (Up)' : '↓ (Down)') : '?'}</div>
                        <div className="quantum-status-text">{isPending ? 'Measuring' : 'Measured'} at {event.angle.toFixed(0)}°</div>
                    </div>
                );
            }
        }

        return null;
    };

    const renderAnimationArea = (data: RoundResult | null, isEntangled: boolean) => {
        let mathText: React.ReactNode = <span style={{ color: 'var(--text-muted)' }}>Waiting for round to begin...</span>;

        if (data?.quantumDetails) {
            // Placeholder for live explanation text
            mathText = "Live explaining to be added later";
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="animation-area" style={{ flex: 1 }}>
                    {data && currentStage === 'sending' && (
                        <>
                            <div className="bit abs-flying-to-alice">{data.x}</div>
                            <div className="bit abs-flying-to-bob">{data.y}</div>
                        </>
                    )}
                    {data && currentStage === 'returning' && (
                        <>
                            <div className="bit abs-returning-from-alice">{data.outA ? 1 : 0}</div>
                            <div className="bit abs-returning-from-bob">{data.outB ? 1 : 0}</div>
                        </>
                    )}
                    <div className={`computer-node ${currentStage !== 'ready' ? 'active' : ''}`}>
                        💻 Computer
                        {data && currentStage === 'result' && (
                            <>
                                <div className="bit static-on-computer-left">{data.outA ? 1 : 0}</div>
                                <div className="bit static-on-computer-right">{data.outB ? 1 : 0}</div>
                            </>
                        )}
                    </div>

                    {!isEntangled && data && currentStage !== 'ready' && data.quantumMeasured && (() => {
                        const hiddenVarEvent = data.executionTrace?.find(e => e.type === 'MEASURE_SPIN' && e.isFirst);
                        const hiddenVar = hiddenVarEvent?.type === 'MEASURE_SPIN' ? hiddenVarEvent.hiddenVar : 0;
                        return (
                        <div className="hidden-var-subwindow glass-panel" style={{ position: 'absolute', right: '40px', bottom: '-2px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, background: 'rgba(11, 15, 25, 0.95)', border: '1px solid var(--glass-border)', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)' }}>
                            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                                Hidden Variables
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <svg width="40" height="40" viewBox="-50 -50 100 100" style={{ overflow: 'visible' }}>
                                        <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                        <g className="spinning-hidden-var" style={{ '--target-angle': `${-(hiddenVar || 0)}deg` } as React.CSSProperties}>
                                            <path d="M 0,-40 A 40,40 0 0,1 0,40 Z" fill="rgba(0, 255, 159, 0.15)" stroke="rgba(0, 255, 159, 0.3)" strokeDasharray="2 2" />
                                            <path d="M 0,40 A 40,40 0 0,1 0,-40 Z" fill="rgba(255, 68, 68, 0.15)" stroke="rgba(255, 68, 68, 0.3)" strokeDasharray="2 2" />
                                            <line x1="-40" y1="0" x2="35" y2="0" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="2 2" />
                                            <polygon points="35,-5 45,0 35,5" fill="#fff" />
                                        </g>
                                    </svg>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Alice</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <svg width="40" height="40" viewBox="-50 -50 100 100" style={{ overflow: 'visible' }}>
                                        <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                        <g className="spinning-hidden-var" style={{ '--target-angle': `${-((hiddenVar || 0) + 180)}deg` } as React.CSSProperties}>
                                            <path d="M 0,-40 A 40,40 0 0,1 0,40 Z" fill="rgba(0, 255, 159, 0.15)" stroke="rgba(0, 255, 159, 0.3)" strokeDasharray="2 2" />
                                            <path d="M 0,40 A 40,40 0 0,1 0,-40 Z" fill="rgba(255, 68, 68, 0.15)" stroke="rgba(255, 68, 68, 0.3)" strokeDasharray="2 2" />
                                            <line x1="-40" y1="0" x2="35" y2="0" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeDasharray="2 2" />
                                            <polygon points="35,-5 45,0 35,5" fill="#fff" />
                                        </g>
                                    </svg>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Bob</div>
                                </div>
                            </div>
                        </div>
                        );
                    })()}

                    <div className="players">
                        <div className="player-node alice">
                            👩 Alice
                            {data && currentStage !== 'sending' && currentStage !== 'ready' && (
                                <div className="bit static-on-alice">{data.x}</div>
                            )}
                            {currentStage === 'executing' && activeEventIndex >= 0 && data?.executionTrace?.[activeEventIndex]?.type === 'PROB' && data.executionTrace[activeEventIndex].player === 'alice' && (
                                <ProbabilityAnimation 
                                    prob={(data.executionTrace[activeEventIndex] as any).prob}
                                    result={(data.executionTrace[activeEventIndex] as any).result}
                                    duration={baseDelay * 1.5}
                                />
                            )}
                            {renderQuantumOverlay('alice', data, isEntangled)}
                        </div>

                        {mode === 'quantum' && (
                            <div className={`quantum-link ${!isEntangled ? 'no-ent' : ''} ${data?.quantumMeasured && currentStage !== 'ready' && currentStage !== 'result' ? 'measured' : ''}`}>
                                {isEntangled ? '〰〰 True Entanglement 〰〰' : '〰〰 Hidden Variable 〰〰'}
                            </div>
                        )}

                        <div className="player-node bob">
                            👨 Bob
                            {data && currentStage !== 'sending' && currentStage !== 'ready' && (
                                <div className="bit static-on-bob">{data.y}</div>
                            )}
                            {currentStage === 'executing' && activeEventIndex >= 0 && data?.executionTrace?.[activeEventIndex]?.type === 'PROB' && data.executionTrace[activeEventIndex].player === 'bob' && (
                                <ProbabilityAnimation 
                                    prob={(data.executionTrace[activeEventIndex] as any).prob}
                                    result={(data.executionTrace[activeEventIndex] as any).result}
                                    duration={baseDelay * 1.5}
                                />
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

                <div className="math-panel" style={{ height: '120px', marginTop: '4rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.9rem', color: '#e0e0e0', border: `1px solid ${isEntangled ? 'var(--quantum-pink)' : '#666'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {mathText}
                </div>
            </div>
        );
    };

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
                            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--accent-teal)' }}>{mode === 'quantum' ? 'True Entanglement' : 'Simulation Stats'}</h3>
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
                                <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>Hidden Variable</h3>
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
                            {mode === 'quantum' && <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--quantum-pink)' }}>True Entanglement</h3>}

                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {renderAnimationArea(roundData, true)}
                            </div>
                        </div>

                        {mode === 'quantum' && compareClassical && (
                            <div className="pane glass-panel no-ent-live-window" style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--text-muted)' }}>Hidden Variable</h4>
                                </div>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {renderAnimationArea(noEntRoundData, false)}
                                </div>
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
                                        <th style={{ whiteSpace: 'nowrap' }}>Target</th>
                                        {mode === 'quantum' && compareClassical && <th style={{ color: 'var(--quantum-pink)' }}>True Entanglement</th>}
                                        <th style={mode === 'quantum' && compareClassical ? { color: 'var(--text-muted)' } : {}}>{mode === 'quantum' && compareClassical ? 'Hidden Variable' : 'Result'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className={getRowClass(0, 0)}>
                                        <td>0</td>
                                        <td>0</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(0, 0, roundData)}</td>}
                                        <td>{renderColResult(0, 0, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(0, 1)}>
                                        <td>0</td>
                                        <td>1</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(0, 1, roundData)}</td>}
                                        <td>{renderColResult(0, 1, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(1, 0)}>
                                        <td>1</td>
                                        <td>0</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>A == B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(1, 0, roundData)}</td>}
                                        <td>{renderColResult(1, 0, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                    <tr className={getRowClass(1, 1)}>
                                        <td>1</td>
                                        <td>1</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>A != B</td>
                                        {mode === 'quantum' && compareClassical && <td>{renderColResult(1, 1, roundData)}</td>}
                                        <td>{renderColResult(1, 1, mode === 'quantum' && compareClassical ? noEntRoundData : roundData, mode === 'quantum' && compareClassical)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="pane glass-panel graph-pane" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, color: mode === 'quantum' ? 'var(--quantum-pink)' : 'white' }}>{mode === 'quantum' ? 'True Entanglement' : 'Average Success Rate'}</h3>
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
                                    <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Hidden Variable</h3>
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
