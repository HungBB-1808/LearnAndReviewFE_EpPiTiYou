import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const GlassCard = ({ className, children, onClick, disabled, ...props }) => {
  return (
    <motion.div
        whileHover={disabled ? {} : { scale: 1.02, y: -5 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={disabled ? undefined : onClick}
        className={cn(
            "glass-card rounded-xl",
            disabled ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer",
            className
        )}
        {...props}
    >
        {children}
    </motion.div>
  )
}

export const GlassPanel = ({ className, children, ...props }) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn("glass-panel", className)}
        {...props}
    >
        {children}
    </motion.div>
  )
}
