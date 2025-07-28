"use client";

import React, { useState, useEffect } from "react";
import { motion, useAnimation, type Variants } from "framer-motion";
import { cn } from '@/lib/utils';

const ease = [0.16, 1, 0.3, 1] as const;

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface HeroBadgeProps {
  href?: string;
  text: string;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  showCountdown?: boolean;
  targetDate?: Date;
}

const badgeVariants: Record<string, string> = {
  default: "bg-black/40 hover:bg-black/50 backdrop-blur-md",
  outline: "border-2 bg-black/30 hover:bg-black/40 backdrop-blur-md",
  ghost: "bg-black/20 hover:bg-black/30 backdrop-blur-md",
};

const sizeVariants: Record<string, string> = {
  sm: "px-3 py-1 text-xs gap-1.5",
  md: "px-4 py-1.5 text-sm gap-2",
  lg: "px-5 py-2 text-base gap-2.5",
};

const iconAnimationVariants: Variants = {
  initial: { rotate: 0 },
  hover: { rotate: -10 },
};

export function HeroBadge({
  href,
  text,
  icon,
  endIcon,
  variant = "default",
  size = "md",
  className,
  onClick,
  showCountdown = false,
  targetDate,
}: HeroBadgeProps) {
  const controls = useAnimation();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!showCountdown || !targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately to avoid initial delay
    calculateTimeLeft();

    // Set up interval for updates
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [showCountdown, targetDate]);

  const BadgeWrapper = href ? "a" : motion.button;
  const wrapperProps = href ? { href, target: "_blank", rel: "noopener noreferrer" } : { onClick };

  const baseClassName = cn(
    "inline-flex items-center rounded-full border border-white/10 text-white transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
    badgeVariants[variant],
    sizeVariants[size],
    className
  );

  return (
    <BadgeWrapper
      {...wrapperProps}
      className={cn("group", href && "cursor-pointer")}
    >
      <motion.div
        className={baseClassName}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        onHoverStart={() => controls.start("hover")}
        onHoverEnd={() => controls.start("initial")}
        whileHover={{ 
          boxShadow: "0 5px 14px rgba(0,0,0,0.2)",
          transition: { duration: 0.2 }
        }}
      >
        {icon && (
          <motion.div
            className="text-white/60 pl-3 transition-colors group-hover:text-white"
            variants={iconAnimationVariants}
            initial="initial"
            animate={controls}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            {icon}
          </motion.div>
        )}
        {showCountdown && targetDate && (
          <div className="pl-3 flex items-center gap-1 text-white/80">
            <div className="text-xs font-mono flex items-center gap-1">
              {timeLeft.days > 0 && (
                <span className="text-white font-semibold">{timeLeft.days}d</span>
              )}
              <span className="text-white font-semibold">{timeLeft.hours}h</span>
              <span className="text-white font-semibold">{timeLeft.minutes}m</span>
              <span className="text-white font-semibold">{timeLeft.seconds}s</span>
            </div>
          </div>
        )}
        <span className="pl-3 text-xs md:text-sm">{text}</span>
        {endIcon && (
          <motion.div className="text-white/60 pr-3 group-hover:text-white">
            {endIcon}
          </motion.div>
        )}
      </motion.div>
    </BadgeWrapper>
  );
}

// Export the component as AnimatedShinyText for backward compatibility
export const AnimatedShinyText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};