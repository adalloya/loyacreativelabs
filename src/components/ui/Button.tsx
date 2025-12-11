"use client";

import clsx from "clsx";
import { HTMLMotionProps, motion } from "framer-motion";
import Link from "next/link";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    className?: string;
    href?: string;
    target?: string;
    rel?: string;
}

export function Button({
    variant = "primary",
    className,
    href,
    target,
    rel,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200 focus:ring-white",
        secondary: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-800",
        outline: "border border-white/20 text-white hover:bg-white/10 focus:ring-white",
        ghost: "hover:bg-white/10 text-white",
    };

    const combinedClassName = clsx(baseStyles, variants[variant], className);

    if (href) {
        if (target === "_blank") {
            return (
                <a href={href} target={target} rel={rel || "noopener noreferrer"} className={combinedClassName}>
                    {children}
                </a>
            );
        }
        return (
            <Link href={href} className={combinedClassName}>
                {children}
            </Link>
        );
    }

    // Cast props to any to avoid conflict between HTML attributes and Motion props for now, 
    // or simply use a standard button if motion props aren't strictly needed.
    // For safety and type correctness, we'll wrap the motion button logic.

    const motionProps = props as HTMLMotionProps<"button">;

    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            className={combinedClassName}
            disabled={disabled}
            {...motionProps}
        >
            {children}
        </motion.button>
    );
}
