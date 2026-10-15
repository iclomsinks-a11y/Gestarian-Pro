import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // 3 seconds intro
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="relative flex flex-col items-end">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            // Font weight: 100 mobile, 200 tablet, 300 desktop
            className="text-white text-4xl md:text-6xl lg:text-8xl tracking-[0.1em] font-[100] md:font-[200] lg:font-[300] m-0 leading-none"
          >
            GESTARIAN
          </motion.h1>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
            // Double font weight: 200 mobile, 400 tablet, 600 desktop
            className="text-gray-400 text-lg md:text-2xl lg:text-4xl font-[200] md:font-[400] lg:font-[600] mt-2 mr-2"
          >
            Pro
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
