"use client";
import React, { useState, useEffect, useRef } from "react";


interface HoverBorderGradientProps extends React.PropsWithChildren {
  as?: React.ElementType;
  gradientColors?: string[];
  duration?: number;
  containerClassName?: string;
  className?: string;
  [key: string]: any;
}

export function HoverBorderGradient({
  children,
  as: Component = "button",
  gradientColors = ["#f8c889", "#fbc57d", "#00f0ff", "#0080ff", "#f8c889"],
  duration = 3,
  containerClassName = "",
  className = "",
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (hovered) {
      intervalRef.current = setInterval(() => {
        setDirection((prev) => (prev + 1) % 360);
      }, (duration * 1000) / 360);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hovered, duration]);

  const gradientStyle = {
    background: `conic-gradient(from ${direction}deg, ${gradientColors.join(", ")})`,
  };

  return (
    <Component
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-flex rounded-full overflow-hidden p-[2px] transition-all duration-300 ${containerClassName}`}
      {...props}
    >
      {/* Gradient border layer — visible on hover */}
      <div
        className={`absolute inset-0 rounded-[inherit] transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
        style={gradientStyle}
      />
      {/* Static subtle border — visible when not hovered */}
      <div
        className={`absolute inset-0 rounded-[inherit] transition-opacity duration-500 ${hovered ? "opacity-0" : "opacity-100"}`}
        style={{ background: "rgba(248,200,137,0.4)" }}
      />
      {/* Inner content */}
      <div className={`relative z-10 rounded-[inherit] bg-gradient-to-b from-[#f8c889] via-[#fbc57d] to-[#fec375] ${className}`}>    
        {children}
      </div>
    </Component>
  );
}

export default HoverBorderGradient;
