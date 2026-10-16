import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

/** Short native-driver entrance transition. No timers, native module, or network required. */
export function Reveal({ children, delay = 0, distance = 14, style }: {
  children: ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 430, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [opacity, translateY, delay, distance]);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** Subtle press spring; preserves the original Pressable props and behaviour. */
export function SpringPressable({ children, style, onPressIn, onPressOut, ...rest }: PressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (toValue: number) => {
    Animated.spring(scale, { toValue, speed: 35, bounciness: 5, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable {...rest} style={style} onPressIn={(event) => { spring(0.977); onPressIn?.(event); }}
        onPressOut={(event) => { spring(1); onPressOut?.(event); }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
