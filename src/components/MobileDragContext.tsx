import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileDragContextType {
    selectedBlock: string | null;
    setSelectedBlock: (block: string | null) => void;
}

const MobileDragContext = createContext<MobileDragContextType | undefined>(undefined);

export const MobileDragProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

    return (
        <MobileDragContext.Provider value={{ selectedBlock, setSelectedBlock }}>
            {children}
        </MobileDragContext.Provider>
    );
};

export const useMobileDrag = () => {
    const context = useContext(MobileDragContext);
    if (!context) {
        throw new Error('useMobileDrag must be used within a MobileDragProvider');
    }
    return context;
};
