import React from 'react';
import { motion } from 'framer-motion';

const Splash: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 bg-indigo-600 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1.2, y: 0 }}
        exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          opacity: { duration: 0.8 } 
        }}
        className="text-center"
      >
        <h1 className="text-white font-black text-7xl tracking-[0.2em] drop-shadow-lg">JUST</h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.5 }}
          className="text-indigo-200 mt-4 text-sm tracking-widest uppercase font-medium"
        >
          Study & Growth
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Splash;