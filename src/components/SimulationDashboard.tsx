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
type RoundStage = 'ready' | 'sending' | 'returning' | 'result';

export const SimulationDashboard: React.FC<Props> = ({
    mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy, onClose
}) => {
    const [round, setRound] = useState(0);
    const [playState, setPlayState] = useState<PlayState>('playing');
    const [speed, setSpeed] = useState<1 | 3 | 10>(1);

    // Stats
    const [wins, setWins] = useState(0);
    const [historyRates, setHistoryRates] = useState<number[]>([]);

    // Animation state
    const [currentStage, setCurrentStage] = useState<RoundStage>('ready');
    const [roundData, setRoundData] = useState<RoundResult | null>(null);

    const playStateRef = useRef(playState);
    playStateRef.current = playState;

    const skipToEnd = () => {
        setPlayState('finished');
        let currentWins = wins;
        const newRates = [...historyRates];

        for (let i = round + 1; i <= nGames; i++) {
            const result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
            if (result.win) currentWins++;
            newRates.push((currentWins / i) * 100);
        }

        setWins(currentWins);
        setHistoryRates(newRates);
        setRound(nGames);
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
            const baseDelay = speed === 1 ? 800 : speed === 3 ? 300 : 50;

            // Generate Data
            const data = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
            setRoundData(data);

            // Sending Stage
            setCurrentStage('sending');
            await new Promise(r => setTimeout(r, baseDelay));
            if (isCancelled || playStateRef.current !== 'playing') return;

            // Returning Stage
            setCurrentStage('returning');
            await new Promise(r => setTimeout(r, baseDelay));
            if (isCancelled || playStateRef.current !== 'playing') return;

            // Result Stage
            setCurrentStage('result');
            const newWins = wins + (data.win ? 1 : 0);
            setWins(newWins);
            setRound(r => r + 1);
            setHistoryRates(prev => [...prev, (newWins / (round + 1)) * 100]);

            await new Promise(r => setTimeout(r, baseDelay / 2));
            if (isCancelled || playStateRef.current !== 'playing') return;

            setCurrentStage('ready');
        };

        runLoop();

        return () => {
            isCancelled = true;
        };
    }, [round, playState, speed, wins, mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy]);

    const successRate = round > 0 ? (wins / round * 100).toFixed(2) : '0.00';

    // SVG Graph rendering
    const renderGraph = () => {
        const width = 300;
        const height = 150;
        const margin = 20;
        const graphW = width - margin * 2;
        const graphH = height - margin * 2;


        let path = '';
        if (historyRates.length > 0) {
            const points = historyRates.map((rate, idx) => {
                const x = margin + ((idx + 1) / nGames) * graphW;
                const y = margin + graphH - (rate / 100) * graphH;
                return `${x},${y}`;
            });
            path = `M ${points.join(' L ')}`;
        }

        const limitY = margin + graphH - (0.75 * graphH);

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="live-graph">
                <line x1={margin} y1={margin} x2={margin} y2={height - margin} stroke="#666" />
                <line x1={margin} y1={height - margin} x2={width - margin} y2={height - margin} stroke="#666" />

                {/* 75% Limit Line */}
                <line x1={margin} y1={limitY} x2={width - margin} y2={limitY} stroke="#ff4444" strokeDasharray="4" />
                <text x={width - margin - 30} y={limitY - 5} fill="#ff4444" fontSize="10">75%</text>

                {path && <path d={path} fill="none" stroke="var(--accent-teal)" strokeWidth="2" />}

                {historyRates.length > 0 && (
                    <circle
                        cx={margin + (round / nGames) * graphW}
                        cy={margin + graphH - (historyRates[historyRates.length - 1] / 100) * graphH}
                        r="3"
                        fill="var(--accent-teal)"
                    />
                )}
            </svg>
        );
    };

    return (
        <div className="simulation-dashboard">
            <div className="dashboard-header">
                <h2>Simulation in Progress</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="dashboard-content">
                <div className="pane left-pane glass-panel">
                    <div className="turn-counter">Turn {round} / {nGames}</div>

                    <div className="animation-area">
                        <div className={`computer-node ${currentStage !== 'ready' ? 'active' : ''}`}>
                            💻 Computer
                        </div>

                        <div className="players">
                            <div className="player-node alice">
                                👩 Alice
                                {roundData && currentStage === 'sending' && (
                                    <div className="bit flying-to-alice">{roundData.x}</div>
                                )}
                                {roundData && currentStage === 'returning' && (
                                    <div className="bit returning-from-alice">{roundData.outA ? 1 : 0}</div>
                                )}
                            </div>

                            {mode === 'quantum' && (
                                <div className={`quantum-link ${(currentStage === 'sending' || currentStage === 'returning') && roundData?.quantumMeasured ? 'measured' : ''}`}>
                                    〰〰 Entanglement 〰〰
                                </div>
                            )}

                            <div className="player-node bob">
                                👨 Bob
                                {roundData && currentStage === 'sending' && (
                                    <div className="bit flying-to-bob">{roundData.y}</div>
                                )}
                                {roundData && currentStage === 'returning' && (
                                    <div className="bit returning-from-bob">{roundData.outB ? 1 : 0}</div>
                                )}
                            </div>
                        </div>

                        {currentStage === 'result' && roundData && (
                            <div className={`round-result-label ${roundData.win ? 'win' : 'loss'}`}>
                                {roundData.win ? 'SUCCESS!' : 'FAILURE'}
                            </div>
                        )}
                    </div>

                    <div className="controls">
                        {playState !== 'finished' && (
                            <>
                                <button onClick={() => setPlayState(p => p === 'playing' ? 'paused' : 'playing')}>
                                    {playState === 'playing' ? '⏸ Pause' : '▶ Play'}
                                </button>
                                <button onClick={() => setSpeed(s => s === 1 ? 3 : s === 3 ? 10 : 1)}>
                                    Speed: {speed}x
                                </button>
                                <button onClick={skipToEnd}>⏭ Skip to End</button>
                            </>
                        )}
                        {playState === 'finished' && (
                            <button onClick={onClose}>Finish & Return</button>
                        )}
                    </div>
                </div>

                <div className="right-panes">
                    <div className="pane glass-panel rules-pane">
                        <h3>Score Rules</h3>
                        <p>Win if: <strong>(x AND y) == (Alice XOR Bob)</strong></p>
                        <p>If x=1, y=1: Responses must be DIFFERENT.</p>
                        <p>Otherwise: Responses must be the SAME.</p>
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
                        <h3>Live Success Rate</h3>
                        {renderGraph()}
                    </div>
                </div>
            </div>
        </div>
    );
};
