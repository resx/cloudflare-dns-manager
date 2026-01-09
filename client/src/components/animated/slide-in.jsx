import { motion } from "framer-motion";

export default function SlideIn({
    children,
    direction = "left",
    delay = 0,
    duration = 0.5,
    className = ""
}) {
    const directions = {
        left: { x: -100, y: 0 },
        right: { x: 100, y: 0 },
        up: { x: 0, y: -100 },
        down: { x: 0, y: 100 },
    };

    const initial = directions[direction] || directions.left;

    return (
        <motion.div
            initial={{ ...initial, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.25, 0.1, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
