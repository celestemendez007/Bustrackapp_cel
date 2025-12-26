import * as turf from '@turf/turf';
import { pool } from '../db.js';
import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv';

dotenv.config();

const googleMapsClient = new Client({});

/**
 * Service for Advanced Multimodal Trip Planning
 * Priority: STRICTLY MINIMIZE WALKING DISTANCE.
 */
class RouteFinderService {
    constructor() {
        this.WALKING_SPEED_KMH = 4.5; // Conservative walking speed
        this.BUS_SPEED_KMH = 20; // Urban traffic
        this.MAX_WALK_RADIUS_KM = 1.0; // Reduced to 1km to minimize walking as requested
        this.MAX_TOTAL_WALK_KM = 2.5; // Stricter total walking limit
        this.API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

        // Performance Cache
        this.routesCache = null;
        this.lastCacheTime = 0;
        this.CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes
    }

    /**
     * Find optimal routes between Origin and Destination
     * @param {number} latA - Origin Latitude
     * @param {number} lngA - Origin Longitude
     * @param {number} latB - Destination Latitude
     * @param {number} lngB - Destination Longitude
     * @param {string} preference - 'LESS_WALKING' | 'FASTER'
     */
    async findRoutes(latA, lngA, latB, lngB, preference = 'LESS_WALKING') {
        // TURF.JS EXPECTS [LONGITUDE, LATITUDE] - CRITICAL
        const fromPt = turf.point([lngA, latA]);
        const toPt = turf.point([lngB, latB]);

        // 1. Fetch data
        const allRoutes = await this._getAllRoutesWithStops();
        console.log('Buscando ruta para:', latA, lngA, '->', latB, lngB);
        console.log('Rutas encontradas en DB:', allRoutes.length);

        // 2. Initial Spatial Filtering (Turf.js) - "Euclidean Phase"
        // Find candidates using simple straight-line distance to filter out obvious non-matches
        let candidates = [];

        // 2a. Direct Routes
        const directCandidates = this._findDirectRoutes(allRoutes, fromPt, toPt);
        candidates.push(...directCandidates);

        // 2b. Transfer Routes (Only if needed or to find better walking options)
        // We always look for transfers to see if they save walking distance
        const transferCandidates = this._findTransferRoutes(allRoutes, fromPt, toPt);
        candidates.push(...transferCandidates);

        if (candidates.length === 0) {
            return {
                recomendaciones: [],
                debug: "No candidates found within search radius"
            };
        }

        // 3. Pre-rank by Euclidean heuristics to save API calls
        // Sort by estimated walking distance (Euclidean)
        candidates.sort((a, b) => a.heuristic.totalWalkDist - b.heuristic.totalWalkDist);

        // 4. Validation Phase (Google Directions API) - "Real World Phase"
        // Only validate the top candidates to respect API quotas and latency
        const topCandidates = candidates.slice(0, 5);
        const validatedCandidates = await this._validateWithGoogleMaps(topCandidates, latA, lngA, latB, lngB);

        // 5. Final Sort (Global Optimization)
        const sortedResults = this._sortFinalResults(validatedCandidates, preference);

        return {
            recomendaciones: sortedResults.map(r => this._formatOutput(r)),
            metadata: {
                totalCandidates: candidates.length,
                validated: validatedCandidates.length,
                preference
            }
        };
    }

