import React, { useState, useRef, useEffect } from 'react';
import './AnglePicker.css';

interface Props {
    angle: number;
    onChange: (angle: number) => void;
}

export const AnglePicker: React.FC<Props> = ({ angle, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handlePointerEvent = (e: React.PointerEvent<SVGSVGElement> | PointerEvent) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = e.clientX - cx;
        const y = e.clientY - cy;
        
        let rad = Math.atan2(-y, x);
        let deg = rad * (180 / Math.PI);
        if (deg < 0) deg += 360;
        
        deg = Math.round(deg);
        onChange(deg);
    };

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointerEvent(e);
    };

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (e.buttons > 0) {
            handlePointerEvent(e);
        }
    };

    const rad = angle * (Math.PI / 180);
    const lineX = 50 + 40 * Math.cos(rad);
    const lineY = 50 - 40 * Math.sin(rad);

    return (
        <div className="angle-picker-container" ref={containerRef}>
            <button 
                className="angle-display-btn" 
                onClick={() => setIsOpen(!isOpen)}
                title="Pick Angle"
            >
                {angle}°
            </button>
            
            {isOpen && (
                <div className="angle-popover glass-panel">
                    <div className="angle-dial">
                        <svg 
                            ref={svgRef}
                            viewBox="0 0 100 100" 
                            className="dial-svg"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                        >
                            <circle cx="50" cy="50" r="40" className="dial-bg" />
                            <circle cx="50" cy="50" r="3" className="dial-center" />
                            <line x1="50" y1="50" x2={lineX} y2={lineY} className="dial-hand" />
                        </svg>
                    </div>
                    <div className="angle-input-container">
                        <input 
                            type="number" 
                            className="angle-input-box" 
                            value={angle} 
                            onChange={(e) => {
                                let v = parseFloat(e.target.value);
                                if (!isNaN(v)) onChange(v);
                            }} 
                        />
                        <span>°</span>
                    </div>
                </div>
            )}
        </div>
    );
};
