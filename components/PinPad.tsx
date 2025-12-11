import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Backspace, LockKey } from '@phosphor-icons/react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  isSetup?: boolean;
  onCancel?: () => void;
  error?: string;
}

const PinPad: React.FC<PinPadProps> = ({ onComplete, isSetup = false, onCancel, error }) => {
  const [pin, setPin] = useState('');
  
  const handleNumber = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
           onComplete(newPin);
           if (!isSetup) setPin(''); // Reset if checking
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-marker rounded-2xl flex items-center justify-center mx-auto mb-4 text-ink shadow-lg">
           <LockKey size={32} weight="fill" />
        </div>
        <h3 className="text-xl font-bold text-ink dark:text-paper">
          {isSetup ? "Create Access PIN" : "Quick Access"}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {isSetup ? "Set a 4-digit PIN for quick login on this device." : "Enter your 4-digit PIN to unlock."}
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full transition-colors duration-200 ${
              i < pin.length 
                ? 'bg-marker' 
                : 'bg-gray-200 dark:bg-gray-700'
            } ${error ? 'bg-alert animate-shake' : ''}`}
          />
        ))}
      </div>
      
      {error && <div className="text-alert text-sm font-medium mb-4">{error}</div>}

      <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => handleNumber(num)}
            className="w-16 h-16 rounded-full text-2xl font-semibold bg-gray-100 dark:bg-gray-800 text-ink dark:text-paper hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        
        <div className="flex items-center justify-center">
          {onCancel && (
             <button onClick={onCancel} className="text-sm text-gray-500 font-medium">
               Cancel
             </button>
          )}
        </div>
        
        <button
            onClick={() => handleNumber(0)}
            className="w-16 h-16 rounded-full text-2xl font-semibold bg-gray-100 dark:bg-gray-800 text-ink dark:text-paper hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
          >
            0
        </button>

        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full text-xl flex items-center justify-center text-ink dark:text-paper hover:text-alert transition-colors"
        >
          <Backspace size={28} />
        </button>
      </div>
    </div>
  );
};

export default PinPad;
