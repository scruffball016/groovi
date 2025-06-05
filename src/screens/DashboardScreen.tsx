"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, RefreshControl, Alert, Linking } from "react-native"
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  FAB,
  Portal,
  Modal,
  List,
  Divider,
} from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Location from "expo-location"

import { LocationService } from "../services/LocationService"
import { TicketmasterService } from "../services/TicketmasterService"
import { SpotifyService } from "../services/SpotifyService"

interface Event {
  id: string
  artistName: string
  venueName: string
  date: string
  time?: string
  city: string
  state: string
  genre?: string
  price?: string
  ticketUrl?: string
  imageUrl?: string
}

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export default function DashboardScreen() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null)

  // Filter states
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedVenues, setSelectedVenues] = useState<string[]>([])

  useEffect(() => {
    loadSavedData()
    requestLocationPermission()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, selectedGenres, selectedVenues])

  const loadSavedData = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("groovi-location")
      const savedPlaylist = await AsyncStorage.getItem("groovi-current-playlist")

      if (savedLocation) {
        setLocation(JSON.parse(savedLocation))
      }

      if (savedPlaylist) {
        setCurrentPlaylist(JSON.parse(savedPlaylist))
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        detectLocation()
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  const detectLocation = async () => {
    try {
      setLoading(true)
      const locationData = await LocationService.getCurrentLocation()
      if (locationData) {
        setLocation(locationData)
        await AsyncStorage.setItem("groovi-location", JSON.stringify(locationData))
        searchEvents(locationData)
      }
    } catch (error) {
      Alert.alert("Location Error", "Could not detect your location. Please set it manually.")
    } finally {
      setLoading(false)
    }
  }

  const searchEvents = async (locationData?: LocationData) => {
    const searchLocation = locationData || location
    if (!searchLocation) {
      Alert.alert("Location Required", "Please set your location first.")
      return
    }

    try {
      setLoading(true)
      const eventData = await TicketmasterService.searchEvents({
        city: searchLocation.city,
        stateCode: searchLocation.state,
        radius: 25,
        daysAhead: 7,
      })

      setEvents(eventData)
    } catch (error) {
      Alert.alert("Search Error", "Could not load events. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.artistName.toLowerCase().includes(query) ||
          event.venueName.toLowerCase().includes(query) ||
          event.genre?.toLowerCase().includes(query),
      )
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter((event) => event.genre && selectedGenres.includes(event.genre))
    }

    if (selectedVenues.length > 0) {
      filtered = filtered.filter((event) => selectedVenues.includes(event.venueName))
    }

    setFilteredEvents(filtered)
  }

  const generatePlaylist = async () => {
    if (filteredEvents.length === 0) {
      Alert.alert("No Events", "No events found to create playlist from.")
      return
    }

    try {
      setLoading(true)
      const artists = filteredEvents.map((event) => event.artistName)
      const playlist = await SpotifyService.createPlaylist({
        name: `${location?.city} Live Music - ${new Date().toLocaleDateString()}`,
        description: `Featuring ${filteredEvents.length} artists playing live in ${location?.city}`,
        artists,
      })

      setCurrentPlaylist(playlist)
      await AsyncStorage.setItem("groovi-current-playlist", JSON.stringify(playlist))

      Alert.alert("Playlist Created!", `"${playlist.name}" with ${playlist.trackCount} tracks`, [
        { text: "OK" },
        {
          text: "Open in Spotify",
          onPress: () => Linking.openURL(playlist.external_urls.spotify),
        },
      ])
    } catch (error) {
      Alert.alert("Error", "Could not create playlist. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await searchEvents()
    setRefreshing(false)
  }

  const uniqueGenres = [...new Set(events.map((event) => event.genre).filter(Boolean))]
  const uniqueVenues = [...new Set(events.map((event) => event.venueName))]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Location Card */}
        {location && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>📍 Current Location</Title>
              <Paragraph>
                {location.city}, {location.state}
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Current Playlist Card */}
        {currentPlaylist && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>🎵 Current Playlist</Title>
              <Paragraph>{currentPlaylist.name}</Paragraph>
              <Paragraph>{currentPlaylist.trackCount} tracks</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => Linking.openURL(currentPlaylist.external_urls.spotify)}>
                Open in Spotify
              </Button>
            </Card.Actions>
          </Card>
        )}

        {/* Stats Cards */}
        {events.length > 0 && (
          <View style={styles.statsContainer}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Title style={styles.statNumber}>{events.length}</Title>
                <Paragraph>Total Events</Paragraph>
              </Card.Content>
            </Card>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Title style={styles.statNumber}>{filteredEvents.length}</Title>
                <Paragraph>Filtered</Paragraph>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Search Bar */}
        <Searchbar
          placeholder="Search events, artists, venues..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Filter Chips */}
        {(selectedGenres.length > 0 || selectedVenues.length > 0) && (
          <View style={styles.chipContainer}>
            {selectedGenres.map((genre) => (
              <Chip
                key={genre}
                onClose={() => setSelectedGenres((prev) => prev.filter((g) => g !== genre))}
                style={styles.chip}
              >
                {genre}
              </Chip>
            ))}
            {selectedVenues.map((venue) => (
              <Chip
                key={venue}
                onClose={() => setSelectedVenues((prev) => prev.filter((v) => v !== venue))}
                style={styles.chip}
              >
                {venue.length > 20 ? venue.substring(0, 20) + "..." : venue}
              </Chip>
            ))}
          </View>
        )}

        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Paragraph style={styles.loadingText}>Loading events...</Paragraph>
          </View>
        ) : filteredEvents.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.emptyState}>
              <Title>No Events Found</Title>
              <Paragraph>
                {location
                  ? "No upcoming shows found in your area. Try adjusting your filters."
                  : "Please set your location to search for events."}
              </Paragraph>
              {!location && (
                <Button mode="contained" onPress={detectLocation} style={styles.button}>
                  Detect Location
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          filteredEvents.map((event, index) => (
            <Card key={`${event.id}-${index}`} style={styles.eventCard}>
              <Card.Content>
                <Title>{event.artistName}</Title>
                <Paragraph>📍 {event.venueName}</Paragraph>
                <Paragraph>📅 {new Date(event.date).toLocaleDateString()}</Paragraph>
                {event.time && <Paragraph>🕐 {event.time}</Paragraph>}
                {event.genre && <Chip style={styles.genreChip}>{event.genre}</Chip>}
                {event.price && <Chip style={styles.priceChip}>{event.price}</Chip>}
              </Card.Content>
              {event.ticketUrl && (
                <Card.Actions>
                  <Button mode="outlined" onPress={() => Linking.openURL(event.ticketUrl!)}>
                    Buy Tickets
                  </Button>
                </Card.Actions>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Generate Playlist FAB */}
      {filteredEvents.length > 0 && (
        <FAB
          style={styles.fab}
          icon="playlist-plus"
          label="Generate Playlist"
          onPress={generatePlaylist}
          disabled={loading}
        />
      )}

      {/* Filter Modal */}
      <Portal>
        <Modal visible={showFilters} onDismiss={() => setShowFilters(false)} contentContainerStyle={styles.modal}>
          <Title>Filter Events</Title>

          <List.Section>
            <List.Subheader>Genres</List.Subheader>
            {uniqueGenres.map((genre) => (
              <List.Item
                key={genre}
                title={genre}
                left={() => (
                  <List.Icon icon={selectedGenres.includes(genre) ? "checkbox-marked" : "checkbox-blank-outline"} />
                )}
                onPress={() => {
                  setSelectedGenres((prev) =>
                    prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
                  )
                }}
              />
            ))}
          </List.Section>

          <Divider />

          <List.Section>
            <List.Subheader>Venues</List.Subheader>
            {uniqueVenues.slice(0, 10).map((venue) => (
              <List.Item
                key={venue}
                title={venue.length > 30 ? venue.substring(0, 30) + "..." : venue}
                left={() => (
                  <List.Icon icon={selectedVenues.includes(venue) ? "checkbox-marked" : "checkbox-blank-outline"} />
                )}
                onPress={() => {
                  setSelectedVenues((prev) =>
                    prev.includes(venue) ? prev.filter((v) => v !== venue) : [...prev, venue],
                  )
                }}
              />
            ))}
          </List.Section>

          <Button mode="contained" onPress={() => setShowFilters(false)}>
            Apply Filters
          </Button>
        </Modal>
      </Portal>

      {/* Filter FAB */}
      <FAB style={styles.filterFab} small icon="filter" onPress={() => setShowFilters(true)} />
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
  },
  searchBar: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    margin: 4,
  },
  eventCard: {
    marginBottom: 12,
    elevation: 1,
  },
  genreChip: {
    marginTop: 8,
    marginRight: 8,
    backgroundColor: "#E5F3FF",
  },
  priceChip: {
    marginTop: 8,
    backgroundColor: "#E8F5E8",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 16,
  },
  button: {
    marginTop: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#10B981",
  },
  filterFab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: "#059669",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
})
