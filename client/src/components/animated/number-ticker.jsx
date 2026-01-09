import { useEffect, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function NumberTicker({ value, duration = 2, className = "" }) {
    const ref = useRef(null);
    const motionValue = useSpring(0, { duration: duration * 1000 });
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));

    useEffect(() => {
        motionValue.set(value);
    }, [motionValue, value]);

    return (
        <motion.span ref={ref} className={className}>
            {rounded}
        </motion.span>
    );
}
