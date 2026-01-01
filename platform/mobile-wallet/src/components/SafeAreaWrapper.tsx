import { Platform, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

interface SafeAreaWrapperProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cross-platform SafeAreaView wrapper
 */
export function SafeAreaWrapper({ children, style }: SafeAreaWrapperProps) {
  if (Platform.OS === "web") {
    return <View style={[styles.webContainer, style]}>{children}</View>;
  }
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    paddingTop: 0,
  },
});
