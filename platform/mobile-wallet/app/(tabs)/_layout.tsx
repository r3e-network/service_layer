import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function TabsLayout() {
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00d4aa",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1a1a1a",
          height: isWeb ? 50 : 60,
          paddingBottom: isWeb ? 0 : 8,
        },
        headerShown: isWeb,
        headerStyle: {
          backgroundColor: "#0a0a0a",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "600",
        },
        sceneStyle: {
          backgroundColor: "#0a0a0a",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: "Browser",
          tabBarIcon: ({ color, size }) => <Ionicons name="globe" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="miniapps"
        options={{
          title: "MiniApps",
          tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
