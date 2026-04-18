import React from 'react';
import { motion } from 'framer-motion';

/**
 * Converts a hex code to an rgba string.
 */
function hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const LiquidGlassTabs = ({ 
    tabs, 
    activeTab, 
    onTabChange, 
    layoutIdPrefix = "liquid-glass-drop",
    fullWidth = false
}) => {
    // Determine current active tab object to pull dynamic color for text if needed
    const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];

    return (
        <div className={`flex gap-1 p-1 bg-white/5 rounded-full border border-white/5 relative z-0 ${fullWidth ? 'w-full' : ''}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                
                return (
                    <button
                        key={tab.id}
                        onClick={(e) => onTabChange(tab.id, e)}
                        className={`relative px-4 py-2 flex items-center justify-center gap-1.5 rounded-full text-xs font-black transition-all uppercase tracking-wider ${
                            isActive ? 'text-white' : 'text-white/40 hover:text-white'
                        } ${fullWidth ? 'flex-1' : ''}`}
                        title={tab.label}
                    >
                        {/* The Floating Liquid Drop */}
                        {isActive && (
                            <motion.div
                                layoutId={`${layoutIdPrefix}-bubble`}
                                className="absolute inset-0 z-[-1] rounded-full"
                                style={{
                                    backgroundColor: hexToRgba(tab.color, 0.2), // 20% opacity highly diluted watercolor
                                    backdropFilter: "blur(12px) saturate(150%)",
                                    WebkitBackdropFilter: "blur(12px) saturate(150%)",
                                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1), 0 4px 15px rgba(0,0,0,0.1)",
                                    border: "1px solid rgba(255, 255, 255, 0.3)"
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 250,
                                    damping: 20
                                }}
                            />
                        )}

                        {/* Foreground Content */}
                        <span className="relative z-10 flex items-center justify-center gap-1.5 pointer-events-none">
                            {tab.icon && (
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {tab.icon}
                                </span>
                            )}
                            {tab.label && (
                                <span>{tab.label}</span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
