import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { propertiesApi, contactsApi, documentsApi, costsApi } from '../api';
import type { Property, PropertyContact, PropertyOrganization, Document, PropertyCost } from '../api/types';

type TabType = 'overview' | 'contacts' | 'documents' | 'costs' | 'scoring';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [contacts, setContacts] = useState<PropertyContact[]>([]);
  const [organizations, setOrganizations] = useState<PropertyOrganization[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [costs, setCosts] = useState<PropertyCost | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deleting, setDeleting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const propData = await propertiesApi.get(parseInt(id!));
      setProperty(propData);
      
      // Fetch related data
      const [contactsData, orgsData, docsData, costsData] = await Promise.all([
        contactsApi.getPropertyContacts(parseInt(id!)),
        contactsApi.getPropertyOrganizations(parseInt(id!)),
        documentsApi.getPropertyDocuments(parseInt(id!)),
        costsApi.get(parseInt(id!)),
      ]);
      
      setContacts(contactsData);
      setOrganizations(orgsData);
      setDocuments(docsData);
      setCosts(costsData);
    } catch (error) {
      console.error('Failed to fetch property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    setDeleting(true);
    try {
      await propertiesApi.delete(parseInt(id!));
      navigate('/properties');
    } catch (error) {
      console.error('Failed to delete property:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleRecalculateScore = async () => {
    setRecalculating(true);
    try {
      const updated = await propertiesApi.recalculateScore(parseInt(id!));
      setProperty(updated);
      const breakdown = await propertiesApi.getScoreBreakdown(parseInt(id!));
      setScoreBreakdown(breakdown);
    } catch (error) {
      console.error('Failed to recalculate score:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const fetchScoreBreakdown = async () => {
    try {
      const breakdown = await propertiesApi.getScoreBreakdown(parseInt(id!));
      setScoreBreakdown(breakdown);
    } catch (error) {
      console.error('Failed to fetch score breakdown:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'scoring' && id) {
      fetchScoreBreakdown();
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gvtc-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Property not found</p>
        <Link to="/properties" className="text-gvtc-primary hover:text-blue-700 mt-4 inline-block">
          Back to Properties
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BuildingOffice2Icon },
    { id: 'contacts', name: 'Contacts', icon: UserGroupIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'costs', name: 'Costs', icon: CurrencyDollarIcon },
    { id: 'scoring', name: 'Scoring', icon: ChartBarIcon },
  ] as const;

  const getTierBadge = (tier: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-500 text-white',
      2: 'bg-amber-500 text-white',
      3: 'bg-red-500 text-white',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[tier]}`}>
        Tier {tier}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/properties"
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-sm text-gray-500">
              {property.city && `${property.city}, `}{property.county} County, {property.state}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getTierBadge(property.tier)}
          <span className="text-lg font-semibold text-gray-900">
            Score: {property.score.toFixed(1)}
          </span>
          <button
            onClick={handleRecalculateScore}
            disabled={recalculating}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
          <Link
            to={`/properties/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Property Type Badge */}
      <div className="flex items-center space-x-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          property.property_type === 'MDU' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {property.property_type}
        </span>
        <span className="text-sm text-gray-500">
          Status: <span className="font-medium">{property.status}</span>
        </span>
        <span className="text-sm text-gray-500">
          Phase: <span className="font-medium">{property.phase}</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-gvtc-primary text-gvtc-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Property Details</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">{property.address || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">City</dt>
                  <dd className="text-sm text-gray-900">{property.city || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">County</dt>
                  <dd className="text-sm text-gray-900">{property.county}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">ZIP</dt>
                  <dd className="text-sm text-gray-900">{property.zip_code || '-'}</dd>
                </div>
                {property.property_type === 'MDU' ? (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Units</dt>
                      <dd className="text-sm text-gray-900 font-medium">{property.units?.toLocaleString() || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Buildings</dt>
                      <dd className="text-sm text-gray-900">{property.buildings || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Stories</dt>
                      <dd className="text-sm text-gray-900">{property.stories || '-'}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Lots</dt>
                      <dd className="text-sm text-gray-900 font-medium">{property.lots?.toLocaleString() || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Phases</dt>
                      <dd className="text-sm text-gray-900">{property.phases || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Current Phase</dt>
                      <dd className="text-sm text-gray-900">{property.current_phase || '-'}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {/* Fiber & Competition */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fiber & Competition</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">GVTC Fiber Distance</dt>
                  <dd className="text-sm text-gray-900">
                    {property.fiber_distance_gvtc ? `${property.fiber_distance_gvtc.toFixed(2)} miles` : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Lease Partner Distance</dt>
                  <dd className="text-sm text-gray-900">
                    {property.fiber_distance_lease ? `${property.fiber_distance_lease.toFixed(2)} miles` : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Lease Partner</dt>
                  <dd className="text-sm text-gray-900">{property.lease_partner || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Competitors</dt>
                  <dd className="text-sm text-gray-900">{property.competitor_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Median Income</dt>
                  <dd className="text-sm text-gray-900">
                    {property.median_income ? `$${property.median_income.toLocaleString()}` : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Nearby Schools</dt>
                  <dd className="text-sm text-gray-900">{property.nearby_schools}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Nearby Libraries</dt>
                  <dd className="text-sm text-gray-900">{property.nearby_libraries}</dd>
                </div>
              </dl>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Break Ground Date</dt>
                  <dd className="text-sm text-gray-900">
                    {property.break_ground_date ? new Date(property.break_ground_date).toLocaleDateString() : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Expected Delivery</dt>
                  <dd className="text-sm text-gray-900">
                    {property.expected_delivery_date ? new Date(property.expected_delivery_date).toLocaleDateString() : '-'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{new Date(property.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{new Date(property.updated_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {property.notes || 'No notes added.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organizations</h3>
              {organizations.length === 0 ? (
                <p className="text-gray-500">No organizations linked.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.org_type}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {org.role}
                        </span>
                      </div>
                      {org.phone && <p className="text-sm text-gray-600 mt-2">{org.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contacts</h3>
              {contacts.length === 0 ? (
                <p className="text-gray-500">No contacts linked.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{contact.title}</p>
                        </div>
                        {contact.relationship_strength && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Strength: {contact.relationship_strength}/5
                          </span>
                        )}
                      </div>
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-sm text-gvtc-primary mt-2 block">
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-gray-500">No documents uploaded.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{doc.original_filename}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{doc.document_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-gvtc-primary hover:text-blue-700">Download</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'costs' && costs && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Build Costs</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Build Cost</dt>
                    <dd className="text-sm text-gray-900">${costs.build_cost?.toLocaleString() || '0'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Lateral Cost</dt>
                    <dd className="text-sm text-gray-900">${costs.lateral_cost?.toLocaleString() || '0'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Make Ready Cost</dt>
                    <dd className="text-sm text-gray-900">${costs.make_ready_cost?.toLocaleString() || '0'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Drop Cost</dt>
                    <dd className="text-sm text-gray-900">${costs.drop_cost?.toLocaleString() || '0'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Equipment Cost</dt>
                    <dd className="text-sm text-gray-900">${costs.equipment_cost?.toLocaleString() || '0'}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-3 mt-3">
                    <dt className="text-sm font-medium text-gray-900">Total CAPEX</dt>
                    <dd className="text-sm font-medium text-gray-900">${costs.total_capex?.toLocaleString() || '0'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Calculated Metrics</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Cost per Unit</dt>
                    <dd className="text-sm text-gray-900">
                      {costs.cost_per_unit ? `$${costs.cost_per_unit.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Take Rate</dt>
                    <dd className="text-sm text-gray-900">
                      {costs.estimated_take_rate ? `${costs.estimated_take_rate}%` : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">ARPU</dt>
                    <dd className="text-sm text-gray-900">
                      {costs.arpu ? `$${costs.arpu}` : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Est. Monthly Revenue</dt>
                    <dd className="text-sm text-gray-900">
                      {costs.estimated_monthly_revenue ? `$${costs.estimated_monthly_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Payback Period</dt>
                    <dd className="text-sm text-gray-900">
                      {costs.payback_months ? `${costs.payback_months} months` : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scoring' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Score Breakdown</h3>
                <p className="text-sm text-gray-500">Transparent scoring based on weighted factors</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{property.score.toFixed(1)}</p>
                {getTierBadge(property.tier)}
              </div>
            </div>

            {scoreBreakdown?.breakdown ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raw Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scoreBreakdown.breakdown.map((item: any) => (
                    <tr key={item.factor}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">
                        {item.factor.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.raw_value !== null && item.raw_value !== undefined
                          ? typeof item.raw_value === 'object'
                            ? JSON.stringify(item.raw_value)
                            : `${item.raw_value} ${item.unit || ''}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{(item.weight * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.points.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">Total Score</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{scoreBreakdown.total_score.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-gray-500">Loading score breakdown...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
