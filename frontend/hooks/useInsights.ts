import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface InsightsStats {
  totalRides: number;
  totalDistance: number;
  totalSaved: number;
  totalSpent: number;
  avgPricePerRide: number;
  timeSaved: number;
  rating: number;
}

export interface SavingsBreakdown {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export interface TopRoute {
  id: number;
  from: string;
  to: string;
  rides: number;
  saved: number;
}

export interface Recommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InsightsSummary {
  stats: InsightsStats;
  savingsBreakdown: SavingsBreakdown[];
  topRoutes: TopRoute[];
}

export const useInsights = () => {
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch insights summary
  const fetchSummary = useCallback(async (): Promise<InsightsSummary | null> => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();
      
      const response = await axios.get(`${API_URL}/api/v1/insights/summary`, { headers });
      setSummary(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch insights';
      setError(errorMsg);
      console.error('Fetch insights error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async (): Promise<Recommendation[]> => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();
      
      const response = await axios.get(`${API_URL}/api/v1/insights/recommendations`, { headers });
      setRecommendations(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch recommendations';
      setError(errorMsg);
      console.error('Fetch recommendations error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all insights data
  const fetchAllInsights = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchRecommendations()]);
  }, [fetchSummary, fetchRecommendations]);

  return {
    summary,
    recommendations,
    loading,
    error,
    fetchSummary,
    fetchRecommendations,
    fetchAllInsights,
  };
};

export default useInsights;
