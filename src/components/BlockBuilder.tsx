import React, { useState, useEffect } from 'react';
import { BlockNode, ConditionNode } from '../engine/Simulation';
import { AnglePicker } from './AnglePicker';
import './BlockBuilder.css';

interface ProbInputProps {
    value: number;
    onChange: (val: number) => void;
}

const ProbInput: React.FC<ProbInputProps> = ({ value, onChange }) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());

    useEffect(() => {
        if (localValue !== "" && parseInt(localValue) === value) return;
        if (localValue === "" && value === 0) return;
        setLocalValue(value.toString());
    }, [value, localValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalValue(raw);
        
        let parsed = parseInt(raw);
        if (isNaN(parsed)) {
            onChange(0);
        } else {
            if (parsed > 100) parsed = 100;
            if (parsed < 0) parsed = 0;
            onChange(parsed);
        }
    };

    return (
        <input
            type="number"
            className="block-input"
            min="0"
            max="100"
            value={localValue}
            onChange={handleInputChange}
        />
    );
};

interface Props {
    node: BlockNode | null;
    onChange: (node: BlockNode | null) => void;
}

export const BlockBuilder: React.FC<Props> = ({ node, onChange }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const blockType = e.dataTransfer.getData('blockType');

        switch (blockType) {
            case 'IF_ELSE':
                onChange({ type: 'IF_ELSE', condition: null, trueBranch: null, falseBranch: null });
                break;
            case 'PROB':
                onChange({ type: 'PROB', prob: 50 });
                break;
            case 'RETURN_TRUE':
                onChange({ type: 'RETURN', value: true });
                break;
            case 'RETURN_FALSE':
                onChange({ type: 'RETURN', value: false });
                break;
            case 'MEASURE_SPIN':
                onChange({ type: 'MEASURE_SPIN', angle: 0 });
                break;
            case 'RECEIVED_1':
                onChange({
                    type: 'IF_ELSE',
                    condition: { type: 'RECEIVED', expected: 1 },
                    trueBranch: null,
                    falseBranch: null
                });
                break;
            case 'RECEIVED_0':
                onChange({
                    type: 'IF_ELSE',
                    condition: { type: 'RECEIVED', expected: 0 },
                    trueBranch: null,
                    falseBranch: null
                });
                break;
            case 'PROB_COND':
                onChange({
                    type: 'IF_ELSE',
                    condition: { type: 'PROB_COND', prob: 50 },
                    trueBranch: null,
                    falseBranch: null
                });
                break;
            case 'MEASURE_SPIN_COND':
                onChange({
                    type: 'IF_ELSE',
                    condition: { type: 'MEASURE_SPIN_COND', angle: 0, expected: true },
                    trueBranch: null,
                    falseBranch: null
                });
                break;
        }
    };

    if (!node) {
        return (
            <div className="block-builder">
                <div
                    className={`block-slot ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <span>Drag Block Here</span>
                </div>
            </div>
        );
    }

    if (node.type === 'RETURN') {
        return (
            <div className="block-builder">
                <div style={{ display: 'inline-block' }}>
                    <div className="block block-action">
                        <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                        <strong>Return</strong> {node.value ? 'True' : 'False'}
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'PROB') {
        return (
            <div className="block-builder">
                <div style={{ display: 'inline-block' }}>
                    <div className="block block-prob">
                        <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                        <strong>Return True with Probability of </strong>
                        <ProbInput
                            value={node.prob}
                            onChange={(val) => onChange({ ...node, prob: val })}
                        /> %
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'MEASURE_SPIN') {
        return (
            <div className="block-builder">
                <div style={{ display: 'inline-block' }}>
                    <div className="block block-action quantum-action">
                        <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                        <strong>Measure Spin at Angle</strong>
                        <AnglePicker
                            angle={node.angle}
                            onChange={(val) => onChange({ ...node, angle: val })}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (node.type === 'IF_ELSE') {
        return (
            <div className="block-builder">
                <div style={{ display: 'inline-block', width: '100%' }}>
                    <div className="block block-if">
                        <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                        <div className="block-header">
                            <strong>{node.condition?.type === 'PROB_COND' ? 'With' : 'If'}</strong>
                            <ConditionBuilder
                                condition={node.condition}
                                onChange={(cond) => onChange({ ...node, condition: cond })}
                            />
                        </div>
                        <div className="block-if-content">
                            <BlockBuilder node={node.trueBranch} onChange={(child) => onChange({ ...node, trueBranch: child })} />
                        </div>
                        <div className="block-else-label">Else</div>
                        <div className="block-if-content">
                            <BlockBuilder node={node.falseBranch} onChange={(child) => onChange({ ...node, falseBranch: child })} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

const ConditionBuilder: React.FC<{ condition: ConditionNode | null, onChange: (cond: ConditionNode | null) => void }> = ({ condition, onChange }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const blockType = e.dataTransfer.getData('blockType');

        switch (blockType) {
            case 'RECEIVED_1':
                onChange({ type: 'RECEIVED', expected: 1 });
                break;
            case 'RECEIVED_0':
                onChange({ type: 'RECEIVED', expected: 0 });
                break;
            case 'PROB_COND':
                onChange({ type: 'PROB_COND', prob: 50 });
                break;
            case 'MEASURE_SPIN_COND':
                onChange({ type: 'MEASURE_SPIN_COND', angle: 0, expected: true });
                break;
        }
    };

    const renderConditionContent = () => {
        if (!condition) return null;

        if (condition.type === 'PROB_COND') {
            return (
                <div style={{ display: 'inline-block' }}>
                    <div className="block-condition">
                        <strong>Probability of</strong>
                        <ProbInput
                            value={condition.prob}
                            onChange={(val) => onChange({ ...condition, prob: val })}
                        /> %
                        <button style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => onChange(null)}>✕</button>
                    </div>
                </div>
            );
        }

        if (condition.type === 'MEASURE_SPIN_COND') {
            return (
                <div style={{ display: 'inline-block' }}>
                    <div className="block-condition quantum-action">
                        <strong>Spin at</strong>
                        <AnglePicker
                            angle={condition.angle}
                            onChange={(val) => onChange({ ...condition, angle: val })}
                        />
                        <strong>is</strong>
                        <select
                            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer' }}
                            value={condition.expected ? 'up' : 'down'}
                            onChange={(e) => onChange({ ...condition, expected: e.target.value === 'up' })}
                        >
                            <option value="up">Up</option>
                            <option value="down">Down</option>
                        </select>
                        <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => onChange(null)}>✕</button>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ display: 'inline-block' }}>
                <div className="block-condition">
                    <strong>Received {condition.expected}</strong>
                    <button style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => onChange(null)}>✕</button>
                </div>
            </div>
        );
    };

    if (!condition) {
        return (
            <div
                className={`block-slot block-slot-inline ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <span>Drop Condition</span>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`condition-drop-wrapper ${isDragOver ? 'drag-over' : ''}`}
            style={{ display: 'inline-block', borderRadius: '12px' }}
        >
            {renderConditionContent()}
        </div>
    );
};
