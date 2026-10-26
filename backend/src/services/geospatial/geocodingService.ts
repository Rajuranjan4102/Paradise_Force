import { GeocodingResult, LocationProvenance } from '../ai/types';

interface BiharLocationEntry {
  name: string;
  aliases: string[];
  district: string;
  latitude: number;
  longitude: number;
  type: 'LOCALITY' | 'LANDMARK' | 'DISTRICT';
}

const BIHAR_GEO_DIRECTORY: BiharLocationEntry[] = [
  // Patna Localities & Landmarks
  { name: 'Bailey Road', aliases: ['bailey rd', 'beli road', 'nehru path'], district: 'Patna Central', latitude: 25.6105, longitude: 85.1182, type: 'LOCALITY' },
  { name: 'Kankarbagh', aliases: ['kankar bagh', 'kankerbagh'], district: 'Patna Central', latitude: 25.5921, longitude: 85.1554, type: 'LOCALITY' },
  { name: 'Boring Road', aliases: ['boring rd', 'boring cannal road'], district: 'Patna Central', latitude: 25.6189, longitude: 85.1165, type: 'LOCALITY' },
  { name: 'Gandhi Maidan', aliases: ['gandhi ground', 'maidan'], district: 'Patna Central', latitude: 25.6178, longitude: 85.1456, type: 'LANDMARK' },
  { name: 'Rajendra Nagar', aliases: ['rajendra nagar terminal', 'rn nagar'], district: 'Patna Central', latitude: 25.5991, longitude: 85.1612, type: 'LOCALITY' },
  { name: 'Dak Bunglow Chauraha', aliases: ['dak bunglow', 'dak bangla'], district: 'Patna Central', latitude: 25.6094, longitude: 85.1378, type: 'LANDMARK' },
  { name: 'Fraser Road', aliases: ['frazer road', 'frazer rd'], district: 'Patna Central', latitude: 25.6122, longitude: 85.1394, type: 'LOCALITY' },
  { name: 'Patliputra Colony', aliases: ['patliputra', 'patliputra industrial'], district: 'Patna Central', latitude: 25.6312, longitude: 85.1078, type: 'LOCALITY' },
  { name: 'Saguna More', aliases: ['saguna mor', 'danapur saguna'], district: 'Patna Central', latitude: 25.6201, longitude: 85.0512, type: 'LANDMARK' },
  { name: 'Danapur Cantonment', aliases: ['danapur', 'dinapur'], district: 'Patna Central', latitude: 25.6334, longitude: 85.0441, type: 'LOCALITY' },
  { name: 'Ashok Rajpath', aliases: ['ashok raj path', 'pmch road'], district: 'Patna Central', latitude: 25.6208, longitude: 85.1689, type: 'LOCALITY' },
  { name: 'Anisabad', aliases: ['anisabad golambar'], district: 'Patna Central', latitude: 25.5789, longitude: 85.1012, type: 'LOCALITY' },

  // Bihar District Centroids
  { name: 'Patna', aliases: ['patna district', 'patna city'], district: 'Patna Central', latitude: 25.5941, longitude: 85.1376, type: 'DISTRICT' },
  { name: 'Gaya', aliases: ['gaya city', 'bodhgaya'], district: 'Gaya City', latitude: 24.7955, longitude: 85.0002, type: 'DISTRICT' },
  { name: 'Muzaffarpur', aliases: ['muzaffarpur town'], district: 'Muzaffarpur Town', latitude: 26.1209, longitude: 85.3647, type: 'DISTRICT' },
  { name: 'Bhagalpur', aliases: ['bhagalpur city', 'silk city'], district: 'Bhagalpur City', latitude: 25.2425, longitude: 86.9842, type: 'DISTRICT' },
  { name: 'Darbhanga', aliases: ['darbhanga city'], district: 'Darbhanga City', latitude: 26.1542, longitude: 85.8918, type: 'DISTRICT' },
  { name: 'Purnia', aliases: ['purnea'], district: 'Purnia', latitude: 25.7771, longitude: 87.4753, type: 'DISTRICT' },
  { name: 'Begusarai', aliases: ['begusarai town'], district: 'Begusarai', latitude: 25.4182, longitude: 86.1272, type: 'DISTRICT' },
  { name: 'Nalanda', aliases: ['bihar sharif', 'biharsharif'], district: 'Nalanda', latitude: 25.1983, longitude: 85.5149, type: 'DISTRICT' },
];