    /**
     * Phase 1a: Find Direct Routes (Geospatial & Stop-based)
     * HYBRID APPROACH: Prioritizes searching on the route geometry itself (Turf.nearestPointOnLine).
     */
    _findDirectRoutes(allRoutes, fromPt, toPt) {
        const candidates = [];

        for (const route of allRoutes) {
            const thresholdMeters = this.MAX_TOTAL_WALK_KM * 1000;
            const hasGeometry = route.geometry && Array.isArray(route.geometry) && route.geometry.length > 2;

            if (hasGeometry) {
                // --- STRATEGY A: PURE GEOSPATIAL (Nearest Point on Line) ---
                // As requested: "No sigas ya lo de las paradas"
                // We rely 100% on the route path.

                try {
                    // Convert route geometry to Turf LineString
                    // Ensure [Lng, Lat] order for Turf
                    const points = route.geometry.map(p => {
                        if (Array.isArray(p)) return [p[1], p[0]];
                        return [p.lng || p.longitud, p.lat || p.latitud];
                    }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));

                    if (points.length > 2) {
                        const line = turf.lineString(points);

                        // Find nearest points on the red line
                        const snappedPickup = turf.nearestPointOnLine(line, fromPt);
                        const snappedDropoff = turf.nearestPointOnLine(line, toPt);

                        // Validate Direction (Index check)
                        if (snappedPickup.properties.index < snappedDropoff.properties.index) {

                            const distOrigin = snappedPickup.properties.dist * 1000;
                            const distDest = snappedDropoff.properties.dist * 1000;
                            const totalWalk = distOrigin + distDest;

                            console.log(`Ruta Geometria: ${route.nombre || route.numero_ruta} | Walk: ${totalWalk.toFixed(0)}m`);

                            if (totalWalk < thresholdMeters) {
                                candidates.push({
                                    type: 'direct',
                                    score: totalWalk,
                                    heuristic: { totalWalkDist: totalWalk },
                                    segments: [{
                                        route: route,
                                        // Virtual Stops (Exact points on the line)
                                        fromStop: {
                                            id: 'virtual-start-' + route.id,
                                            nombre: 'Abordar en Ruta (Punto Óptimo)',
                                            lat: snappedPickup.geometry.coordinates[1], // Turf uses [lng, lat]
                                            lng: snappedPickup.geometry.coordinates[0],
                                            orden: snappedPickup.properties.index,
                                            isVirtual: true
                                        },
                                        toStop: {
                                            id: 'virtual-end-' + route.id,
                                            nombre: 'Bajar en Ruta (Punto Óptimo)',
                                            lat: snappedDropoff.geometry.coordinates[1],
                                            lng: snappedDropoff.geometry.coordinates[0],
                                            orden: snappedDropoff.properties.index,
                                            isVirtual: true
                                        }
                                    }]
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Geospatial search error for route ${route.numero_ruta}:`, e);
                }
            } else {
                // --- STRATEGY B: LEGACY STOP-BASED (Fallback only) ---
                console.warn('Ruta sin geometría (usando fallback paradas):', route.nombre || route.numero_ruta);

                // 1. Get ALL stops within walking radius for Origin and Destination
                const startStops = this._findStopsInRadius(route.stops, fromPt, this.MAX_WALK_RADIUS_KM);
                const endStops = this._findStopsInRadius(route.stops, toPt, this.MAX_WALK_RADIUS_KM);

                if (startStops.length === 0 || endStops.length === 0) continue;

                // 2. Find the best valid pair (Start before End)
                let bestPair = null;
                let minTotalWalk = Infinity;

                for (const start of startStops) {
                    for (const end of endStops) {
                        // Check order: Start must be strictly before End
                        if (start.stop.orden >= end.stop.orden) continue;

                        const totalWalk = start.distance + end.distance;
                        if (totalWalk < minTotalWalk) {
                            minTotalWalk = totalWalk;
                            bestPair = { start, end };
                        }
                    }
                }

                if (bestPair) {
                    candidates.push({
                        type: 'direct',
                        score: minTotalWalk,
                        heuristic: { totalWalkDist: minTotalWalk },
                        segments: [{
                            route: route,
                            fromStop: bestPair.start.stop,
                            toStop: bestPair.end.stop
                        }]
                    });
                }
            }
        }
        return candidates;
    }

    /**
     * Phase 1b: Find Transfer Routes (2 legs)
     * IMPROVED: Uses multiple potential start/end stops.
     */
    _findTransferRoutes(allRoutes, fromPt, toPt) {
        const candidates = [];

        // Find all routes that have STOPS near Origin
        // Map route -> list of valid start stops
        const startState = [];
        for (const r of allRoutes) {
            const stops = this._findStopsInRadius(r.stops, fromPt, this.MAX_WALK_RADIUS_KM);
            if (stops.length > 0) startState.push({ r, stops });
        }

        // Find all routes that have STOPS near Destination
        const endState = [];
        for (const r of allRoutes) {
            const stops = this._findStopsInRadius(r.stops, toPt, this.MAX_WALK_RADIUS_KM);
            if (stops.length > 0) endState.push({ r, stops });
        }

        // Iterate combinations
        for (const start of startState) {
            for (const end of endState) {
                if (start.r.id === end.r.id) continue;

                // Find intersection stops (Hubs)
                const intersections = this._findIntersections(start.r, end.r);

                for (const hub of intersections) {
                    // We need to find a valid StartStop -> HubStopA
                    // And valid HubStopB -> EndStop

                    // 1. Find best StartStop for this leg
                    let bestStart = null;
                    let minStartWalk = Infinity;
                    for (const s of start.stops) {
                        if (s.stop.orden < hub.stopA.orden) { // Valid direction
                            if (s.distance < minStartWalk) {
                                minStartWalk = s.distance;
                                bestStart = s;
                            }
                        }
                    }
                    if (!bestStart) continue; // No valid path to hub

                    // 2. Find best EndStop for this leg
                    let bestEnd = null;
                    let minEndWalk = Infinity;
                    for (const s of end.stops) {
                        if (hub.stopB.orden < s.stop.orden) { // Valid direction
                            if (s.distance < minEndWalk) {
                                minEndWalk = s.distance;
                                bestEnd = s;
                            }
                        }
                    }
                    if (!bestEnd) continue; // No valid path from hub

                    const totalWalk = bestStart.distance + bestEnd.distance;
                    if (totalWalk > this.MAX_TOTAL_WALK_KM) continue;

                    candidates.push({
                        type: 'transfer',
                        score: totalWalk,
                        heuristic: { totalWalkDist: totalWalk },
                        segments: [
                            { route: start.r, fromStop: bestStart.stop, toStop: hub.stopA },
                            { route: end.r, fromStop: hub.stopB, toStop: bestEnd.stop } // Note: bestEnd.stop is the object {stop, distance}
                        ]
                    });
                }
            }
        }
        return candidates;
    }

    /**
     * Phase 2: Validate with Google Maps or OSRM
     */
    async _validateWithGoogleMaps(candidates, latA, lngA, latB, lngB) {
        // Limit to top 5 to respect quotas but process in parallel for speed
        const topCandidates = candidates.slice(0, 5);

        // Process all candidates in parallel
        const results = await Promise.all(topCandidates.map(async (candidate) => {
            try {
                let totalRealWalkMeters = 0;
                let totalTimeSeconds = 0;
                const segments = candidate.segments;

                // Parallelize Walking Segments Requests
                const firstStop = segments[0].fromStop;
                const lastStop = segments[segments.length - 1].toStop;

                const walkPromises = [
                    this._getWalkingStats(latA, lngA, firstStop.lat, firstStop.lng),
                    this._getWalkingStats(lastStop.lat, lastStop.lng, latB, lngB)
                ];

                // If transfer, add transfer walk to promises
                let transferStopA, transferStopB;
                if (segments.length > 1) {
                    transferStopA = segments[0].toStop;
                    transferStopB = segments[1].fromStop;
                    const dist = turf.distance(turf.point([transferStopA.lng, transferStopA.lat]), turf.point([transferStopB.lng, transferStopB.lat]));
                    if (dist > 0.05) {
                        walkPromises.push(this._getWalkingStats(transferStopA.lat, transferStopA.lng, transferStopB.lat, transferStopB.lng));
                    } else {
                        walkPromises.push(Promise.resolve(null)); // No significant walk
                    }
                }

                // Wait for all walks
                const [walk1, walk2, walkTrans] = await Promise.all(walkPromises);

                // Validation
                // Even if Google/OSRM fails (returns null), we should fallback to Euclidean instead of discarding
                // to ensure the user gets SOME result.
                const validWalk1 = walk1 || this._getEuclideanStats(latA, lngA, firstStop.lat, firstStop.lng);
                const validWalk2 = walk2 || this._getEuclideanStats(lastStop.lat, lastStop.lng, latB, lngB);

                // Accumulate Metrics
                // 1. Origin Walk
                totalRealWalkMeters += validWalk1.distance.value;
                totalTimeSeconds += validWalk1.duration.value;
                candidate.walkOrigin = { dist: validWalk1.distance.value, time: validWalk1.duration.value, polyline: validWalk1.polyline };

                // 2. Dest Walk
                totalRealWalkMeters += validWalk2.distance.value;
                totalTimeSeconds += validWalk2.duration.value;
                candidate.walkDest = { dist: validWalk2.distance.value, time: validWalk2.duration.value, polyline: validWalk2.polyline };

                // 3. Transfer Walk
                if (walkTrans) {
                    totalRealWalkMeters += walkTrans.distance.value;
                    totalTimeSeconds += walkTrans.duration.value;
                } else if (walkTrans === undefined && segments.length > 1 && transferStopA && transferStopB) {
                    // Fallback for transfer
                    const eucTrans = this._getEuclideanStats(transferStopA.lat, transferStopA.lng, transferStopB.lat, transferStopB.lng);
                    totalRealWalkMeters += eucTrans.distance.value;
                    totalTimeSeconds += eucTrans.duration.value;
                }

                candidate.metrics = {
                    totalWalkDistMeters: totalRealWalkMeters,
                    totalTimeMinutes: Math.ceil(totalTimeSeconds / 60) + this._estimateBusTime(candidate)
                };
                return candidate;

            } catch (error) {
                console.error("Error validating route:", error);
                return null;
            }
        }));

        return results.filter(c => c !== null);
    }

    _getEuclideanStats(lat1, lng1, lat2, lng2) {
        const distKm = turf.distance(turf.point([lng1, lat1]), turf.point([lng2, lat2]));
        const distMeters = distKm * 1000;
        const durationSeconds = (distKm / this.WALKING_SPEED_KMH) * 3600;
        return {
            distance: { value: distMeters },
            duration: { value: durationSeconds },
            polyline: null // No polyline implies straight line in frontend
        };
    }

    async _getWalkingStats(lat1, lng1, lat2, lng2) {
        // 1. Try Google Maps if Key exists
        if (this.API_KEY) {
            try {
                const response = await googleMapsClient.directions({
                    params: {
                        origin: [lat1, lng1],
                        destination: [lat2, lng2],
                        mode: 'walking',
                        key: this.API_KEY
                    }
                });

                if (response.data.status === 'OK' && response.data.routes.length > 0) {
                    const leg = response.data.routes[0].legs[0];
                    return {
                        distance: leg.distance,
                        duration: leg.duration,
                        polyline: response.data.routes[0].overview_polyline.points
                    };
                }
            } catch (e) {
                console.warn("Google Directions Error (Falling back to OSRM):", e.message);
            }
        }

        // 2. Fallback to OSRM (Open Source Routing Machine)
        // Excellent for "Government/Open Data" style routing
        return this._getOSRMWalkingStats(lat1, lng1, lat2, lng2);
    }

    async _getOSRMWalkingStats(lat1, lng1, lat2, lng2) {
        try {
            // OSRM Public Demo Server (Walking profile)
            // Note: coordinates are lng,lat
            const url = `http://router.project-osrm.org/route/v1/foot/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=polyline`;

            // Fetch with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) return null;

            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                return {
                    distance: { value: route.distance }, // meters
                    duration: { value: route.duration }, // seconds
                    polyline: route.geometry // encoded string (OSRM uses Google's polyline algorithm)
                };
            }
            return null;
        } catch (e) {
            console.warn("OSRM Error:", e.message);
            return null;
        }
    }

    _decodePolyline(encoded) {
        if (!encoded) return [];
        const poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            // Return as {lat, lng} for consistency
            poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
        }
        return poly;
    }

    /**
     * Helpers
     */
    async _getAllRoutesWithStops() {
        // Cache Check
        if (this.routesCache && (Date.now() - this.lastCacheTime < this.CACHE_TTL_MS)) {
            return this.routesCache;
        }

        console.log("Fetching routes from DB...");
        // Helper para comparaciones booleanas según la base de datos
        const useCloud = !!(process.env.DATABASE_URL || process.env.DB_HOST);
        const activaTrue = useCloud ? 'TRUE' : '1';
        const routesQuery = await pool.query(`SELECT * FROM rutas WHERE activa = ${activaTrue}`);
        const logicalRoutes = [];

        for (const r of routesQuery.rows) {
            const stopsQuery = await pool.query(`
                SELECT p.latitud, p.longitud, pr.orden, p.id, p.nombre, pr.direccion 
                FROM paradas p
                JOIN parada_ruta pr ON p.id = pr.id_parada
                WHERE pr.id_ruta = $1
                ORDER BY pr.direccion, pr.orden
            `, [r.id]);

            // Group by direction
            const stopsByDir = {};
            stopsQuery.rows.forEach(s => {
                const dir = s.direccion || 'ida'; // Default to ida if null
                if (!stopsByDir[dir]) stopsByDir[dir] = [];
                stopsByDir[dir].push({
                    ...s,
                    lat: parseFloat(s.latitud),
                    lng: parseFloat(s.longitud)
                });
            });

            // Create logical routes for each direction
            Object.keys(stopsByDir).forEach(dir => {
                const stops = stopsByDir[dir];
                if (stops.length > 0) {
                    
                    // Parse geometry if it's a JSON string (SQLite/Postgres Text)
                    let parsedGeometry = r.geometry;
                    if (typeof r.geometry === 'string') {
                        const trimmed = r.geometry.trim();
                        if (trimmed.startsWith('[')) {
                            // JSON Array
                            try {
                                parsedGeometry = JSON.parse(trimmed);
                            } catch (e) {
                                console.warn(`Error parsing JSON geometry for route ${r.numero_ruta}`, e);
                                parsedGeometry = [];
                            }
                        } else if (trimmed.length > 0) {
                            // Assume Encoded Polyline
                            try {
                                parsedGeometry = this._decodePolyline(trimmed);
                            } catch (e) {
                                console.warn(`Error decoding polyline geometry for route ${r.numero_ruta}`, e);
                                parsedGeometry = [];
                            }
                        }
                    }

                    logicalRoutes.push({
                        ...r,
                        geometry: parsedGeometry, // Ensure it is an object/array
                        // Unique ID for the logical route to prevent cache/key collisions if needed
                        // But keep original ID for reference. 
                        // The finder uses r.id for transfer intersection checks. 
                        // RouteFinder treats different directions as different routes for direct search,
                        // but we must be careful with transfers (switching direction on same route is usually valid at a terminal, but handled by walking).
                        id: r.id, // Keeping same ID used for intersection checks? 
                        // Actually, for _findIntersections, we compare IDs. If we have same ID, we skip.
                        // Ideally we treat Ida and Regreso as different for transfers basically (usually one gets off to switch).
                        // Let's add direction distinction.
                        logicalId: `${r.id}-${dir}`,
                        direction: dir,
                        stops: stops
                    });
                }
            });
        }

        // Update Cache
        this.routesCache = logicalRoutes;
        this.lastCacheTime = Date.now();
        return logicalRoutes;
    }

    _findClosestStop(stops, point) {
        let minD = Infinity;
        let closest = null;
        for (const s of stops) {
            const d = turf.distance(point, turf.point([s.lng, s.lat]));
            if (d < minD) {
                minD = d;
                closest = s;
            }
        }
        return closest ? { stop: closest, distance: minD } : null;
    }

    _findStopsInRadius(stops, point, radiusKm) {
        const found = [];
        for (const s of stops) {
            const d = turf.distance(point, turf.point([s.lng, s.lat]));
            if (d <= radiusKm) {
                found.push({ stop: s, distance: d });
            }
        }
        // Sort by distance (closest first)
        return found.sort((a, b) => a.distance - b.distance);
    }

    _findIntersections(routeA, routeB) {
        const hubs = [];
        // Naive intersection: Stops with same name/ID or very close
        // Assuming strict ID matching for now (same database stop ID)
        for (const sA of routeA.stops) {
            const sB = routeB.stops.find(s => s.id === sA.id); // Same Stop ID
            if (sB) {
                hubs.push({ stopA: sA, stopB: sB });
            }
        }
        return hubs;
    }

    _estimateBusTime(candidate) {
        // Simplified: 3 mins per stop
        let stops = 0;
        candidate.segments.forEach(seg => {
            stops += Math.abs(seg.toStop.orden - seg.fromStop.orden);
        });
        return stops * 3;
    }

    _sortFinalResults(candidates, preference) {
        return candidates.sort((a, b) => {
            // PRIMARY: Walking Distance
            const diffWalk = a.metrics.totalWalkDistMeters - b.metrics.totalWalkDistMeters;

            // If difference is significant (> 100m), prefer less walking
            if (Math.abs(diffWalk) > 100) {
                return diffWalk;
            }

            // SECONDARY: Total Time
            return a.metrics.totalTimeMinutes - b.metrics.totalTimeMinutes;
        });
    }

    _formatOutput(candidate) {
        // Format to match what the frontend expects
        let tarifa = 0;
        const formattedSegments = candidate.segments.map(seg => {
            tarifa += parseFloat(seg.route.tarifa || 0.25);

            // Slice the route geometry if available to show the actual bus path on map
            let segmentGeometry = null;
            if (seg.route.geometry && Array.isArray(seg.route.geometry) && seg.route.geometry.length > 1) {
                try {
                    console.log(`✂️ Slicing route ${seg.route.numero_ruta} from ${seg.fromStop.nombre} to ${seg.toStop.nombre}`);
                    segmentGeometry = this._sliceRouteGeometry(seg.route.geometry, seg.fromStop, seg.toStop);
                    console.log(`✅ Slicing successful: ${segmentGeometry ? segmentGeometry.length : 0} points`);
                } catch (e) {
                    console.warn(`Error slicing geometry for route ${seg.route.numero_ruta}:`, e.message);
                }
            } else {
                console.log(`⚠️ No geometry available for route ${seg.route.numero_ruta} to slice`);
            }

            return {
                tipo: 'bus',
                ruta: seg.route,
                paradaOrigen: { ...seg.fromStop, latitud: seg.fromStop.lat, longitud: seg.fromStop.lng },
                paradaDestino: { ...seg.toStop, latitud: seg.toStop.lat, longitud: seg.toStop.lng },
                geometry: segmentGeometry
            };
        });

        return {
            tipo: candidate.type,
            tarifaTotal: tarifa.toFixed(2),
            tiempoEstimadoMinutos: candidate.metrics.totalTimeMinutes,
            distanciaCaminataOrigenMetros: candidate.walkOrigin ? candidate.walkOrigin.dist : 0,
            distanciaCaminataDestinoMetros: candidate.walkDest ? candidate.walkDest.dist : 0,
            // Pass Polylines to frontend to avoid re-fetching
            polylineOrigen: candidate.walkOrigin ? candidate.walkOrigin.polyline : null,
            polylineDestino: candidate.walkDest ? candidate.walkDest.polyline : null,
            transbordos: candidate.segments.length - 1,
            segmentos: formattedSegments
        };
    }

    _sliceRouteGeometry(routeGeometry, fromStop, toStop) {
        // --- LINE SLICING ALGORITHM (Prompt Maestro) ---
        // 1. Convert route to Turf LineString (Correcting Coordinates to [Lng, Lat])
        const points = routeGeometry.map(p => {
            if (Array.isArray(p)) return [p[1], p[0]]; // [lng, lat]
            return [p.lng || p.longitud, p.lat || p.latitud];
        }).filter(p => !isNaN(p[0]) && !isNaN(p[1]));

        if (points.length < 2) return null;

        const line = turf.lineString(points);

        // 2. Snap points to line (re-verification)
        const startPt = turf.point([fromStop.lng, fromStop.lat]);
        const endPt = turf.point([toStop.lng, toStop.lat]);

        const snappedStart = turf.nearestPointOnLine(line, startPt);
        const snappedEnd = turf.nearestPointOnLine(line, endPt);

        // 3. Extract Slice (The Bus Journey)
        // This extracts the EXACT path along the street between pickup and dropoff
        const sliced = turf.lineSlice(snappedStart, snappedEnd, line);

        // 4. Return as {lat, lng} array for Frontend
        if (sliced && sliced.geometry && sliced.geometry.coordinates) {
            return sliced.geometry.coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));
        }
        return null;
    }
}

export default new RouteFinderService();
