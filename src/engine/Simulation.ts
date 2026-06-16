export type ConditionNode = 
    | { type: 'RECEIVED', expected: 0 | 1 }
    | { type: 'PROB_COND', prob: number };

export type ActionNode = 
    | { type: 'RETURN', value: boolean }
    | { type: 'PROB', prob: number }; // prob from 0 to 100

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
    a0: number; // degrees
    a1: number;
    b0: number;
    b1: number;
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

function evaluateAST(node: BlockNode | null, instruction: number, defaultVal: boolean): boolean {
    if (!node) return defaultVal; // Fallback for incomplete trees

    if (node.type === 'RETURN') {
        return node.value;
    }
    
    if (node.type === 'PROB') {
        return Math.random() * 100 < node.prob;
    }
    
    if (node.type === 'IF_ELSE') {
        let conditionMet = false;
        if (node.condition) {
            if (node.condition.type === 'RECEIVED') {
                conditionMet = instruction === node.condition.expected;
            } else if (node.condition.type === 'PROB_COND') {
                conditionMet = Math.random() * 100 < node.condition.prob;
            }
        }
        
        if (conditionMet) {
            return evaluateAST(node.trueBranch, instruction, defaultVal);
        } else {
            return evaluateAST(node.falseBranch, instruction, defaultVal);
        }
    }
    
    return defaultVal;
}

export async function runSimulation(
    mode: 'classical' | 'quantum',
    nGames: number,
    classicalStrategy: ClassicalStrategy,
    quantumStrategy: QuantumStrategy,
    onProgress: (percent: number) => void
): Promise<SimulationResult> {
    
    return new Promise((resolve) => {
        let wins = 0;
        const chunkSize = Math.max(100, Math.floor(nGames / 100));
        let i = 0;
        const deg2rad = Math.PI / 180;
        
        const qStratRad = {
            a0: quantumStrategy.a0 * deg2rad,
            a1: quantumStrategy.a1 * deg2rad,
            b0: quantumStrategy.b0 * deg2rad,
            b1: quantumStrategy.b1 * deg2rad,
        };

        function processChunk() {
            const end = Math.min(i + chunkSize, nGames);
            
            for (; i < end; i++) {
                const x = Math.random() < 0.5 ? 0 : 1;
                const y = Math.random() < 0.5 ? 0 : 1;
                let outA: boolean, outB: boolean;

                if (mode === 'classical') {
                    outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault);
                    outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault);
                } else {
                    const angleA = x === 0 ? qStratRad.a0 : qStratRad.a1;
                    const angleB = y === 0 ? qStratRad.b0 : qStratRad.b1;
                    
                    const probSame = Math.pow(Math.cos(angleA - angleB), 2);
                    outA = Math.random() < 0.5;
                    
                    if (Math.random() < probSame) {
                        outB = outA; 
                    } else {
                        outB = !outA;
                    }
                }

                if (checkWin(x, y, outA, outB)) {
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
