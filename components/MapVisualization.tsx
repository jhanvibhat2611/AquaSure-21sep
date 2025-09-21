'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSample {
  id: string;
  sampleId: string;
  projectName: string;
  metal: string;
  Si: number;
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  date: string;
  hmpi: number;
  riskLevel: { level: string; color: string };
}

interface MapVisualizationProps {
  samples: MapSample[];
}

// Create custom icons for different risk levels
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

function MapBounds({ samples }: { samples: MapSample[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (samples.length > 0) {
      const bounds = L.latLngBounds(
        samples.map(sample => [sample.latitude, sample.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, samples]);
  
  return null;
}

export default function MapVisualization({ samples }: MapVisualizationProps) {
  // Center of India as default
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  
  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapBounds samples={samples} />
      
      {samples.map((sample) => (
        <Marker
          key={sample.id}
          position={[sample.latitude, sample.longitude]}
          icon={createCustomIcon(sample.riskLevel.color)}
        >
          <Popup>
            <div className="p-2 min-w-48">
              <h4 className="font-bold text-lg mb-2">{sample.sampleId}</h4>
              
              <div className="space-y-1 text-sm">
                <div><strong>Project:</strong> {sample.projectName.split(' - ')[1]}</div>
                <div><strong>Location:</strong> {sample.district}, {sample.city}</div>
                <div><strong>Metal:</strong> {sample.metal}</div>
                <div><strong>Concentration:</strong> {sample.Si} mg/L</div>
                <div><strong>HMPI:</strong> <span className="font-bold">{sample.hmpi.toFixed(2)}</span></div>
                <div><strong>Date:</strong> {sample.date}</div>
              </div>
              
              <div className="mt-3 pt-2 border-t">
                <div 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${sample.riskLevel.color}20`,
                    color: sample.riskLevel.color,
                    border: `1px solid ${sample.riskLevel.color}40`
                  }}
                >
                  {sample.riskLevel.level}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Coordinates: {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}