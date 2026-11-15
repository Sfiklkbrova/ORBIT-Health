// ============================================================================
// NASA DONKI SPACE WEATHER SERVICE
// Real-time space weather telemetry from official NASA API (api.nasa.gov)
// Tracks: Solar Flares (FLR), Coronal Mass Ejections (CME), Geomagnetic Storms (GST), Solar Particle Events (SEP)
// Caches to offline SQLite database for autonomous deep-space operations
// ============================================================================

import { NasaDonkiEvent } from '../../types/nasa';
import { getCachedDonkiEvents, insertCachedDonkiEvent, updateNasaSyncRegistry, getNasaSyncStatus } from '../nasaDb';

const DONKI_NOTIFICATIONS_ENDPOINT = 'https://api.nasa.gov/DONKI/notifications';
const DONKI_FLR_ENDPOINT = 'https://api.nasa.gov/DONKI/FLR';

// NASA API Key: stored in environment variables, never hardcoded
const NASA_API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY || 'DEMO_KEY';

export interface DonkiQueryResult {
  success: boolean;
  events: NasaDonkiEvent[];
  activeAlertCount: number;
  source: 'LIVE_API' | 'LOCAL_OFFLINE_CACHE';
  lastSuccessfulUpdate: string;
  errorMessage?: string;
}

/**
 * Connects to NASA DONKI API to fetch real live solar activity and space weather.
 * In accordance with flight medicine safety guidelines, interplanetary space weather
 * is strictly categorized as ambient heliospheric hazard, not direct internal cabin dose.
 */
