import React, { useRef } from 'react';

interface Props {
  lat: number;
  lng: number;
  mapRef: React.RefObject<any>;
}

const getMapHTML = (lat: number, lng: number, zoom: number = 15) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-zoom { display: none; }
    .leaflet-control-attribution { font-size: 8px !important; opacity: 0.5; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${lat}, ${lng}],
      zoom: ${zoom},
      zoomControl: false,
      attributionControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.bounds) {
          // Use fitBounds for accurate zoom from bounding box
          map.flyToBounds([
            [data.bounds[0], data.bounds[2]],
            [data.bounds[1], data.bounds[3]]
          ], { duration: 1.5, padding: [20, 20] });
        } else if (data.lat && data.lng) {
          map.flyTo([data.lat, data.lng], data.zoom || 15, { duration: 1.2 });
        }
      } catch(err) {}
    });
  <\/script>
</body>
</html>
`;

export default function MapComponent({ lat, lng, mapRef }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Expose iframe ref through mapRef
  React.useEffect(() => {
    if (mapRef) {
      (mapRef as any).current = { iframeRef };
    }
  }, [mapRef]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={getMapHTML(lat, lng)}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
    />
  );
}

export function moveMap(
  mapRef: React.RefObject<any>,
  lat: number,
  lng: number,
  boundingbox?: string[]
) {
  const iframe = mapRef.current?.iframeRef?.current;
  if (iframe?.contentWindow) {
    if (boundingbox && boundingbox.length === 4) {
      // Use bounding box for smart zoom (country → zoomed out, street → zoomed in)
      iframe.contentWindow.postMessage(
        JSON.stringify({
          bounds: boundingbox.map(Number),
        }),
        '*'
      );
    } else {
      iframe.contentWindow.postMessage(
        JSON.stringify({ lat, lng, zoom: 15 }),
        '*'
      );
    }
  }
}
