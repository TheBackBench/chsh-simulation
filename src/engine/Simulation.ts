export type ConditionNode =
    | { type: 'RECEIVED', expected: 0 | 1 }
    | { type: 'PROB_COND', prob: number }
    | { type: 'MEASURE_SPIN_COND', angle: number, expected: boolean };

export type ActionNode =
    | { type: 'RETURN', value: boolean }
    | { type: 'PROB', prob: number } // prob from 0 to 100
    | { type: 'MEASURE_SPIN', angle: number };

export type BlockNode =
    | { type: 'IF_ELSE', condition: ConditionNode | null, trueBranch: BlockNode | null, falseBranch: BlockNode | null }
    | ActionNode;

export interface ClassicalStrategy {
    alice: BlockNode | null;
    bob: BlockNode | null;
    aliceDefault: boolean;
    bobDefault: boolean;
}

export interface QuantumStrategy {
    alice: BlockNode | null;
    bob: BlockNode | null;
    aliceDefault: boolean;
    bobDefault: boolean;
}

export interface SimulationResult {
    wins: number;
    total: number;
    rate: number; // 0 to 100
}

export function checkWin(x: number, y: number, outA: boolean, outB: boolean): boolean {
    if (x === 1 && y === 1) {
        return outA !== outB;
    } else {
        return outA === outB;
    }
}

export class EntangledPair {
    firstMeasured: 'alice' | 'bob' | null = null;
    firstAngle: number = 0;
    firstResult: boolean = false;

    secondMeasured: 'alice' | 'bob' | null = null;
    secondAngle: number = 0;
    secondResult: boolean = false;

    measure(player: 'alice' | 'bob', angleRad: number): boolean {
        if (!this.firstMeasured) {
            this.firstMeasured = player;
            this.firstAngle = angleRad;
            this.firstResult = Math.random() < 0.5;
            return this.firstResult;
        } else {
            this.secondMeasured = player;
            this.secondAngle = angleRad;
            // Correlated Photon Polarization Math
            const probSame = Math.pow(Math.cos(this.firstAngle - angleRad), 2);
            const same = Math.random() < probSame;
            this.secondResult = same ? this.firstResult : !this.firstResult;
            return this.secondResult;
        }
    }
}

export class LHVPair extends EntangledPair {
    hiddenVar: number;

    constructor() {
        super();
        this.hiddenVar = Math.random() * 2 * Math.PI;
    }

    measure(player: 'alice' | 'bob', angleRad: number): boolean {
        const normalize = (a: number) => {
            let res = a % (2 * Math.PI);
            if (res < 0) res += 2 * Math.PI;
            return res;
        };

        const angle = normalize(angleRad);
        const particleHiddenVar = player === 'alice' ? this.hiddenVar : normalize(this.hiddenVar + Math.PI);

        let diff = Math.abs(angle - particleHiddenVar);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        const result = diff <= Math.PI / 2;

        if (!this.firstMeasured) {
            this.firstMeasured = player;
            this.firstAngle = angleRad;
            this.firstResult = result;
        } else {
            this.secondMeasured = player;
            this.secondAngle = angleRad;
            this.secondResult = result;
        }
        return result;
    }
}

export type ExecutionEvent =
    | { type: 'PROB'; player: 'alice' | 'bob'; prob: number; result: boolean; randVal: number }
    | { type: 'MEASURE_SPIN'; player: 'alice' | 'bob'; angle: number; result: boolean; isFirst: boolean; hiddenVar?: number };

function evaluateAST(
    node: BlockNode | null,
    instruction: number,
    defaultVal: boolean,
    pair: EntangledPair | null = null,
    player: 'alice' | 'bob' | null = null,
    executionTrace: ExecutionEvent[] = []
): boolean {
    if (!node) return defaultVal; // Fallback for incomplete trees

    if (node.type === 'RETURN') {
        return node.value;
    }

    if (node.type === 'PROB') {
        const randVal = Math.random() * 100;
        const result = randVal < node.prob;
        if (player) executionTrace.push({ type: 'PROB', player, prob: node.prob, result, randVal });
        return result;
    }

    if (node.type === 'MEASURE_SPIN') {
        if (pair && player) {
            const wasFirst = pair.firstMeasured === null;
            const measureResult = pair.measure(player, node.angle * (Math.PI / 180));
            executionTrace.push({
                type: 'MEASURE_SPIN',
                player,
                angle: node.angle,
                result: measureResult,
                isFirst: wasFirst,
                hiddenVar: pair instanceof LHVPair ? pair.hiddenVar * (180 / Math.PI) : undefined
            });
            return measureResult;
        }
        return Math.random() < 0.5;
    }

    if (node.type === 'IF_ELSE') {
        let conditionMet = false;
        if (node.condition) {
            if (node.condition.type === 'RECEIVED') {
                conditionMet = instruction === node.condition.expected;
            } else if (node.condition.type === 'PROB_COND') {
                const randVal = Math.random() * 100;
                const result = randVal < node.condition.prob;
                if (player) executionTrace.push({ type: 'PROB', player, prob: node.condition.prob, result, randVal });
                conditionMet = result;
            } else if (node.condition.type === 'MEASURE_SPIN_COND') {
                let measureResult = false;
                if (pair && player) {
                    const wasFirst = pair.firstMeasured === null;
                    measureResult = pair.measure(player, node.condition.angle * (Math.PI / 180));
                    executionTrace.push({
                        type: 'MEASURE_SPIN',
                        player,
                        angle: node.condition.angle,
                        result: measureResult,
                        isFirst: wasFirst,
                        hiddenVar: pair instanceof LHVPair ? pair.hiddenVar * (180 / Math.PI) : undefined
                    });
                } else {
                    measureResult = Math.random() < 0.5;
                }
                conditionMet = measureResult === node.condition.expected;
            }
        }

        if (conditionMet) {
            return evaluateAST(node.trueBranch, instruction, defaultVal, pair, player, executionTrace);
        } else {
            return evaluateAST(node.falseBranch, instruction, defaultVal, pair, player, executionTrace);
        }
    }

    return defaultVal;
}

