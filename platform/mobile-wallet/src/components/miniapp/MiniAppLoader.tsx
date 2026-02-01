/**
 * MiniApp Loading Screen
 * Beautiful animated loading screen for MiniApp initialization
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import type { MiniAppInfo } from "@/types/miniapp";

interface MiniAppLoaderProps {
  app: MiniAppInfo;
}

const LOADING_MESSAGES = [
  "Initializing secure sandbox...",
  "Injecting verified SDK...",
  "Connecting to RPC nodes...",
  "Optimizing performance...",
  "App container ready.",
];

export function MiniAppLoader({ app }: MiniAppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(1));

  useEffect(() => {
    // Progress animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    // Message cycling
    const timer = setInterval(() => {
      setMsgIndex((i) => (i < LOADING_MESSAGES.length - 1 ? i + 1 : i));
    }, 800);

    // Icon pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();

    return () => clearInterval(timer);
  }, [progress, scale]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* Background Grid */}
      <View style={styles.gridOverlay} />

      {/* Main Card */}
      <View style={styles.card}>
        {/* Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }] }]}>
          <Text style={styles.icon}>{app.icon || "🧩"}</Text>
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={styles.subtitle}>Verified Sandbox • v1.0.0</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Status Message */}
        <Text style={styles.statusMessage}>{LOADING_MESSAGES[msgIndex]}</Text>
      </View>

      {/* Security Tags */}
      <View style={styles.securityTags}>
        <Text style={styles.securityText}>🔒 Isolated Environment</Text>
        <Text style={styles.securityText}>⚡ Direct RPC Access</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    maxWidth: 320,
    width: "90%",
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 24,
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#00E599",
    borderRadius: 2,
  },
  statusMessage: {
    fontSize: 11,
    color: "rgba(0, 229, 153, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "monospace",
  },
  securityTags: {
    position: "absolute",
    bottom: 48,
    flexDirection: "row",
    gap: 24,
  },
  securityText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.3)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
