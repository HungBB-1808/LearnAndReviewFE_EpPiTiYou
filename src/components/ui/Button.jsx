import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export const Button = ({ children, className, variant = "primary", size = "default", ...props }) => {
  
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-full transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-primary-dim text-black shadow-[0_10px_20px_rgba(133,173,255,0.3)] hover:shadow-[0_15px_30px_rgba(133,173,255,0.5)]",
    error: "bg-gradient-to-r from-error to-error-dim shadow-[0_10px_20px_rgba(255,110,132,0.3)] text-white hover:shadow-[0_15px_30px_rgba(255,110,132,0.5)]",
    glass: "bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-md",
    ghost: "text-white/50 hover:text-white bg-white/5 hover:bg-white/10",
  }
  
  const sizes = {
    icon: "p-2 w-10 h-10",
    default: "py-4 px-8",
    full: "w-full py-4",
  }

  return (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
    >
        {children}
    </motion.button>
  )
}
