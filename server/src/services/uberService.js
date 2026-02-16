import dotenv from 'dotenv';
import axios from 'axios';
import User from '../models/User.js';
import { uberTokenService } from './uberTokenService.js';

dotenv.config();

const UBER_MOCK = process.env.UBER_MOCK === 'true';
// If UBER_SANDBOX is true, use sandbox API
const UBER_SANDBOX = process.env.UBER_SANDBOX === 'true';
const UBER_API_URL = UBER_SANDBOX
  ? 'https://sandbox-api.uber.com/v1.2'
  : 'https://api.uber.com/v1.2';

// Mumbai test coordinates (keep for fallback/mock)
const MUMBAI_LOCATIONS = {
  andheriEast: { lat: 19.1188, lng: 72.8913, name: 'Andheri East' },
  bkc: { lat: 19.0661, lng: 72.8354, name: 'BKC' },
  bandra: { lat: 19.0634, lng: 72.8350, name: 'Bandra' },
  powai: { lat: 19.1249, lng: 72.9077, name: 'Powai' }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate realistic Mumbai pricing based on distance (Mock Fallback)
function generateMumbaiPricing(distanceKm, timeOfDay) {
  const baseRate = 12; // ₹12 per km base
  const peakMultiplier = timeOfDay >= 8 && timeOfDay <= 10 || timeOfDay >= 17 && timeOfDay <= 20 ? 1.3 : 1.0;
  const surgeMultiplier = Math.random() > 0.7 ? 1.2 : 1.0;

  const baseFare = 30;
  const distanceFare = distanceKm * baseRate * peakMultiplier * surgeMultiplier;
  const minPrice = Math.round(baseFare + distanceFare * 0.9);
  const maxPrice = Math.round(baseFare + distanceFare * 1.1);

  return { minPrice, maxPrice, surgePercent: (surgeMultiplier - 1) * 100 };
}

// Get Uber estimate
// NOTE: Now uses Server Token, so `userId` param is deprecated/unused for generic estimates
export async function getEstimate(origin, destination, userId = null) {
  if (UBER_MOCK) {
    // Mock realistic Mumbai data
    const distance = calculateDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );

    const currentHour = new Date().getHours();
    const { minPrice, maxPrice, surgePercent } = generateMumbaiPricing(distance, currentHour);
    const etaMinutes = Math.round(distance / 0.4) + Math.floor(Math.random() * 5); // ~24 km/h avg Mumbai speed

    return {
      product: 'UberGo',
      etaMinutes,
      priceMin: minPrice,
      priceMax: maxPrice,
      currency: 'INR',
      distance: distance.toFixed(1),
      surgePercent,
      isMock: true
    };
  } else {
    // Real Uber API call (Server-Side Token)
    try {
      const token = await uberTokenService.getServerToken();

      const response = await axios.get(`${UBER_API_URL}/estimates/price`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': 'en_IN',
          'Content-Type': 'application/json'
        },
        params: {
          start_latitude: origin.latitude,
          start_longitude: origin.longitude,
          end_latitude: destination.latitude,
          end_longitude: destination.longitude
        }
      });

      // Transform Uber response to our format
      const prices = response.data.prices;

      // Filter for standard products (UberGo, UberX, Uber Auto)
      // Logic: Try to find 'Uber Go' first, else take the cheapest.

      // Note: Uber Sandbox might return empty prices if not configured, or specific products.
      if (!prices || prices.length === 0) {
        throw new Error('No Uber products available in this region (or Sandbox empty).');
      }

      const uberGo = prices.find(p => p.display_name === 'Uber Go' || p.display_name === 'UberGo') || prices[0];

      return {
        product: uberGo.display_name,
        etaMinutes: Math.round(uberGo.duration / 60),
        priceMin: uberGo.low_estimate || uberGo.estimate,
        priceMax: uberGo.high_estimate || uberGo.estimate,
        currency: uberGo.currency_code,
        distance: uberGo.distance,
        surgePercent: uberGo.surge_multiplier > 1 ? (uberGo.surge_multiplier - 1) * 100 : 0,
        isMock: false,
        isSandbox: UBER_SANDBOX
      };

    } catch (error) {
      console.error('Uber API Error:', error.response?.data || error.message);
      throw new Error(`Uber API Failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Get Surge Radar (30-minute window pricing)
export async function getSurgeRadar(origin, destination, userId = null) {
  // Real API doesn't support future estimates. We will use the current real estimate
  // and project it for future slots based on typical curve, OR just return current data.
  // Ideally, calling this multiple times in a loop is bad.
  // We will call it ONCE for 'NOW', and then apply a heuristic for future slots 
  // to simulate the "Forecast" feature until we have a predictive model.

  try {
    const currentEstimate = await getEstimate(origin, destination, userId);

    // Create buckets based on the real current price
    // Note: If estimate is a string "100-120", we need to parse it if we want to do math.
    // Uber API usually returns numbers for low_estimate/high_estimate, but sometimes 'estimate' is a string.

    let minP = currentEstimate.priceMin;
    let maxP = currentEstimate.priceMax;

    // Safety check for non-numeric estimates (e.g. "Metered")
    if (typeof minP !== 'number') minP = 100; // fallback
    if (typeof maxP !== 'number') maxP = 100;

    const basePrice = (minP + maxP) / 2;
    const buckets = [];
    const intervals = [0, 5, 10, 15, 20, 25, 30];
    let lowestPrice = Infinity;
    let bestBucket = null;

    for (let i = 0; i < intervals.length; i++) {
      const timeOffset = intervals[i];

      let multiplier = 1.0;
      // Simple heuristic: if surge is high (>1.2x), assume it might drop.
      // If surge is low (1.0x), assume it stays flat or slight fluctuation.
      const currentSurgeMult = 1 + (currentEstimate.surgePercent / 100);

      if (i === 0) {
        multiplier = 1.0; // Exact current price
      } else {
        // Basic simulation: Random small fluctuation around current price
        // If surge is high, tend to decrease.
        if (currentSurgeMult > 1.2) {
          multiplier = 1.0 - (0.05 * (i / 5)); // Drop 5% every 5 mins step roughly
          if (multiplier < 0.8) multiplier = 0.8;
        } else {
          // Random noise +/- 5%
          const noise = (Math.random() - 0.4) * 0.1;
          multiplier = 1.0 + noise;
        }
      }

      const projectedEstimate = Math.round(basePrice * multiplier);

      // Colors
      let color = 'green';
      // If real price is surging, mark red/orange
      if (currentSurgeMult * multiplier > 1.5) color = 'red';
      else if (currentSurgeMult * multiplier > 1.2) color = 'orange';

      const label = timeOffset === 0 ? 'NOW' : `+${timeOffset}min`;

      const bucket = {
        timeOffsetMin: timeOffset,
        estimate: projectedEstimate,
        multiplier: (currentSurgeMult * multiplier).toFixed(2),
        color,
        label
      };

      buckets.push(bucket);

      if (projectedEstimate < lowestPrice) {
        lowestPrice = projectedEstimate;
        bestBucket = bucket;
      }
    }

    return {
      buckets,
      bestBucket,
      basePrice: Math.round(basePrice),
      potentialSaving: Math.round(basePrice - lowestPrice),
      isMock: currentEstimate.isMock,
      isSandbox: currentEstimate.isSandbox
    };

  } catch (error) {
    // If real API fails (e.g. not linked), specific error handling needed
    throw error;
  }
}

// Generate Uber deep link (ALWAYS works - no API keys needed)
export function generateDeepLink(origin, destination) {
  const pickupLat = origin.latitude;
  const pickupLng = origin.longitude;
  const dropoffLat = destination.latitude;
  const dropoffLng = destination.longitude;

  // Uber deep link format
  const deepLink = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}`;

  return deepLink;
}
