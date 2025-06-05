"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Linking } from "react-native"
import { Card, Title, Paragraph, Button, List, Divider } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function PlaylistScreen() {
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null)
  const [playlistHistory, setPlaylistHistory] = useState<any[]>([])

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    try {
      const current = await AsyncStorage.getItem("groovi-current-playlist")
      const history = await AsyncStorage.getItem("groovi-playlist-history")

      if (current) {
        setCurrentPlaylist(JSON.parse(current))
      }

      if (history) {
        setPlaylistHistory(JSON.parse(history))
      }
    } catch (error) {
      console.error("Error loading playlists:", error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {currentPlaylist ? (
          <Card style={styles.card}>
            <Card.Content>
              <Title>🎵 Current Playlist</Title>
              <Paragraph style={styles.playlistName}>{currentPlaylist.name}</Paragraph>
              <Paragraph>{currentPlaylist.trackCount} tracks</Paragraph>
              <Paragraph>
                Created from {currentPlaylist.events?.length || 0} events in {currentPlaylist.location?.city}
              </Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => Linking.openURL(currentPlaylist.external_urls.spotify)}>
                Open in Spotify
              </Button>
            </Card.Actions>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Title>No Current Playlist</Title>
              <Paragraph>Generate a playlist from the Dashboard to see it here.</Paragraph>
            </Card.Content>
          </Card>
        )}

        {playlistHistory.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Playlist History</Title>
            </Card.Content>
            {playlistHistory.map((playlist, index) => (
              <View key={index}>
                <List.Item
                  title={playlist.name}
                  description={`${playlist.trackCount} tracks • ${new Date(playlist.createdAt).toLocaleDateString()}`}
                  left={(props) => <List.Icon {...props} icon="queue-music" />}
                  right={(props) => <List.Icon {...props} icon="open-in-new" />}
                  onPress={() => Linking.openURL(playlist.external_urls.spotify)}
                />
                {index < playlistHistory.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        )}
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
  playlistName: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 16,
  },
})
