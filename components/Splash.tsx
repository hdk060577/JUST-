import React from 'react';
import { motion } from 'framer-motion';

const Splash: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-indigo-600 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1.5, y: 0 }}
        exit={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="text-white font-bold text-6xl tracking-widest"
      >
        JUST
      </motion.div>
    </div>
  );
};

export default Splash;
