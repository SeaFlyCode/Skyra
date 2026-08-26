import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 650;

const STARS = [
  { top: '18%', left: '22%', size: 3 },
  { top: '28%', left: '78%', size: 2 },
  { top: '14%', left: '58%', size: 2 },
  { top: '62%', left: '16%', size: 2 },
  { top: '70%', left: '82%', size: 3 },
  { top: '78%', left: '54%', size: 2 },
  { top: '38%', left: '12%', size: 2 },
  { top: '46%', left: '88%', size: 2 },
  { top: '84%', left: '30%', size: 3 },
  { top: '10%', left: '38%', size: 2 },
  { top: '56%', left: '70%', size: 2 },
  { top: '32%', left: '46%', size: 2 },
] as const;

const exitKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  25: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1.08 }],
    easing: Easing.out(Easing.quad),
  },
});

const orbKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 0.6 }],
    opacity: 0,
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(0.7),
  },
});

const haloKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '360deg' }],
  },
});

const titleKeyframe = new Keyframe({
  0: {
    transform: [{ translateY: 10 }],
    opacity: 0,
  },
  100: {
    transform: [{ translateY: 0 }],
    opacity: 1,
    easing: Easing.out(Easing.cubic),
  },
});

const starKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.3 }],
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.out(Easing.quad),
  },
});

function SkyraMark() {
  return (
    <View style={styles.mark}>
      {STARS.map((star, index) => (
        <Animated.View
          key={`${star.top}-${star.left}`}
          entering={starKeyframe.duration(400).delay(index * 60)}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
            },
          ]}
        />
      ))}

      <Animated.View entering={haloKeyframe.duration(50 * 1000)} style={styles.halo} />

      <Animated.View entering={orbKeyframe.duration(DURATION)} style={styles.orb}>
        <View style={styles.orbShade} />
      </Animated.View>

      <Animated.Text
        entering={titleKeyframe.duration(DURATION).delay(200)}
        style={styles.title}>
        SKYRA
      </Animated.Text>
    </View>
  );
}

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const content = <SkyraMark />;

  return animate ? (
    <Animated.View
      entering={exitKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#050912',
    experimental_backgroundImage:
      'radial-gradient(120% 90% at 50% 30%, #101A2E 0%, #050912 55%, #020509 100%)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  mark: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#EAF2FF',
  },
  halo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    experimental_backgroundImage:
      'linear-gradient(135deg, rgba(122,168,255,0.4) 0%, rgba(122,168,255,0) 45%, rgba(255,214,150,0.35) 100%)',
  },
  orb: {
    width: 92,
    height: 92,
    borderRadius: 46,
    experimental_backgroundImage: 'linear-gradient(155deg, #FFF6E4 0%, #F3D9A3 45%, #C9A466 100%)',
    marginBottom: 28,
    overflow: 'hidden',
  },
  orbShade: {
    position: 'absolute',
    top: -20,
    right: -28,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#050912',
    opacity: 0.55,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 6,
    color: '#EAF2FF',
  },
});
