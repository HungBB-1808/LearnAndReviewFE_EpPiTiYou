import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TextMorph = ({ text, className = "" }) => {
    // Generate an array of characters with unique keys. 
    // If the text changes entirely, we still want layout animations 
    // to track identical characters smoothly, so we base keys on the char and its index.
    const characters = text.split('');

    return (
        <div className={`flex flex-nowrap items-baseline ${className}`}>
            <AnimatePresence mode="popLayout">
                {characters.map((char, index) => {
                    // Spaces must be replaced with a non-breaking space 
                    // so the width transition calculates accurately instead of collapsing.
                    const displayChar = char === ' ' ? '\u00A0' : char;

                    return (
                        <motion.span
                            key={`${char}-${index}`}
                            layout
                            initial={{ width: 0, opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ width: "auto", opacity: 1, y: 0, scale: 1 }}
                            exit={{ width: 0, opacity: 0, y: -20, scale: 0.5 }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                                mass: 0.8,
                                opacity: { duration: 0.2 }
                            }}
                            className="inline-block overflow-hidden whitespace-pre"
                        >
                            {displayChar}
                        </motion.span>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
