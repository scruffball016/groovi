import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Provider as PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialIcons"

import DashboardScreen from "./src/screens/DashboardScreen"
import PlaylistScreen from "./src/screens/PlaylistScreen"
import VenuesScreen from "./src/screens/VenuesScreen"
import SettingsScreen from "./src/screens/SettingsScreen"
import { theme } from "./src/theme"

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: string

                if (route.name === "Dashboard") {
                  iconName = "dashboard"
                } else if (route.name === "Playlist") {
                  iconName = "queue-music"
                } else if (route.name === "Venues") {
                  iconName = "location-on"
                } else if (route.name === "Settings") {
                  iconName = "settings"
                } else {
                  iconName = "help"
                }

                return <Icon name={iconName} size={size} color={color} />
              },
              tabBarActiveTintColor: "#10B981",
              tabBarInactiveTintColor: "gray",
              headerStyle: {
                backgroundColor: "#10B981",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            })}
          >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Groovi" }} />
            <Tab.Screen name="Playlist" component={PlaylistScreen} options={{ title: "Current Playlist" }} />
            <Tab.Screen name="Venues" component={VenuesScreen} options={{ title: "Local Venues" }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
