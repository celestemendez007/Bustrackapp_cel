import { pool } from '../db.js';

// --- CONFIGURACIÓN ---
const WEIGHTS = {
    WALK_METERS: 10,  // Costo por metro de caminata
    BUS_METERS: 1,    // Costo por metro en bus
    TRANSFER_PENALTY: 5000 // Costo fijo por transbordo (Aumentado para evitar transbordos innecesarios)
};

// MODIFICADO: Aumentado radio a 1500m para debug
const MAX_WALK_RADIUS = 1500;
const MAX_TRANSFER_DIST = 50;

// --- PRIORITY QUEUE (Min Heap simple) ---
class PriorityQueue {
    constructor() {
        this.heap = [];
    }
    enqueue(element, priority) {
        this.heap.push({ element, priority });
        this.bubbleUp(this.heap.length - 1);
    }
    dequeue() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.sinkDown(0);
        }
        return min;
    }
    bubbleUp(n) {
        while (n > 0) {
            const parent = Math.floor((n - 1) / 2);
            if (this.heap[n].priority >= this.heap[parent].priority) break;
            [this.heap[n], this.heap[parent]] = [this.heap[parent], this.heap[n]];
            n = parent;
        }
    }
    sinkDown(n) {
        const length = this.heap.length;
        while (true) {
            let left = 2 * n + 1;
            let right = 2 * n + 2;
            let swap = null;
            if (left < length && this.heap[left].priority < this.heap[n].priority) swap = left;
            if (right < length && this.heap[right].priority < (swap === null ? this.heap[n].priority : this.heap[left].priority)) swap = right;
            if (swap === null) break;
            [this.heap[n], this.heap[swap]] = [this.heap[swap], this.heap[n]];
            n = swap;
        }
    }
    isEmpty() { return this.heap.length === 0; }
}

// --- HELPER GEOMETRÍA ---
function getDistanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = v => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- CLASE PRINCIPAL ---
class GraphRouteService {
    constructor() {
        this.nodes = [];
        this.grid = {};
        this.rutasInfo = {};
        this.lastBuild = 0;
    }

