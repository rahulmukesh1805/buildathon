/**
 * CivicFix AI — Transparent Municipal Intelligence & Triage Engine
 * Provides explainable category classification, priority suggestions, 
 * and geo-spatial duplicate detection.
 */

// Keyword dictionaries for transparent category heuristic classification
const CATEGORY_RULES = {
  electrical_hazard: {
    label: 'Electrical Hazard',
    keywords: ['wire', 'cable', 'spark', 'electric', 'voltage', 'shock', 'pole', 'transformer', 'hanging', 'short circuit', 'current', 'power line', 'downed'],
    weight: 1.2
  },
  burst_water_pipe: {
    label: 'Burst Water Pipe',
    keywords: ['water', 'pipe', 'burst', 'gush', 'flood', 'leak', 'main', 'conduit', 'hydrant', 'puddle', 'pressure', 'aqueduct', 'overflowing pipe'],
    weight: 1.1
  },
  open_manhole: {
    label: 'Open Manhole / Pit',
    keywords: ['manhole', 'cover', 'drain', 'sewer cover', 'pit', 'shaft', 'chamber', 'missing lid', 'grate', 'open hole', 'storm drain', 'uncovered'],
    weight: 1.2
  },
  pothole: {
    label: 'Pothole / Road Damage',
    keywords: ['pothole', 'road', 'asphalt', 'crater', 'tarmac', 'pavement', 'crack', 'tire', 'swerving', 'street surface', 'cavity'],
    weight: 1.0
  },
  sanitation_issue: {
    label: 'Sanitation / Waste Issue',
    keywords: ['garbage', 'trash', 'waste', 'smell', 'stench', 'odor', 'refuse', 'dump', 'litter', 'bin', 'debris', 'drainage blocked', 'overflowing bin'],
    weight: 1.0
  }
};

// High-risk contextual amplifiers for priority calculation
const HIGH_RISK_TERMS = ['school', 'hospital', 'child', 'children', 'sparking', 'live wire', 'deep', 'fatal', 'accident', 'injury', 'highway', 'metro', 'emergency', 'fall', 'blind turn', 'high voltage'];
const MODERATE_RISK_TERMS = ['bus route', 'market', 'pedestrian', 'commute', 'traffic', 'vehicle damage', 'crowded', 'sidewalk', 'curb'];

/**
 * Suggests category based on title and description text.
 */
export function classifyHazardCategory(text) {
  if (!text || text.trim().length === 0) {
    return { category: null, confidence: 0, reason: 'Insufficient text for classification' };
  }

  const clean = text.toLowerCase();
  let bestCategory = null;
  let maxScore = 0;
  const matchDetails = {};

  for (const [catKey, rule] of Object.entries(CATEGORY_RULES)) {
    let hits = 0;
    const hitWords = [];
    for (const kw of rule.keywords) {
      if (clean.includes(kw)) {
        hits++;
        hitWords.push(kw);
      }
    }
    const score = hits * rule.weight;
    matchDetails[catKey] = { hits, hitWords, score };
    if (score > maxScore) {
      maxScore = score;
      bestCategory = catKey;
    }
  }

  if (maxScore === 0) {
    return {
      category: 'other',
      confidence: 40,
      reason: 'No distinctive keywords matched municipal hazard profiles. Categorized as General / Other.'
    };
  }

  const confidence = Math.min(98, Math.round(55 + (maxScore * 10)));
  const matchedWords = matchDetails[bestCategory].hitWords.join(', ');

  return {
    category: bestCategory,
    confidence,
    reason: `Identified key hazard markers: "${matchedWords}". Strongly corresponds to ${CATEGORY_RULES[bestCategory].label}.`
  };
}

/**
 * Evaluates priority based on category, contextual risks, and human safety exposure.
 */
export function assessHazardPriority(category, text = '', landmark = '') {
  const combinedText = `${text} ${landmark}`.toLowerCase();
  
  let highRiskMatches = [];
  HIGH_RISK_TERMS.forEach(term => {
    if (combinedText.includes(term)) highRiskMatches.push(term);
  });

  let moderateMatches = [];
  MODERATE_RISK_TERMS.forEach(term => {
    if (combinedText.includes(term)) moderateMatches.push(term);
  });

  // Base priority from category risk inherent to life safety
  if (category === 'electrical_hazard' || category === 'open_manhole') {
    return {
      suggestedSeverity: 'critical',
      reason: `Immediate life-safety hazard inherent to ${category === 'electrical_hazard' ? 'live electrical current' : 'subterranean fall void'}.${
        highRiskMatches.length > 0 ? ` Amplified by proximity to [${highRiskMatches.join(', ')}].` : ''
      }`,
      humanOverrideNeeded: true
    };
  }

  if (category === 'burst_water_pipe' && (highRiskMatches.length > 0 || combinedText.includes('flood') || combinedText.includes('gush'))) {
    return {
      suggestedSeverity: 'critical',
      reason: 'Active flooding / high-volume conduit burst impacting roadway infrastructure and utility pressure.',
      humanOverrideNeeded: true
    };
  }

  if (highRiskMatches.length > 0) {
    return {
      suggestedSeverity: 'critical',
      reason: `Elevated to Critical due to sensitive public proximity tags: [${highRiskMatches.join(', ')}].`,
      humanOverrideNeeded: true
    };
  }

  if (category === 'pothole' || category === 'burst_water_pipe' || moderateMatches.length > 0) {
    return {
      suggestedSeverity: 'medium',
      reason: `Moderate severity: Disruption to transit or municipal infrastructure.${
        moderateMatches.length > 0 ? ` Context cues: [${moderateMatches.join(', ')}].` : ''
      }`,
      humanOverrideNeeded: true
    };
  }

  return {
    suggestedSeverity: 'low',
    reason: 'Standard routine municipal issue with no immediate life-safety or structural compromise detected.',
    humanOverrideNeeded: true
  };
}

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates.
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Flags possible duplicate incidents based on category, location, and recent active reports.
 */
export function detectDuplicates(newReport, existingIncidents = []) {
  if (!existingIncidents || existingIncidents.length === 0) {
    return { isDuplicate: false };
  }

  const { latitude, longitude, category, title = '', description = '' } = newReport;
  const activeIncidents = existingIncidents.filter(
    inc => inc.status !== 'resolved' && inc.status !== 'rejected'
  );

  for (const existing of activeIncidents) {
    // 1. Check distance if both have coordinates
    const distanceMeters = haversineDistanceMeters(
      latitude,
      longitude,
      existing.latitude,
      existing.longitude
    );

    // If within 250 meters and identical category -> High probability duplicate
    if (distanceMeters <= 350 && existing.category === category) {
      return {
        isDuplicate: true,
        matchedIncident: existing,
        distanceMeters,
        confidence: 88,
        reason: `Potential duplicate: Incident #${existing.tracking_token} ("${existing.title}") is currently active just ${distanceMeters}m away under the same category (${CATEGORY_RULES[category]?.label || category}).`
      };
    }

    // 2. Textual overlap check
    const newWords = new Set(`${title} ${description}`.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const existWords = new Set(`${existing.title} ${existing.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    let commonCount = 0;
    newWords.forEach(w => {
      if (existWords.has(w)) commonCount++;
    });

    if (commonCount >= 4 && existing.category === category) {
      return {
        isDuplicate: true,
        matchedIncident: existing,
        distanceMeters: isFinite(distanceMeters) ? distanceMeters : null,
        confidence: 76,
        reason: `High textual similarity (${commonCount} matching diagnostic terms) with active report #${existing.tracking_token}.`
      };
    }
  }

  return { isDuplicate: false };
}
