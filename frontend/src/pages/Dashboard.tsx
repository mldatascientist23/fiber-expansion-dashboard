import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOffice2Icon,
  HomeModernIcon,
  ChartBarIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { propertiesApi } from '../api';
import type { PropertyStats, PropertyListItem } from '../api/types';

export default function Dashboard() {
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [topProperties, setTopProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, propertiesData] = await Promise.all([
          propertiesApi.getStats(),
          propertiesApi.list({ tier: 1 }),
        ]);
        setStats(statsData);
        setTopProperties(propertiesData.slice(0, 5));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gvtc-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Properties',
      value: stats?.total_properties || 0,
      icon: BuildingOffice2Icon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Units (MDU)',
      value: stats?.total_units || 0,
      icon: HomeModernIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Total Lots (SFU)',
      value: stats?.total_lots || 0,
      icon: MapPinIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Avg. Score',
      value: stats?.average_score || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link
            to="/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gvtc-primary hover:bg-blue-700"
          >
            Add Property
          </Link>
          <Link
            to="/import"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Import Excel
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {typeof stat.value === 'number' && stat.name === 'Avg. Score'
                        ? stat.value.toFixed(1)
                        : stat.value.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats by Type and Tier */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* By Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Properties by Type</h3>
          <div className="space-y-4">
            {Object.entries(stats?.by_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    type === 'MDU' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {type}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Tier */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Properties by Tier</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((tier) => {
              const count = stats?.by_tier?.[tier.toString()] || 0;
              const tierColors: Record<number, string> = {
                1: 'bg-green-100 text-green-800',
                2: 'bg-amber-100 text-amber-800',
                3: 'bg-red-100 text-red-800',
              };
              return (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColors[tier]}`}>
                      Tier {tier}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {tier === 1 ? '(75+ score)' : tier === 2 ? '(50-74 score)' : '(<50 score)'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-green-500" />
            Top Tier 1 Opportunities
          </h3>
          <Link to="/properties?tier=1" className="text-sm text-gvtc-primary hover:text-blue-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {topProperties.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-center">
              No Tier 1 properties yet. Add properties to see top opportunities.
            </div>
          ) : (
            topProperties.map((property) => (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gvtc-primary">{property.name}</p>
                    <p className="text-sm text-gray-500">
                      {property.city}, {property.county} County
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      property.property_type === 'MDU' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {property.property_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {property.property_type === 'MDU' ? `${property.units} units` : `${property.lots} lots`}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Score: {property.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