export class GeocodingService {
  /**
   * Resolves coordinates with explicit provenance and confidence.
   * If location is uncertain/missing, returns UNRESOLVED with null coordinates.
   */
  public resolveLocation(
    text: string,
    providedDistrict?: string,
    providedLocality?: string,
    rawLat?: number,
    rawLng?: number
  ): GeocodingResult {
    // 1. If valid explicit GPS coordinates are provided
    if (
      typeof rawLat === 'number' &&
      typeof rawLng === 'number' &&
      rawLat >= 24.0 && rawLat <= 28.0 && // Valid Bihar latitude bounds
      rawLng >= 83.0 && rawLng <= 89.0 && // Valid Bihar longitude bounds
      (rawLat !== 0 || rawLng !== 0)
    ) {
      return {
        latitude: rawLat,
        longitude: rawLng,
        locality: providedLocality || 'GPS Verified Pin',
        district: providedDistrict || 'Patna Central',
        provenance: 'GPS_EXACT',
        confidence: 0.98,
        isResolved: true,
        notes: 'Citizen submitted high-precision GPS device coordinates.',
      };
    }

    const searchableText = `${providedLocality || ''} ${providedDistrict || ''} ${text}`.toLowerCase();

    // 2. Match against known Locality / Landmark Directory
    for (const entry of BIHAR_GEO_DIRECTORY) {
      if (entry.type !== 'DISTRICT') {
        const matchesName = searchableText.includes(entry.name.toLowerCase());
        const matchesAlias = entry.aliases.some(a => searchableText.includes(a.toLowerCase()));

        if (matchesName || matchesAlias) {
          return {
            latitude: entry.latitude,
            longitude: entry.longitude,
            locality: entry.name,
            district: entry.district,
            provenance: entry.type === 'LANDMARK' ? 'GEOCODED_ADDRESS' : 'LOCALITY_CENTROID',
            confidence: 0.90,
            matchedName: entry.name,
            isResolved: true,
            notes: `Resolved to known civic locality: ${entry.name} in ${entry.district}`,
          };
        }
      }
    }

    // 3. Fallback to District Centroid if district is explicitly mentioned
    for (const entry of BIHAR_GEO_DIRECTORY) {
      if (entry.type === 'DISTRICT') {
        const matchesName = searchableText.includes(entry.name.toLowerCase());
        const matchesAlias = entry.aliases.some(a => searchableText.includes(a.toLowerCase()));

        if (matchesName || matchesAlias) {
          return {
            latitude: entry.latitude,
            longitude: entry.longitude,
            locality: `${entry.name} Urban Center`,
            district: entry.district,
            provenance: 'DISTRICT_CENTROID',
            confidence: 0.65,
            matchedName: entry.name,
            isResolved: true,
            notes: `High-level district centroid match. Specific ward or street was not provided.`,
          };
        }
      }
    }

    // 4. Missing / Uncertain Location: DO NOT invent coordinates!
    return {
      latitude: null,
      longitude: null,
      locality: providedLocality || 'Unknown Locality',
      district: providedDistrict || 'Unassigned District',
      provenance: 'UNRESOLVED',
      confidence: 0.10,
      isResolved: false,
      notes: 'No identifiable Bihar geographic coordinates or landmarks detected in complaint text.',
    };
  }
}

export const geocodingService = new GeocodingService();
