"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";

interface ButtonProps {
    variant?: "primary" | "secondary" | "outline";
    className?: string;
    href?: string;
    onClick?: () => void;
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    className,
    href,
    onClick,
    children,
}: ButtonProps) {
    const baseStyles =
        "inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200 focus:ring-white",
        secondary: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-800",
        outline: "border border-white/20 text-white hover:bg-white/10 focus:ring-white",
    };

    const combinedClassName = clsx(baseStyles, variants[variant], className);

    if (href) {
        return (
            <Link href={href} className={combinedClassName}>
                {children}
            </Link>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={combinedClassName}
            onClick={onClick}
        >
            {children}
        </motion.button>
    );
}
