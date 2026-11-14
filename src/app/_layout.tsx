import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GutProvider } from "@/store/GutProvider";
import { colors } from "@/ui/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GutProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: colors.bg },
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textDim,
            tabBarIconStyle: { display: "none" },
            tabBarLabelStyle: { fontSize: 14, fontWeight: "700" },
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Today" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
      </GutProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
