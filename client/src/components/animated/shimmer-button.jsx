import { motion } from "framer-motion";
import { cn } from "../../lib/utils.js";

export default function ShimmerButton({ children, className = "", ...props }) {
    return (
        <motion.button
            className={cn(
                "group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl",
                className
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            <motion.div
                className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "linear",
                }}
            />
        </motion.button>
    );
}
