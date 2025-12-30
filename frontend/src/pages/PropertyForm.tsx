import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { propertiesApi } from '../api';
import type { PropertyCreate, PropertyUpdate, PropertyStatus, PropertyPhase } from '../api/types';

const COUNTIES = [
  'Bexar', 'Comal', 'Guadalupe', 'Kendall', 'Blanco',
  'Hays', 'Gillespie', 'Kerr', 'Medina', 'Bandera',
  'Real', 'Edwards', 'Uvalde',
];

const STATUSES: PropertyStatus[] = [
  'Prospect', 'Contacted', 'In Negotiation', 'Committed',
  'Under Construction', 'Completed', 'On Hold', 'Declined',
];

const PHASES: PropertyPhase[] = [
  'Pre-Development', 'Planning', 'Permitting', 'Construction', 'Occupancy', 'Stabilized',
];

const LEASE_PARTNERS = ['Zayo', 'Logix', 'LCRA', 'Gigabit Fiber', 'Other'];

export default function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<PropertyCreate>({
    name: '',
    property_type: 'MDU',
    status: 'Prospect',
    phase: 'Pre-Development',
    county: 'Comal',
    state: 'TX',
    address: '',
    city: '',
    zip_code: '',
    latitude: undefined,
    longitude: undefined,
    units: undefined,
    buildings: undefined,
    stories: undefined,
    lots: undefined,
    phases: undefined,
    current_phase: undefined,
    break_ground_date: undefined,
    expected_delivery_date: undefined,
    fiber_distance_gvtc: undefined,
    fiber_distance_lease: undefined,
    lease_partner: '',
    competitor_count: 0,
    median_income: undefined,
    population_density: undefined,
    nearby_schools: 0,
    nearby_libraries: 0,
    notes: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchProperty();
    }
  }, [id, isEditing]);

  const fetchProperty = async () => {
    try {
      const property = await propertiesApi.get(parseInt(id!));
      setFormData({
        name: property.name,
        property_type: property.property_type,
        status: property.status,
        phase: property.phase,
        county: property.county,
        state: property.state,
        address: property.address || '',
        city: property.city || '',
        zip_code: property.zip_code || '',
        latitude: property.latitude,
        longitude: property.longitude,
        units: property.units,
        buildings: property.buildings,
        stories: property.stories,
        lots: property.lots,
        phases: property.phases,
        current_phase: property.current_phase,
        break_ground_date: property.break_ground_date?.split('T')[0],
        expected_delivery_date: property.expected_delivery_date?.split('T')[0],
        fiber_distance_gvtc: property.fiber_distance_gvtc,
        fiber_distance_lease: property.fiber_distance_lease,
        lease_partner: property.lease_partner || '',
        competitor_count: property.competitor_count,
        median_income: property.median_income,
        population_density: property.population_density,
        nearby_schools: property.nearby_schools,
        nearby_libraries: property.nearby_libraries,
        notes: property.notes || '',
      });
    } catch (err) {
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Clean up dates for API
      const submitData = {
        ...formData,
        break_ground_date: formData.break_ground_date ? new Date(formData.break_ground_date).toISOString() : undefined,
        expected_delivery_date: formData.expected_delivery_date ? new Date(formData.expected_delivery_date).toISOString() : undefined,
      };

      if (isEditing) {
        await propertiesApi.update(parseInt(id!), submitData as PropertyUpdate);
        navigate(`/properties/${id}`);
      } else {
        const newProperty = await propertiesApi.create(submitData);
        navigate(`/properties/${newProperty.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gvtc-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link to={isEditing ? `/properties/${id}` : '/properties'} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="MDU">MDU (Multifamily)</option>
                <option value="Subdivision">Subdivision</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County *
              </label>
              <select
                name="county"
                value={formData.county}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                {COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                {PHASES.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {formData.property_type === 'MDU' ? 'MDU Details' : 'Subdivision Details'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.property_type === 'MDU' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                  <input
                    type="number"
                    name="units"
                    value={formData.units || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buildings</label>
                  <input
                    type="number"
                    name="buildings"
                    value={formData.buildings || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stories</label>
                  <input
                    type="number"
                    name="stories"
                    value={formData.stories || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Lots</label>
                  <input
                    type="number"
                    name="lots"
                    value={formData.lots || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Phases</label>
                  <input
                    type="number"
                    name="phases"
                    value={formData.phases || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Phase</label>
                  <input
                    type="number"
                    name="current_phase"
                    value={formData.current_phase || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Fiber & Competition */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fiber & Competition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GVTC Fiber Distance (miles)
              </label>
              <input
                type="number"
                step="0.01"
                name="fiber_distance_gvtc"
                value={formData.fiber_distance_gvtc || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease Partner Distance (miles)
              </label>
              <input
                type="number"
                step="0.01"
                name="fiber_distance_lease"
                value={formData.fiber_distance_lease || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Partner</label>
              <select
                name="lease_partner"
                value={formData.lease_partner}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              >
                <option value="">Select...</option>
                {LEASE_PARTNERS.map(partner => (
                  <option key={partner} value={partner}>{partner}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Competitor Count</label>
              <input
                type="number"
                name="competitor_count"
                value={formData.competitor_count || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demographics & E-Rate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Median Income ($)</label>
              <input
                type="number"
                name="median_income"
                value={formData.median_income || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Population Density (per sq mi)</label>
              <input
                type="number"
                name="population_density"
                value={formData.population_density || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nearby Schools</label>
              <input
                type="number"
                name="nearby_schools"
                value={formData.nearby_schools || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nearby Libraries</label>
              <input
                type="number"
                name="nearby_libraries"
                value={formData.nearby_libraries || ''}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Break Ground Date</label>
              <input
                type="date"
                name="break_ground_date"
                value={formData.break_ground_date || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input
                type="date"
                name="expected_delivery_date"
                value={formData.expected_delivery_date || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-gvtc-primary focus:border-gvtc-primary"
            placeholder="Add any additional notes about this property..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <Link
            to={isEditing ? `/properties/${id}` : '/properties'}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gvtc-primary hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
