import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';

export interface Location {
  _id: string;
  userId: string;
  label: string;
  type: 'HOME' | 'OFFICE' | 'CUSTOM';
  address: string;
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface CreateLocationData {
  label: string;
  type: 'HOME' | 'OFFICE' | 'CUSTOM';
  address: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch all locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();

      const response = await axios.get(`${API_URL}/api/v1/locations`, { headers });
      setLocations(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch locations';
      setError(errorMsg);
      console.error('Fetch locations error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new location
  const createLocation = async (data: CreateLocationData): Promise<Location | null> => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();

      const response = await axios.post(`${API_URL}/api/v1/locations`, data, { headers });
      setLocations(prev => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create location';
      setError(errorMsg);
      console.error('Create location error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a location
  const updateLocation = async (id: string, data: Partial<CreateLocationData>): Promise<Location | null> => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();

      const response = await axios.put(`${API_URL}/api/v1/locations/${id}`, data, { headers });
      setLocations(prev => prev.map(loc => loc._id === id ? response.data : loc));
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update location';
      setError(errorMsg);
      console.error('Update location error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a location
  const deleteLocation = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();

      await axios.delete(`${API_URL}/api/v1/locations/${id}`, { headers });
      setLocations(prev => prev.filter(loc => loc._id !== id));
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete location';
      setError(errorMsg);
      console.error('Delete location error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get primary locations
  const getPrimaryHome = useCallback(() => {
    return locations.find(loc => loc.type === 'HOME' && loc.isPrimary);
  }, [locations]);

  const getPrimaryOffice = useCallback(() => {
    return locations.find(loc => loc.type === 'OFFICE' && loc.isPrimary);
  }, [locations]);

  // Load locations on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    getPrimaryHome,
    getPrimaryOffice,
  };
};

export default useLocations;
