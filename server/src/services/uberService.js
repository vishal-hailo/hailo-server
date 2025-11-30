import dotenv from 'dotenv';
dotenv.config();

const UBER_MOCK = process.env.UBER_MOCK === 'true';

// Mumbai test coordinates
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate realistic Mumbai pricing based on distance
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

// MOCK: Get Uber estimate
export async function getEstimate(origin, destination) {
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
    // Real Uber API call (to be implemented when user provides token)
    throw new Error('Real Uber API not configured. Set UBER_SERVER_TOKEN in .env');
  }
}

// MOCK: Get Surge Radar (30-minute window pricing)
export async function getSurgeRadar(origin, destination, durationMinutes = 30) {
  if (UBER_MOCK) {
    const buckets = [];
    const baseEstimate = await getEstimate(origin, destination);
    const basePrice = (baseEstimate.priceMin + baseEstimate.priceMax) / 2;
    
    // Generate 30-minute forecast with realistic surge patterns
    const intervals = [0, 5, 10, 15, 20, 25, 30];
    let lowestPrice = Infinity;
    let bestBucket = null;
    
    for (let i = 0; i < intervals.length; i++) {
      const timeOffset = intervals[i];
      const surgeVariation = Math.sin((timeOffset / 30) * Math.PI) * 0.3; // Surge wave pattern
      const randomNoise = (Math.random() - 0.5) * 0.1;
      const multiplier = 1 + surgeVariation + randomNoise;
      const estimate = Math.round(basePrice * multiplier);
      
      let color = 'green';
      let label = timeOffset === 0 ? 'NOW' : `+${timeOffset}min`;
      
      if (multiplier > 1.2) color = 'red';
      else if (multiplier > 1.1) color = 'orange';
      else if (multiplier > 1.05) color = 'yellow';
      
      const bucket = {
        timeOffsetMin: timeOffset,
        estimate,
        multiplier: multiplier.toFixed(2),
        color,
        label
      };
      
      buckets.push(bucket);
      
      if (estimate < lowestPrice) {
        lowestPrice = estimate;
        bestBucket = bucket;
      }
    }
    
    return {
      buckets,
      bestBucket,
      basePrice: Math.round(basePrice),
      potentialSaving: Math.round(basePrice - lowestPrice),
      isMock: true
    };
  } else {
    // Real Uber API call (to be implemented)
    throw new Error('Real Uber API not configured. Set UBER_SERVER_TOKEN in .env');
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
