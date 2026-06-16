import React, { useState } from 'react';
import { BlockNode, ConditionNode } from '../engine/Simulation';
import './BlockBuilder.css';

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
                <div className="block block-action">
                    <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                    <strong>Return</strong> {node.value ? 'True' : 'False'}
                </div>
            </div>
        );
    }

    if (node.type === 'PROB') {
        return (
            <div className="block-builder">
                <div className="block block-prob">
                    <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                    <strong>Return True with Probability of </strong>
                    <input
                        type="number"
                        className="block-input"
                        min="0" max="100"
                        value={node.prob}
                        onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0;
                            if (val > 100) val = 100;
                            if (val < 0) val = 0;
                            onChange({ ...node, prob: val });
                        }}
                    /> %
                </div>
            </div>
        );
    }

    if (node.type === 'IF_ELSE') {
        return (
            <div className="block-builder">
                <div className="block block-if">
                    <button className="block-delete" onClick={() => onChange(null)}>✕</button>
                    <div className="block-header">
                        <strong>If</strong>
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
        }
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

    if (condition.type === 'PROB_COND') {
        return (
            <div className="block-condition">
                <strong>Probability</strong>
                <input
                    type="number"
                    className="block-input"
                    min="0" max="100"
                    value={condition.prob}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 0;
                        if (val > 100) val = 100;
                        if (val < 0) val = 0;
                        onChange({ ...condition, prob: val });
                    }}
                /> %
                <button style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => onChange(null)}>✕</button>
            </div>
        );
    }

    return (
        <div className="block-condition">
            <strong>Received {condition.expected}</strong>
            <button style={{ background: 'transparent', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }} onClick={() => onChange(null)}>✕</button>
        </div>
    );
};
