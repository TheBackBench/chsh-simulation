import React, { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './Tutorial.css';

interface TutorialProps {
  showTutorial: boolean;
  onComplete: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ showTutorial, onComplete }) => {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (showTutorial && !hasStarted.current) {
      hasStarted.current = true;
      const driverObj = driver({
        showProgress: true,
        animate: true,
        popoverClass: 'driverjs-theme',
        steps: [
          { 
            popover: { title: 'Welcome to the CHSH Game Simulation!', description: 'Let us take a quick tour of the platform.' } 
          },
          { 
            element: '.mode-selector', 
            popover: { title: 'Game Modes', description: 'Switch between Classical and Quantum strategies here.', side: 'bottom' } 
          },
          { 
            element: '#classical-sandbox', 
            popover: { title: 'Strategy Builder', description: 'Define the measurement strategies for Alice and Bob.', side: 'top' } 
          },
          { 
            element: '.run-panel', 
            popover: { title: 'Run Simulation', description: 'Choose the number of games to simulate and see the results.', side: 'top' } 
          }
        ],
        onDestroyed: () => {
          onComplete();
        }
      });

      driverObj.drive();
    }
  }, [showTutorial, onComplete]);

  return null;
};

export default Tutorial;