export interface RoundResult {
    x: number;
    y: number;
    outA: boolean;
    outB: boolean;
    win: boolean;
    quantumMeasured: boolean;
    quantumDetails?: {
        firstMeasured: 'alice' | 'bob' | null;
        firstAngle: number;
        firstResult: boolean;
        secondMeasured: 'alice' | 'bob' | null;
        secondAngle: number;
        secondResult: boolean;
        hiddenVar?: number;
    };
    executionTrace: ExecutionEvent[];
}

export function playSingleRound(
    mode: 'classical' | 'quantum',
    evaluationOrder: 'alice' | 'bob' | 'random',
    classicalStrategy: ClassicalStrategy,
    quantumStrategy: QuantumStrategy,
    simulateNoEntanglement: boolean = false,
    forcedX?: number,
    forcedY?: number
): RoundResult {
    const x = forcedX !== undefined ? forcedX : (Math.random() < 0.5 ? 0 : 1);
    const y = forcedY !== undefined ? forcedY : (Math.random() < 0.5 ? 0 : 1);
    let outA: boolean, outB: boolean;
    let quantumMeasured = false;
    let pair: EntangledPair | null = null;
    const executionTrace: ExecutionEvent[] = [];

    let isAliceFirst = true;
    if (evaluationOrder === 'bob') isAliceFirst = false;
    else if (evaluationOrder === 'random') isAliceFirst = Math.random() < 0.5;

    if (mode === 'classical') {
        if (isAliceFirst) {
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault, null, 'alice', executionTrace);
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault, null, 'bob', executionTrace);
        } else {
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault, null, 'bob', executionTrace);
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault, null, 'alice', executionTrace);
        }
    } else {
        if (simulateNoEntanglement) {
            pair = new LHVPair();
            if (isAliceFirst) {
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
            } else {
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
            }
            quantumMeasured = pair.firstMeasured !== null;
        } else {
            pair = new EntangledPair();
            if (isAliceFirst) {
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
            } else {
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
            }
            quantumMeasured = pair.firstMeasured !== null;
        }
    }

    const win = checkWin(x, y, outA, outB);
    const result: RoundResult = { x, y, outA, outB, win, quantumMeasured, executionTrace };
    if (mode === 'quantum' && pair) {
        result.quantumDetails = {
            firstMeasured: pair.firstMeasured,
            firstAngle: pair.firstMeasured ? pair.firstAngle * (180 / Math.PI) : 0,
            firstResult: pair.firstResult,
            secondMeasured: pair.secondMeasured,
            secondAngle: pair.secondMeasured ? pair.secondAngle * (180 / Math.PI) : 0,
            secondResult: pair.secondResult,
            hiddenVar: pair instanceof LHVPair ? pair.hiddenVar * (180 / Math.PI) : undefined
        };
    }
    return result;
}

export async function runSimulation(
    mode: 'classical' | 'quantum',
    nGames: number,
    evaluationOrder: 'alice' | 'bob' | 'random',
    classicalStrategy: ClassicalStrategy,
    quantumStrategy: QuantumStrategy,
    onProgress: (percent: number) => void
): Promise<SimulationResult> {

    return new Promise((resolve) => {
        let wins = 0;
        const chunkSize = Math.max(100, Math.floor(nGames / 100));
        let i = 0;

        function processChunk() {
            const end = Math.min(i + chunkSize, nGames);

            for (; i < end; i++) {
                const result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
                if (result.win) {
                    wins++;
                }
            }

            const percent = (i / nGames) * 100;
            onProgress(percent);

            if (i < nGames) {
                requestAnimationFrame(processChunk);
            } else {
                resolve({
                    wins,
                    total: nGames,
                    rate: (wins / nGames) * 100
                });
            }
        }

        requestAnimationFrame(processChunk);
    });
}
