import { useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring } from 'motion/react';

export function PlatformTicker({ message }: { message: string }) {
  const phrases = message.split(/\r?\n/).map(phrase => phrase.trim()).filter(Boolean);
  const [hovered, setHovered] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const speed = useSpring(1, { stiffness: 45, damping: 20 });
  useAnimationFrame((_time, delta) => {
    speed.set(hovered ? 0 : 1);
    const width = (track.current?.scrollWidth ?? 0) / 2;
    if (!width) return;
    const next = x.get() - Math.min(delta, 50) * 0.04 * speed.get();
    x.set(next <= -width ? next + width : next);
  });
  return <div className="platform-ticker" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} aria-label={phrases.join('. ')}>
    <motion.div className="platform-ticker-track" ref={track} style={{ x }} aria-hidden="true">
      {[0, 1].map(copy => <div className="platform-ticker-group" key={copy}>{Array.from({ length: 12 }, (_, repetition) => phrases.map((phrase, index) => <span key={`${repetition}-${index}`}>{phrase}<i className="fa-solid fa-user-chef" /></span>))}</div>)}
    </motion.div>
  </div>;
}