    async buildGraph() {
        if (Date.now() - this.lastBuild < 60000 && this.nodes.length > 0) return;

        console.log("Construyendo grafo de rutas...");
        const client = await pool.connect();
        try {
            const rutasRes = await client.query('SELECT id, numero_ruta, nombre, color, tarifa FROM rutas WHERE activa = 1');
            this.rutasInfo = {};
            rutasRes.rows.forEach(r => this.rutasInfo[r.id] = r);

            const puntosRes = await client.query(`SELECT id, ruta_id, lat, lng, orden, tipo FROM puntos_ruta ORDER BY ruta_id, COALESCE(tipo, 'ida'), CAST(orden AS INTEGER)`);
            this.nodes = puntosRes.rows.map(p => ({
                id: p.id,
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lng),
                ruta_id: p.ruta_id,
                orden: parseInt(p.orden),
                tipo: p.tipo || 'ida',
                nextIndex: -1
            }));

            this.grid = {};
            const gridSize = 0.005;

            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const gx = Math.floor(node.lat / gridSize);
                const gy = Math.floor(node.lng / gridSize);
                const key = `${gx},${gy}`;
                if (!this.grid[key]) this.grid[key] = [];
                this.grid[key].push(i);

                if (i < this.nodes.length - 1) {
                    const next = this.nodes[i + 1];
                    if (next.ruta_id === node.ruta_id && next.tipo === node.tipo && next.orden === node.orden + 1) {
                        node.nextIndex = i + 1;
                    }
                }
            }
            console.log(`Grafo construido: ${this.nodes.length} nodos. Grid keys: ${Object.keys(this.grid).length}`);
            this.lastBuild = Date.now();
        } finally {
            client.release();
        }
    }

    async findBestRoute(originLat, originLng, destLat, destLng) {
        await this.buildGraph();

        console.log(`\n--- INICIANDO BÚSQUEDA GRAFO ---`);
        console.log(`Origen: ${originLat}, ${originLng}`);
        console.log(`Destino: ${destLat}, ${destLng}`);
        console.log(`Radio de búsqueda (Caminata inicial/final): ${MAX_WALK_RADIUS}m`);

        const pq = new PriorityQueue();
        const dists = new Map();
        const previous = new Map();

        const ORIGIN_NODE = -1;
        const DEST_NODE = -2;

        // 1. Encontrar nodos de entrada
        let startNodos = this.getNearbyNodes(originLat, originLng, MAX_WALK_RADIUS);
        console.log(`Nodos cercanos al origen encontrados: ${startNodos.length}`);

        if (startNodos.length === 0) {
            console.warn("❌ CRÍTICO: No se encontraron puntos de ruta cercanos al origen. Verifica lat/lng invertidos.");
        }

        startNodos.forEach(idx => {
            const node = this.nodes[idx];
            const d = getDistanciaMetros(originLat, originLng, node.lat, node.lng);
            const ruta = this.rutasInfo[node.ruta_id];

            // Log de muestra (solo primeros 5)
            if (Math.random() < 0.05) {
                console.log(` Evaluando Ruta: ${ruta ? ruta.numero_ruta : '???'} (ID:${node.ruta_id}) | Distancia a Origen: ${Math.round(d)}m`);
            }

            const cost = d * WEIGHTS.WALK_METERS;
            dists.set(idx, cost);
            previous.set(idx, { fromNode: ORIGIN_NODE, type: 'WALK_TO_START' });
            pq.enqueue(idx, cost);
        });

        let finalCost = Infinity;
        let finalNode = null;
        let nodesVisited = 0;

        while (!pq.isEmpty()) {
            const { element: currIdx, priority: currentDist } = pq.dequeue();
            nodesVisited++;

            if (currentDist > (dists.get(currIdx) || Infinity)) continue;
            if (currentDist > finalCost) continue;

            const currNode = this.nodes[currIdx];

            // A) Check Destino
            const distToDest = getDistanciaMetros(currNode.lat, currNode.lng, destLat, destLng);
            if (distToDest <= MAX_WALK_RADIUS) {
                const totalCost = currentDist + (distToDest * WEIGHTS.WALK_METERS);

                // Logging de éxito potencial
                if (totalCost < finalCost) {
                    console.log(`  ✅ Posible Ruta Encontrada! Dist destino: ${Math.round(distToDest)}m | Costo: ${Math.round(totalCost)}`);
                    finalCost = totalCost;
                    finalNode = currIdx;
                    previous.set(DEST_NODE, { fromNode: currIdx, type: 'WALK_TO_END' });
                }
            }

            // B) Bus Next
            if (currNode.nextIndex !== -1) {
                const nextIdx = currNode.nextIndex;
                const nextNode = this.nodes[nextIdx];
                const d = getDistanciaMetros(currNode.lat, currNode.lng, nextNode.lat, nextNode.lng);
                const newCost = currentDist + (d * WEIGHTS.BUS_METERS);

                if (newCost < (dists.get(nextIdx) || Infinity)) {
                    dists.set(nextIdx, newCost);
                    previous.set(nextIdx, { fromNode: currIdx, type: 'BUS' });
                    pq.enqueue(nextIdx, newCost);
                }
            }

            // C) Transfers
            const nearbyTransfers = this.getNearbyNodes(currNode.lat, currNode.lng, MAX_TRANSFER_DIST);
            nearbyTransfers.forEach(targetIdx => {
                const targetNode = this.nodes[targetIdx];
                if (targetNode.ruta_id === currNode.ruta_id) return;

                const d = getDistanciaMetros(currNode.lat, currNode.lng, targetNode.lat, targetNode.lng);
                const newCost = currentDist + (d * WEIGHTS.WALK_METERS) + WEIGHTS.TRANSFER_PENALTY;

                if (newCost < (dists.get(targetIdx) || Infinity)) {
                    dists.set(targetIdx, newCost);
                    previous.set(targetIdx, { fromNode: currIdx, type: 'TRANSFER' });
                    pq.enqueue(targetIdx, newCost);
                }
            });
        }

        console.log(`Búsqueda terminada. Nodos visitados: ${nodesVisited}. Costo final: ${finalCost}`);

        if (finalCost === Infinity) {
            console.log("❌ No se encontró ruta. Posibles causas: Sin conexión, radio muy pequeño, o islas disconexas.");
            return null;
        }

        return this.reconstructPath(previous, finalNode, originLat, originLng, destLat, destLng);
    }

    getNearbyNodes(lat, lng, radius) {
        const gridSize = 0.005;
        const candidates = [];
        const gx = Math.floor(lat / gridSize);
        const gy = Math.floor(lng / gridSize);

        for (let x = gx - 1; x <= gx + 1; x++) {
            for (let y = gy - 1; y <= gy + 1; y++) {
                const key = `${x},${y}`;
                if (this.grid[key]) {
                    this.grid[key].forEach(idx => {
                        const node = this.nodes[idx];
                        const d = getDistanciaMetros(lat, lng, node.lat, node.lng);
                        if (d <= radius) candidates.push(idx);
                    });
                }
            }
        }
        return candidates;
    }

    reconstructPath(previous, finalNodeIdx, originLat, originLng, destLat, destLng) {
        const segments = [];
        let curr = finalNodeIdx;

        const lastNode = this.nodes[finalNodeIdx];
        const distEnd = Math.round(getDistanciaMetros(lastNode.lat, lastNode.lng, destLat, destLng));
        segments.unshift({
            tipo: 'WALK',
            distancia: distEnd,
            geometria: [{ lat: lastNode.lat, lng: lastNode.lng }, { lat: destLat, lng: destLng }]
        });

        let pathStack = [];
        while (curr !== -1) {
            const record = previous.get(curr);
            if (!record) break;

            if (record.fromNode === -1) {
                const firstNode = this.nodes[curr];
                const distStart = Math.round(getDistanciaMetros(originLat, originLng, firstNode.lat, firstNode.lng));
                segments.unshift({
                    tipo: 'WALK',
                    distancia: distStart,
                    geometria: [{ lat: originLat, lng: originLng }, { lat: firstNode.lat, lng: firstNode.lng }]
                });
                break;
            }

            pathStack.push({ idx: curr, type: record.type, prevIdx: record.fromNode });
            curr = record.fromNode;
        }

        pathStack.reverse();
        let currentBusSegment = null;

        pathStack.forEach(step => {
            const node = this.nodes[step.idx];
            const prevNode = this.nodes[step.prevIdx];

            if (step.type === 'BUS') {
                if (!currentBusSegment) {
                    const ruta = this.rutasInfo[node.ruta_id];
                    currentBusSegment = {
                        tipo: 'BUS',
                        ruta_id: node.ruta_id,
                        numero: ruta.numero_ruta,
                        nombre: ruta.nombre,
                        color: ruta.color || '#0000FF',
                        tarifa: ruta.tarifa || 0.25,
                        fromStop: { lat: prevNode.lat, lng: prevNode.lng },
                        toStop: { lat: node.lat, lng: node.lng },
                        // Puntos reales
                        geometria: [{ lat: prevNode.lat, lng: prevNode.lng }, { lat: node.lat, lng: node.lng }]
                    };
                    segments.splice(segments.length - 1, 0, currentBusSegment);
                } else {
                    currentBusSegment.geometria.push({ lat: node.lat, lng: node.lng });
                    currentBusSegment.toStop = { lat: node.lat, lng: node.lng };
                }
            } else if (step.type === 'TRANSFER') {
                currentBusSegment = null;
                const d = Math.round(getDistanciaMetros(prevNode.lat, prevNode.lng, node.lat, node.lng));
                segments.splice(segments.length - 1, 0, {
                    tipo: 'WALK',
                    subtipo: 'TRANSFER',
                    distancia: d,
                    geometria: [{ lat: prevNode.lat, lng: prevNode.lng }, { lat: node.lat, lng: node.lng }]
                });
            }
        });

        const totalWalking = segments.filter(s => s.tipo === 'WALK').reduce((acc, s) => acc + s.distancia, 0);
        const busSegments = segments.filter(s => s.tipo === 'BUS');
        const rutaSummary = busSegments.map(s => `Ruta ${s.numero}`).join(' -> ');

        return {
            recomendacion: {
                resumen: rutaSummary || "Caminata",
                total_caminata_metros: totalWalking,
                segmentos: segments
            }
        };
    }
}

export default new GraphRouteService();
