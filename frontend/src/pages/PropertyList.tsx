import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { propertiesApi } from '../api';
import type { PropertyListItem, PropertyFilter, PropertyType, PropertyStatus } from '../api/types';

const COUNTIES = [
  'Bexar', 'Comal', 'Guadalupe', 'Kendall', 'Blanco',
  'Hays', 'Gillespie', 'Kerr', 'Medina', 'Bandera',
  'Real', 'Edwards', 'Uvalde',
];

const STATUSES: PropertyStatus[] = [
  'Prospect', 'Contacted', 'In Negotiation', 'Committed',
  'Under Construction', 'Completed', 'On Hold', 'Declined',
];

export default function PropertyList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<'score' | 'name' | 'units'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [filters, setFilters] = useState<PropertyFilter>({
    search: searchParams.get('search') || '',
    county: searchParams.get('county') || undefined,
    property_type: (searchParams.get('type') as PropertyType) || undefined,
    status: (searchParams.get('status') as PropertyStatus) || undefined,
    tier: searchParams.get('tier') ? parseInt(searchParams.get('tier')!) : undefined,
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await propertiesApi.list(filters);
        setProperties(data);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  const handleFilterChange = (key: keyof PropertyFilter, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.county) params.set('county', newFilters.county);
    if (newFilters.property_type) params.set('type', newFilters.property_type);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.tier) params.set('tier', newFilters.tier.toString());
    setSearchParams(params);
  };

  const sortedProperties = [...properties].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'units':
        comparison = (a.units || a.lots || 0) - (b.units || b.lots || 0);
        break;
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'score' | 'name' | 'units') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'score' | 'name' | 'units' }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
    );
  };

  const getTierBadge = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-amber-100 text-amber-800',
      3: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[tier] || colors[3]}`}>
        Tier {tier}
      </span>
    );
  };

  const getTypeBadge = (type: PropertyType) => {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        type === 'MDU' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
      }`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <Link
          to="/properties/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gvtc-primary hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Property
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(filters.county || filters.property_type || filters.status || filters.tier) && (
              <span className="ml-2 bg-gvtc-primary text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <select
                value={filters.county || ''}
                onChange={(e) => handleFilterChange('county', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="">All Counties</option>
                {COUNTIES.map((county) => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.property_type || ''}
                onChange={(e) => handleFilterChange('property_type', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="">All Types</option>
                <option value="MDU">MDU</option>
                <option value="Subdivision">Subdivision</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={filters.tier || ''}
                onChange={(e) => handleFilterChange('tier', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1 (75+)</option>
                <option value="2">Tier 2 (50-74)</option>
                <option value="3">{"Tier 3 (<50)"}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gvtc-primary"></div>
          </div>
        ) : sortedProperties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No properties found. Try adjusting your filters or add a new property.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Property <SortIcon field="name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th
                  onClick={() => handleSort('units')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Units/Lots <SortIcon field="units" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Score <SortIcon field="score" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/properties/${property.id}`}
                      className="text-sm font-medium text-gvtc-primary hover:text-blue-700"
                    >
                      {property.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(property.property_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.city && `${property.city}, `}{property.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.property_type === 'MDU'
                      ? property.units?.toLocaleString() || '-'
                      : property.lots?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {property.score.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTierBadge(property.tier)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && sortedProperties.length > 0 && (
        <div className="text-sm text-gray-500 text-right">
          Showing {sortedProperties.length} properties
        </div>
      )}
    </div>
  );
}
