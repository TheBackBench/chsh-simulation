"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSimulation = exports.playSingleRound = exports.LHVPair = exports.EntangledPair = exports.checkWin = void 0;
function checkWin(x, y, outA, outB) {
    if (x === 1 && y === 1) {
        return outA !== outB;
    }
    else {
        return outA === outB;
    }
}
exports.checkWin = checkWin;
var EntangledPair = /** @class */ (function () {
    function EntangledPair() {
        this.firstMeasured = null;
        this.firstAngle = 0;
        this.firstResult = false;
        this.secondMeasured = null;
        this.secondAngle = 0;
        this.secondResult = false;
    }
    EntangledPair.prototype.measure = function (player, angleRad) {
        if (!this.firstMeasured) {
            this.firstMeasured = player;
            this.firstAngle = angleRad;
            this.firstResult = Math.random() < 0.5;
            return this.firstResult;
        }
        else {
            this.secondMeasured = player;
            this.secondAngle = angleRad;
            // Correlated Photon Polarization Math
            var probSame = Math.pow(Math.cos(this.firstAngle - angleRad), 2);
            var same = Math.random() < probSame;
            this.secondResult = same ? this.firstResult : !this.firstResult;
            return this.secondResult;
        }
    };
    return EntangledPair;
}());
exports.EntangledPair = EntangledPair;
var LHVPair = /** @class */ (function (_super) {
    __extends(LHVPair, _super);
    function LHVPair() {
        var _this = _super.call(this) || this;
        _this.hiddenVar = Math.random() * 2 * Math.PI;
        return _this;
    }
    LHVPair.prototype.measure = function (player, angleRad) {
        var normalize = function (a) {
            var res = a % (2 * Math.PI);
            if (res < 0)
                res += 2 * Math.PI;
            return res;
        };
        var angle = normalize(angleRad);
        var particleHiddenVar = player === 'alice' ? this.hiddenVar : normalize(this.hiddenVar + Math.PI);
        var diff = Math.abs(angle - particleHiddenVar);
        if (diff > Math.PI)
            diff = 2 * Math.PI - diff;
        var result = diff <= Math.PI / 2;
        if (!this.firstMeasured) {
            this.firstMeasured = player;
            this.firstAngle = angleRad;
            this.firstResult = result;
        }
        else {
            this.secondMeasured = player;
            this.secondAngle = angleRad;
            this.secondResult = result;
        }
        return result;
    };
    return LHVPair;
}(EntangledPair));
exports.LHVPair = LHVPair;
function evaluateAST(node, instruction, defaultVal, pair, player, executionTrace) {
    if (pair === void 0) { pair = null; }
    if (player === void 0) { player = null; }
    if (executionTrace === void 0) { executionTrace = []; }
    if (!node)
        return defaultVal; // Fallback for incomplete trees
    if (node.type === 'RETURN') {
        return node.value;
    }
    if (node.type === 'PROB') {
        var randVal = Math.random() * 100;
        var result = randVal < node.prob;
        if (player)
            executionTrace.push({ type: 'PROB', player: player, prob: node.prob, result: result, randVal: randVal });
        return result;
    }
    if (node.type === 'MEASURE_SPIN') {
        if (pair && player) {
            var wasFirst = pair.firstMeasured === null;
            var measureResult = pair.measure(player, node.angle * (Math.PI / 180));
            executionTrace.push({
                type: 'MEASURE_SPIN',
                player: player,
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
        var conditionMet = false;
        if (node.condition) {
            if (node.condition.type === 'RECEIVED') {
                conditionMet = instruction === node.condition.expected;
            }
            else if (node.condition.type === 'PROB_COND') {
                var randVal = Math.random() * 100;
                var result = randVal < node.condition.prob;
                if (player)
                    executionTrace.push({ type: 'PROB', player: player, prob: node.condition.prob, result: result, randVal: randVal });
                conditionMet = result;
            }
            else if (node.condition.type === 'MEASURE_SPIN_COND') {
                var measureResult = false;
                if (pair && player) {
                    var wasFirst = pair.firstMeasured === null;
                    measureResult = pair.measure(player, node.condition.angle * (Math.PI / 180));
                    executionTrace.push({
                        type: 'MEASURE_SPIN',
                        player: player,
                        angle: node.condition.angle,
                        result: measureResult,
                        isFirst: wasFirst,
                        hiddenVar: pair instanceof LHVPair ? pair.hiddenVar * (180 / Math.PI) : undefined
                    });
                }
                else {
                    measureResult = Math.random() < 0.5;
                }
                conditionMet = measureResult === node.condition.expected;
            }
        }
        if (conditionMet) {
            return evaluateAST(node.trueBranch, instruction, defaultVal, pair, player, executionTrace);
        }
        else {
            return evaluateAST(node.falseBranch, instruction, defaultVal, pair, player, executionTrace);
        }
    }
    return defaultVal;
}
function playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy, simulateNoEntanglement, forcedX, forcedY) {
    if (simulateNoEntanglement === void 0) { simulateNoEntanglement = false; }
    var x = forcedX !== undefined ? forcedX : (Math.random() < 0.5 ? 0 : 1);
    var y = forcedY !== undefined ? forcedY : (Math.random() < 0.5 ? 0 : 1);
    var outA, outB;
    var quantumMeasured = false;
    var pair = null;
    var executionTrace = [];
    var isAliceFirst = true;
    if (evaluationOrder === 'bob')
        isAliceFirst = false;
    else if (evaluationOrder === 'random')
        isAliceFirst = Math.random() < 0.5;
    if (mode === 'classical') {
        if (isAliceFirst) {
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault, null, 'alice', executionTrace);
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault, null, 'bob', executionTrace);
        }
        else {
            outB = evaluateAST(classicalStrategy.bob, y, classicalStrategy.bobDefault, null, 'bob', executionTrace);
            outA = evaluateAST(classicalStrategy.alice, x, classicalStrategy.aliceDefault, null, 'alice', executionTrace);
        }
    }
    else {
        if (simulateNoEntanglement) {
            pair = new LHVPair();
            if (isAliceFirst) {
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
            }
            else {
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
            }
            quantumMeasured = pair.firstMeasured !== null;
        }
        else {
            pair = new EntangledPair();
            if (isAliceFirst) {
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
            }
            else {
                outB = evaluateAST(quantumStrategy.bob, y, quantumStrategy.bobDefault, pair, 'bob', executionTrace);
                outA = evaluateAST(quantumStrategy.alice, x, quantumStrategy.aliceDefault, pair, 'alice', executionTrace);
            }
            quantumMeasured = pair.firstMeasured !== null;
        }
    }
    var win = checkWin(x, y, outA, outB);
    var result = { x: x, y: y, outA: outA, outB: outB, win: win, quantumMeasured: quantumMeasured, executionTrace: executionTrace };
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
exports.playSingleRound = playSingleRound;
function runSimulation(mode, nGames, evaluationOrder, classicalStrategy, quantumStrategy, onProgress) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var wins = 0;
                    var chunkSize = Math.max(100, Math.floor(nGames / 100));
                    var i = 0;
                    function processChunk() {
                        var end = Math.min(i + chunkSize, nGames);
                        for (; i < end; i++) {
                            var result = playSingleRound(mode, evaluationOrder, classicalStrategy, quantumStrategy);
                            if (result.win) {
                                wins++;
                            }
                        }
                        var percent = (i / nGames) * 100;
                        onProgress(percent);
                        if (i < nGames) {
                            requestAnimationFrame(processChunk);
                        }
                        else {
                            resolve({
                                wins: wins,
                                total: nGames,
                                rate: (wins / nGames) * 100
                            });
                        }
                    }
                    requestAnimationFrame(processChunk);
                })];
        });
    });
}
exports.runSimulation = runSimulation;
