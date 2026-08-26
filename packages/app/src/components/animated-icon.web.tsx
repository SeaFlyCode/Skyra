import { useEffect, useState } from 'react';

import classes from './animated-icon.module.css';

const DURATION = 650;
const MIN_VISIBLE = 400;

const STARS = [
  { top: '18%', left: '22%', size: 3, delay: 0 },
  { top: '28%', left: '78%', size: 2, delay: 60 },
  { top: '14%', left: '58%', size: 2, delay: 120 },
  { top: '62%', left: '16%', size: 2, delay: 180 },
  { top: '70%', left: '82%', size: 3, delay: 240 },
  { top: '78%', left: '54%', size: 2, delay: 300 },
  { top: '38%', left: '12%', size: 2, delay: 360 },
  { top: '46%', left: '88%', size: 2, delay: 420 },
  { top: '84%', left: '30%', size: 3, delay: 480 },
  { top: '10%', left: '38%', size: 2, delay: 540 },
  { top: '56%', left: '70%', size: 2, delay: 600 },
  { top: '32%', left: '46%', size: 2, delay: 660 },
] as const;

export function AnimatedSplashOverlay() {
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), MIN_VISIBLE);
    return () => clearTimeout(exitTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const hideTimer = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(hideTimer);
  }, [exiting]);

  if (!visible) return null;

  return (
    <div className={`${classes.overlay} ${exiting ? classes.overlayExiting : ''}`}>
      <SkyraMark />
    </div>
  );
}

function SkyraMark() {
  return (
    <div className={classes.mark}>
      {STARS.map((star) => (
        <div
          key={`${star.top}-${star.left}`}
          className={classes.star}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            ['--delay' as string]: `${star.delay}ms`,
          }}
        />
      ))}

      <div className={classes.halo} />

      <div className={classes.orb}>
        <div className={classes.orbShade} />
      </div>

      <span className={classes.title}>SKYRA</span>
    </div>
  );
}
