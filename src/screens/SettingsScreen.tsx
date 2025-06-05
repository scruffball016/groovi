"use client"

import React from "react"
import { ScrollView, StyleSheet } from "react-native"
import { Card, Title, List, Switch, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false)
  const [locationEnabled, setLocationEnabled] = React.useState(true)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>App Settings</Title>
          </Card.Content>

          <List.Item
            title="Push Notifications"
            description="Get notified about new events"
            right={() => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          <Divider />

          <List.Item
            title="Location Services"
            description="Allow location access for local events"
            right={() => <Switch value={locationEnabled} onValueChange={setLocationEnabled} />}
          />
          <Divider />

          <List.Item
            title="About Groovi"
            description="Version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
})