export async function fetchNasaDonkiSpaceWeather(): Promise<DonkiQueryResult> {
  const timestamp = new Date().toISOString();

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const startStr = thirtyDaysAgo.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    const url = `${DONKI_NOTIFICATIONS_ENDPOINT}?startDate=${startStr}&endDate=${endStr}&type=all&api_key=${NASA_API_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ORBIT-Health-NASA-SpaceApps/2026',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NASA DONKI API returned HTTP ${response.status}`);
    }

    const notifs: any[] = await response.json();
    const parsedEvents: NasaDonkiEvent[] = [];

    if (Array.isArray(notifs) && notifs.length > 0) {
      for (const n of notifs.slice(0, 15)) {
        const msgType = sanitizeMessageType(n.messageType);
        const classification = extractClassification(n.messageType, n.messageBody || '');
        const significance = evaluateCrewSignificance(msgType, classification);
        const guidance = generateOperationalGuidance(msgType, significance);

        const event: NasaDonkiEvent = {
          messageId: n.messageID || `donki_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          messageType: msgType,
          issueTime: n.messageIssueTime || timestamp,
          summary: cleanSummary(n.messageBody || ''),
          classification,
          significanceToCrew: significance,
          operationalGuidance: guidance,
          rawMessageSnippet: (n.messageBody || '').substring(0, 200),
          sourceUrl: n.messageURL || 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
        };

        await insertCachedDonkiEvent(event);
        parsedEvents.push(event);
      }
    }

    // If notifications returned 0, try fetching recent FLR directly
    if (parsedEvents.length === 0) {
      const flrUrl = `${DONKI_FLR_ENDPOINT}?startDate=${startStr}&endDate=${endStr}&api_key=${NASA_API_KEY}`;
      const flrRes = await fetch(flrUrl, { headers: { Accept: 'application/json' } });
      if (flrRes.ok) {
        const flrs: any[] = await flrRes.json();
        for (const fl of (flrs || []).slice(0, 5)) {
          const classType = fl.classType || 'M1.0';
          const significance = classType.startsWith('X') ? 'CRITICAL' : classType.startsWith('M') ? 'WARNING' : 'ADVISORY';
          const event: NasaDonkiEvent = {
            messageId: fl.flrID || `FLR_${Date.now()}`,
            messageType: 'FLR',
            issueTime: fl.peakTime || fl.beginTime || timestamp,
            summary: `Solar Flare Class ${classType} detected from Active Region ${fl.activeRegionNum || 'Interplanetary'}. Peak flux timestamp recorded.`,
            classification: classType,
            significanceToCrew: significance,
            operationalGuidance: generateOperationalGuidance('FLR', significance),
            rawMessageSnippet: JSON.stringify(fl).substring(0, 200),
            sourceUrl: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
          };
          await insertCachedDonkiEvent(event);
          parsedEvents.push(event);
        }
      }
    }

    const activeAlertCount = parsedEvents.filter(
      (e) => e.significanceToCrew === 'WARNING' || e.significanceToCrew === 'CRITICAL'
    ).length;

    await updateNasaSyncRegistry('donki', 'ONLINE', parsedEvents.length, null);

    return {
      success: true,
      events: parsedEvents,
      activeAlertCount,
      source: 'LIVE_API',
      lastSuccessfulUpdate: timestamp,
    };
  } catch (err: any) {
    console.log('DONKI live fetch offline or error, falling back to local SQLite cache:', err.message);

    const cached = await getCachedDonkiEvents(10);
    const syncStatus = await getNasaSyncStatus('donki');

    const activeCount = cached.filter(
      (e) => e.significanceToCrew === 'WARNING' || e.significanceToCrew === 'CRITICAL'
    ).length;

    await updateNasaSyncRegistry('donki', 'OFFLINE_CACHED', cached.length, err.message);

    return {
      success: true,
      events: cached,
      activeAlertCount: activeCount,
      source: 'LOCAL_OFFLINE_CACHE',
      lastSuccessfulUpdate: syncStatus?.lastSuccessfulSync || timestamp,
      errorMessage: err.message,
    };
  }
}

function sanitizeMessageType(raw: string): NasaDonkiEvent['messageType'] {
  const u = (raw || '').toUpperCase();
  if (u.includes('FLR')) return 'FLR';
  if (u.includes('CME')) return 'CME';
  if (u.includes('SEP')) return 'SEP';
  if (u.includes('GST')) return 'GST';
  if (u.includes('RBE')) return 'RBE';
  return 'OTHER';
}

function extractClassification(type: string, body: string): string | undefined {
  const flrMatch = body.match(/([XMC]\d+(\.\d+)?)/i);
  if (flrMatch) return flrMatch[1].toUpperCase();

  const kpMatch = body.match(/Kp\s*=\s*(\d+)/i);
  if (kpMatch) return `Kp ${kpMatch[1]}`;

  const cmeMatch = body.match(/(\d{3,4})\s*km\/s/i);
  if (cmeMatch) return `${cmeMatch[1]} km/s`;

  return undefined;
}

function evaluateCrewSignificance(
  type: NasaDonkiEvent['messageType'],
  classification?: string
): NasaDonkiEvent['significanceToCrew'] {
  if (type === 'FLR') {
    if (classification?.startsWith('X')) return 'CRITICAL';
    if (classification?.startsWith('M')) return 'WARNING';
    return 'ADVISORY';
  }
  if (type === 'SEP') return 'CRITICAL';
  if (type === 'CME' && classification && parseInt(classification, 10) > 1000) return 'WARNING';
  if (type === 'RBE') return 'ADVISORY';
  return 'NOMINAL';
}

function generateOperationalGuidance(
  type: NasaDonkiEvent['messageType'],
  sig: NasaDonkiEvent['significanceToCrew']
): string {
  if (sig === 'CRITICAL') {
    return 'CRITICAL SPACE WEATHER: Impending or active Solar Particle Event. Stand by for Flight Director shelter-in-place instructions in shielded core modules. Discontinue exterior spacewalks.';
  }
  if (sig === 'WARNING') {
    return 'SPACE WEATHER ADVISORY: Elevated solar activity detected. Monitor onboard active dosimeters for secondary flux increases during orbital high-inclination segments.';
  }
  if (type === 'RBE') {
    return 'MAGNETOSPHERIC ENHANCEMENT: Relativistic electron flux elevated in outer radiation belts. Nominal for habitat; monitor module hull sensors.';
  }
  return 'NOMINAL SPACE WEATHER: Background interplanetary condition stable. Proceed with nominal flight timeline.';
}

function cleanSummary(body: string): string {
  const cleaned = body
    .replace(/##[^\n]+/g, '')
    .replace(/http[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(' ') || 'NASA Space Weather Event registered.';
}
