import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../utils/api';

// Quick location presets for Mumbai
const QUICK_LOCATIONS = [
  { name: 'Andheri East', lat: 19.1188, lng: 72.8913 },
  { name: 'BKC', lat: 19.0661, lng: 72.8354 },
  { name: 'Bandra', lat: 19.0634, lng: 72.8350 },
  { name: 'Powai', lat: 19.1249, lng: 72.9077 },
  { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
  { name: 'Juhu', lat: 19.0990, lng: 72.8267 },
];

export default function ExplorerScreen() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoords, setFromCoords] = useState<any>(null);
  const [toCoords, setToCoords] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickSelect = (type: 'from' | 'to', location: any) => {
    const coords = { latitude: location.lat, longitude: location.lng };
    if (type === 'from') {
      setFrom(location.name);
      setFromCoords(coords);
    } else {
      setTo(location.name);
      setToCoords(coords);
    }
  };

  const handleSearch = async () => {
    if (!fromCoords || !toCoords) {
      Alert.alert('Missing Locations', 'Please select both From and To locations');
      return;
    }

    router.push({
      pathname: '/surge-radar',
      params: {
        originLat: fromCoords.latitude,
        originLng: fromCoords.longitude,
        destLat: toCoords.latitude,
        destLng: toCoords.longitude,
        routeName: `${from} → ${to}`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>Find the best time for any route</Text>

        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#FF6B35" />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={from}
              onChangeText={setFrom}
            />
          </View>

          <View style={styles.quickLocations}>
            {QUICK_LOCATIONS.map((loc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickButton}
                onPress={() => handleQuickSelect('from', loc)}
              >
                <Text style={styles.quickButtonText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#10B981" />
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              value={to}
              onChangeText={setTo}
            />
          </View>

          <View style={styles.quickLocations}>
            {QUICK_LOCATIONS.map((loc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickButton}
                onPress={() => handleQuickSelect('to', loc)}
              >
                <Text style={styles.quickButtonText}>{loc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!fromCoords || !toCoords) && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!fromCoords || !toCoords}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>View Surge Radar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 24,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  quickLocations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
