import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { propertiesApi } from '../api';
import type { PropertyListItem, PropertyFilter, PropertyType } from '../api/types';

// Fix Leaflet default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons by tier
const createTierIcon = (tier: number) => {
  const colors: Record<number, string> = {
    1: '#22c55e', // green
    2: '#f59e0b', // amber
    3: '#ef4444', // red
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${colors[tier] || colors[3]};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const COUNTIES = [
  'Bexar', 'Comal', 'Guadalupe', 'Kendall', 'Blanco',
  'Hays', 'Gillespie', 'Kerr', 'Medina', 'Bandera',
  'Real', 'Edwards', 'Uvalde',
];

// Map center - Central Texas (GVTC territory)
const MAP_CENTER: [number, number] = [29.75, -98.5];
const MAP_ZOOM = 9;

function MapController({ properties }: { properties: PropertyListItem[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length > 0) {
      const validProps = properties.filter(p => p.latitude && p.longitude);
      if (validProps.length > 0) {
        const bounds = L.latLngBounds(
          validProps.map(p => [p.latitude!, p.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [properties, map]);
  
  return null;
}

export default function MapView() {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null);
  
  const [filters, setFilters] = useState<PropertyFilter>({
    search: '',
    county: undefined,
    property_type: undefined,
    tier: undefined,
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      const data = await propertiesApi.list(filters);
      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PropertyFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const propertiesWithLocation = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Map View</h1>
          <span className="text-sm text-gray-500">
            {propertiesWithLocation.length} properties with location
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <Link
            to="/properties/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gvtc-primary hover:bg-blue-700"
          >
            <MapPinIcon className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <select
              value={filters.county || ''}
              onChange={(e) => handleFilterChange('county', e.target.value)}
              className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
            >
              <option value="">All Counties</option>
              {COUNTIES.map((county) => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>

            <select
              value={filters.property_type || ''}
              onChange={(e) => handleFilterChange('property_type', e.target.value as PropertyType)}
              className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
            >
              <option value="">All Types</option>
              <option value="MDU">MDU</option>
              <option value="Subdivision">Subdivision</option>
            </select>

            <select
              value={filters.tier || ''}
              onChange={(e) => handleFilterChange('tier', e.target.value ? parseInt(e.target.value) : undefined)}
              className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
            >
              <option value="">All Tiers</option>
              <option value="1">Tier 1 (75+)</option>
              <option value="2">Tier 2 (50-74)</option>
              <option value="3">Tier 3 (&lt;50)</option>
            </select>
          </div>
        </div>
      )}

      {/* Map and Sidebar */}
      <div className="flex-1 flex gap-4">
        {/* Map */}
        <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gvtc-primary"></div>
            </div>
          ) : (
            <MapContainer
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              className="h-full w-full"
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController properties={propertiesWithLocation} />
              
              {propertiesWithLocation.map((property) => (
                <Marker
                  key={property.id}
                  position={[property.latitude!, property.longitude!]}
                  icon={createTierIcon(property.tier)}
                  eventHandlers={{
                    click: () => setSelectedProperty(property),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-500">
                        {property.city && `${property.city}, `}{property.county}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          property.property_type === 'MDU' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {property.property_type}
                        </span>
                        <span className="text-sm font-medium">Score: {property.score.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        {property.property_type === 'MDU' 
                          ? `${property.units?.toLocaleString() || '?'} units`
                          : `${property.lots?.toLocaleString() || '?'} lots`}
                      </div>
                      <Link
                        to={`/properties/${property.id}`}
                        className="mt-3 block text-center text-sm text-gvtc-primary hover:text-blue-700"
                      >
                        View Details →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Sidebar - Property Quick View */}
        <div className="w-80 bg-white shadow rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Properties</h3>
            <p className="text-sm text-gray-500">{properties.length} total</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {properties.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No properties found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/properties/${property.id}`}
                    className={`block p-4 hover:bg-gray-50 ${
                      selectedProperty?.id === property.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {property.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {property.city && `${property.city}, `}{property.county}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          property.tier === 1 ? 'bg-green-100 text-green-800' :
                          property.tier === 2 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          T{property.tier}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                        property.property_type === 'MDU' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {property.property_type}
                      </span>
                      <span className="text-gray-500">
                        {property.property_type === 'MDU' 
                          ? `${property.units?.toLocaleString() || '?'} units`
                          : `${property.lots?.toLocaleString() || '?'} lots`}
                      </span>
                      <span className="font-medium text-gray-900">
                        {property.score.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          Tier 1 (75+)
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
          Tier 2 (50-74)
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          Tier 3 (&lt;50)
        </div>
      </div>
    </div>
  );
}
