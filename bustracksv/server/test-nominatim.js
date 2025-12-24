
const fetch = globalThis.fetch || require('https');

async function geocodeWithNominatim(texto) {
    try {
        const query = encodeURIComponent(`${texto}, El Salvador`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=sv`;

        console.log(`Fetching: ${url}`);

        // Node < 18 compat (using https module if global fetch missing, but index.js implements a polyfill)
        // We'll use the simplest native fetch available in this test environment (Node 18+ assumed as per start-dev.ps1)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BusTrackSV/1.0'
            }
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', text);

        try {
            const data = JSON.parse(text);
            if (data && data.length > 0) {
                console.log('✅ Found:', data[0].display_name);
            } else {
                console.log('❌ Not found');
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
        }

    } catch (error) {
        console.error("Error in geocoding Nominatim:", error);
    }
}

geocodeWithNominatim("San Marcos");
geocodeWithNominatim("Terminal del Sur");
