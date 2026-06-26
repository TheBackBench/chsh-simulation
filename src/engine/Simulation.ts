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

    measure(player: 'alice'|'bob', angleRad: number): boolean {
        if (!this.firstMeasured) {
            this.firstMeasured = player;
            this.firstAngle = angleRad;
            this.firstResult = Math.random() < 0.5;
            return this.firstResult;
        } else {
            this.secondMeasured = player;
            this.secondAngle = angleRad;
            const probSame = Math.pow(Math.cos(this.firstAngle - angleRad), 2);
            const same = Math.random() < probSame;
            this.secondResult = same ? this.firstResult : !this.firstResult;
            return this.secondResult;
        }
    }
}

function evaluateAST(
    node: BlockNode | null, 
    instruction: number, 
    defaultVal: boolean, 
    pair: EntangledPair | null = null, 
    player: 'alice' | 'bob' | null = null
): boolean {
    if (!node) return defaultVal; // Fallback for incomplete trees

    if (node.type === 'RETURN') {
        return node.value;
    }
    
    if (node.type === 'PROB') {
        return Math.random() * 100 < node.prob;
    }

    if (node.type === 'MEASURE_SPIN') {
        if (pair && player) {
            return pair.measure(player, node.angle * (Math.PI / 180));
        }
        return Math.random() < 0.5;
    }
    
    if (node.type === 'IF_ELSE') {
        let conditionMet = false;
        if (node.condition) {
            if (node.condition.type === 'RECEIVED') {
                conditionMet = instruction === node.condition.expected;
            } else if (node.condition.type === 'PROB_COND') {
                conditionMet = Math.random() * 100 < node.condition.prob;
            } else if (node.condition.type === 'MEASURE_SPIN_COND') {
                const measureResult = pair && player ? pair.measure(player, node.condition.angle * (Math.PI / 180)) : Math.random() < 0.5;
                conditionMet = measureResult === node.condition.expected;
            }
        }
        
        if (conditionMet) {
            return evaluateAST(node.trueBranch, instruction, defaultVal, pair, player);
        } else {
            return evaluateAST(node.falseBranch, instruction, defaultVal, pair, player);
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
    };
}

export function playSingleRound(
    mode: 'classical' | 'quantum',
    evaluationOrder: 'alice' | 'bob' | 'random',
    classicalStrategy: ClassicalStrategy,
    quantumStrategy: QuantumStrategy
): RoundResult {
    const x = Math.random() < 0.5 ? 0 : 1;
    const y = Math.random() < 0.5 ? 0 : 1;
    let outA: boolean, outB: boolean;
    let quantumMeasured = false;
    let pair: EntangledPair | null = null;

    let isAliceFirst = true;
    if (evaluationOrder === 'bob') isAliceFirst = false;
    else if (evaluationOrder === 'random') isAliceFirst = Math.random() < 0.5;

    if (mode === 'classical') {
        if (isAliceFirst) {
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault);
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault);
        } else {
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault);
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault);
        }
    } else {
        pair = new EntangledPair();
        if (isAliceFirst) {
            outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice');
            outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob');
        } else {
            outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob');
            outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice');
        }
        quantumMeasured = pair.firstMeasured !== null;
    }

    const win = checkWin(x, y, outA, outB);
    const result: RoundResult = { x, y, outA, outB, win, quantumMeasured };
    if (mode === 'quantum' && pair) {
        result.quantumDetails = {
            firstMeasured: pair.firstMeasured,
            firstAngle: pair.firstMeasured ? pair.firstAngle * (180 / Math.PI) : 0,
            firstResult: pair.firstResult,
            secondMeasured: pair.secondMeasured,
            secondAngle: pair.secondMeasured ? pair.secondAngle * (180 / Math.PI) : 0,
            secondResult: pair.secondResult
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
