import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";

const AudioIndicator = ({ isPlaying }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.timing(animation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();

      return () => loop.stop(); // cleanup
    } else {
      animation.stopAnimation();
      animation.setValue(0);
    }
  }, [isPlaying]);

  const bars = Array.from({ length: 18 });

  return (
    <View style={styles.container}>
      {bars.map((_, i) => {
        const phase = (i * Math.PI) / 6;
        const scaleY = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            0.4 + Math.abs(Math.sin(phase)) * 1.2,
            1.4 + Math.abs(Math.cos(phase)) * 1.2,
            0.4 + Math.abs(Math.sin(phase)) * 1.2,
          ],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                transform: [{ scaleY: isPlaying ? scaleY : 0.4 }],
                opacity: isPlaying ? 0.9 : 0.4,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default AudioIndicator;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 25, // reduced height of the overall container
  },
  bar: {
    width: 3, // slimmer bars
    height: 12, // smaller bar height
    marginHorizontal: 1.5,
    backgroundColor: "#ae57ff",
    borderRadius: 2,
  },
});
