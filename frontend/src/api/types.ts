/**
 * TypeScript types for the GVTC Fiber Expansion Platform
 */

export type UserRole = 'admin' | 'analyst' | 'viewer';

export type PropertyType = 'MDU' | 'Subdivision';

export type PropertyStatus = 
  | 'Prospect'
  | 'Contacted'
  | 'In Negotiation'
  | 'Committed'
  | 'Under Construction'
  | 'Completed'
  | 'On Hold'
  | 'Declined';

export type PropertyPhase = 
  | 'Pre-Development'
  | 'Planning'
  | 'Permitting'
  | 'Construction'
  | 'Occupancy'
  | 'Stabilized';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Property {
  id: number;
  name: string;
  property_type: PropertyType;
  status: PropertyStatus;
  phase: PropertyPhase;
  address?: string;
  city?: string;
  county: string;
  state: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  units?: number;
  buildings?: number;
  stories?: number;
  lots?: number;
  phases?: number;
  current_phase?: number;
  break_ground_date?: string;
  expected_delivery_date?: string;
  stabilization_date?: string;
  fiber_distance_gvtc?: number;
  fiber_distance_lease?: number;
  lease_partner?: string;
  has_fiber_access: boolean;
  competitors?: any[];
  competitor_count: number;
  median_income?: number;
  population_density?: number;
  census_tract?: string;
  nearby_schools: number;
  nearby_libraries: number;
  notes?: string;
  source: string;
  score: number;
  tier: number;
  score_breakdown?: ScoreBreakdown[];
  last_scored_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyListItem {
  id: number;
  name: string;
  property_type: PropertyType;
  status: PropertyStatus;
  city?: string;
  county: string;
  units?: number;
  lots?: number;
  score: number;
  tier: number;
  latitude?: number;
  longitude?: number;
}

export interface PropertyCreate {
  name: string;
  property_type: PropertyType;
  status?: PropertyStatus;
  phase?: PropertyPhase;
  address?: string;
  city?: string;
  county: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  units?: number;
  buildings?: number;
  stories?: number;
  lots?: number;
  phases?: number;
  current_phase?: number;
  break_ground_date?: string;
  expected_delivery_date?: string;
  fiber_distance_gvtc?: number;
  fiber_distance_lease?: number;
  lease_partner?: string;
  competitor_count?: number;
  median_income?: number;
  population_density?: number;
  nearby_schools?: number;
  nearby_libraries?: number;
  notes?: string;
}

export interface PropertyUpdate extends Partial<PropertyCreate> {}

export interface ScoreBreakdown {
  factor: string;
  raw_value: any;
  weight: number;
  points: number;
  unit?: string;
}

export interface PropertyStats {
  total_properties: number;
  by_type: Record<string, number>;
  by_tier: Record<string, number>;
  by_status: Record<string, number>;
  total_units: number;
  total_lots: number;
  average_score: number;
}

export interface Organization {
  id: number;
  name: string;
  org_type?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface OrganizationCreate {
  name: string;
  org_type?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  notes?: string;
}

export interface Contact {
  id: number;
  organization_id?: number;
  first_name: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary?: boolean;
  notes?: string;
  organization_id?: number;
}

export interface PropertyContact extends Contact {
  relationship_role?: string;
  relationship_strength?: number;
}

export interface PropertyOrganization extends Organization {
  role?: string;
  is_primary?: boolean;
}

export interface Document {
  id: number;
  property_id: number;
  filename: string;
  original_filename?: string;
  file_type?: string;
  file_size?: number;
  document_type?: string;
  description?: string;
  created_at: string;
}

export interface PropertyCost {
  id: number;
  property_id: number;
  build_cost: number;
  lateral_cost: number;
  make_ready_cost: number;
  drop_cost: number;
  equipment_cost: number;
  lease_monthly: number;
  lease_term_months?: number;
  estimated_take_rate?: number;
  arpu?: number;
  total_capex?: number;
  cost_per_unit?: number;
  estimated_monthly_revenue?: number;
  payback_months?: number;
  assumptions?: string;
  notes?: string;
  updated_at: string;
}

export interface PropertyCostUpdate {
  build_cost?: number;
  lateral_cost?: number;
  make_ready_cost?: number;
  drop_cost?: number;
  equipment_cost?: number;
  lease_monthly?: number;
  lease_term_months?: number;
  estimated_take_rate?: number;
  arpu?: number;
  assumptions?: string;
  notes?: string;
}

export interface ImportJob {
  id: number;
  filename?: string;
  import_type?: string;
  status: string;
  total_rows?: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors?: { row?: number; error: string }[];
  created_at: string;
  completed_at?: string;
}

export interface PropertyFilter {
  county?: string;
  property_type?: PropertyType;
  status?: PropertyStatus;
  tier?: number;
  search?: string;
  min_lat?: number;
  max_lat?: number;
  min_lng?: number;
  max_lng?: number;
}
