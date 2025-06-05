import { ScrollView, StyleSheet } from "react-native"
import { Card, Title, Paragraph } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"

export default function VenuesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content style={styles.emptyState}>
            <Title>Local Venues</Title>
            <Paragraph>Venue information will be displayed here.</Paragraph>
          </Card.Content>
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
  emptyState: {
    alignItems: "center",
    padding: 16,
  },
})
