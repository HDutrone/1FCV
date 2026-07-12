export type ListingType = 'sale' | 'rent';
export type PropertyType = 'house' | 'apartment' | 'villa' | 'studio' | 'commercial' | 'land';
export type PropertyStatus = 'pending' | 'approved' | 'active' | 'sold' | 'rented' | 'inactive';
export type UserRole = 'tenant' | 'owner' | 'admin' | 'buyer' | 'seller' | 'agent' | 'promoter' | 'investor';
export type InterestStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

export interface City {
  id: string;
  name: string;
  created_at: string;
}

export interface Commune {
  id: string;
  city_id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  anonymous_id: string;
  role: UserRole;
  avatar_url: string;
  city_id: string | null;
  commune_id: string | null;
  bio: string;
  is_verified: boolean;
  commission_rate: number;
  kyc_verified: boolean;
  agency_name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  is_primary: boolean;
  order_index: number;
  created_at: string;
}

export interface OwnerCriteria {
  id: string;
  property_id: string;
  min_monthly_income: number | null;
  max_occupants: number;
  allowed_profiles: string[];
  pets_allowed: boolean;
  smoking_allowed: boolean;
  min_stay_months: number;
  requires_guarantor: boolean;
  advance_months: number;
  additional_requirements: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  listing_type: ListingType;
  title: string;
  description: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  surface_area: number;
  city_id: string;
  commune_id: string | null;
  address_hint: string;
  latitude: number | null;
  longitude: number | null;
  property_type: PropertyType;
  status: PropertyStatus;
  is_furnished: boolean;
  has_garage: boolean;
  has_pool: boolean;
  has_garden: boolean;
  has_security: boolean;
  keywords: string[];
  views_count: number;
  created_at: string;
  updated_at: string;
  city?: City;
  commune?: Commune;
  property_images?: PropertyImage[];
  owner_criteria?: OwnerCriteria[];
}

export interface TenantInterest {
  id: string;
  tenant_id: string;
  property_id: string;
  message: string;
  status: InterestStatus;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  owner_id: string;
  interest_id: string | null;
  status: string;
  last_message_at: string;
  created_at: string;
  property?: Property;
  tenant?: Profile;
  owner?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property;
}

export interface PropertyFilters {
  listingType: ListingType;
  cityId?: string;
  communeId?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  isFurnished?: boolean;
  hasGarage?: boolean;
  hasPool?: boolean;
  hasGarden?: boolean;
  hasSecurity?: boolean;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';
export type PaymentMethod = 'mpesa' | 'airtel' | 'orange';

export interface SubscriptionPlan {
  id: string;
  name: string;
  target_role: UserRole;
  price_cdf: number;
  price_usd: number;
  features: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  payment_method: string;
  payment_reference: string;
  started_at: string;
  expires_at: string;
  trial_ends_at: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface DailyUsage {
  id: string;
  user_id: string;
  usage_date: string;
  search_count: number;
  interest_count: number;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  labelFr: string;
  description: string;
  isPro: boolean;
  canPublish: boolean;
  canSearch: boolean;
  defaultListingType: ListingType | null;
  color: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  tenant: {
    role: 'tenant',
    label: 'Locataire',
    labelFr: 'Locataire / Chercheur',
    description: 'Je recherche un bien à louer',
    isPro: false,
    canPublish: false,
    canSearch: true,
    defaultListingType: 'rent',
    color: '#0F3D68',
  },
  buyer: {
    role: 'buyer',
    label: 'Acheteur',
    labelFr: 'Acheteur',
    description: 'Je recherche un bien à acheter',
    isPro: false,
    canPublish: false,
    canSearch: true,
    defaultListingType: 'sale',
    color: '#0D7490',
  },
  owner: {
    role: 'owner',
    label: 'Propriétaire',
    labelFr: 'Propriétaire',
    description: 'Je publie mes biens en location',
    isPro: false,
    canPublish: true,
    canSearch: false,
    defaultListingType: 'rent',
    color: '#C9962B',
  },
  seller: {
    role: 'seller',
    label: 'Vendeur',
    labelFr: 'Vendeur',
    description: 'Je vends mes propres biens',
    isPro: false,
    canPublish: true,
    canSearch: false,
    defaultListingType: 'sale',
    color: '#DC6B2F',
  },
  agent: {
    role: 'agent',
    label: 'Agent',
    labelFr: 'Courtier / Agent',
    description: 'Je gère des biens pour le compte de tiers',
    isPro: true,
    canPublish: true,
    canSearch: true,
    defaultListingType: null,
    color: '#7C3AED',
  },
  promoter: {
    role: 'promoter',
    label: 'Promoteur',
    labelFr: 'Promoteur Immobilier',
    description: 'Je développe des projets multi-unités',
    isPro: true,
    canPublish: true,
    canSearch: false,
    defaultListingType: 'sale',
    color: '#059669',
  },
  investor: {
    role: 'investor',
    label: 'Investisseur',
    labelFr: 'Investisseur',
    description: 'Je constitue un portefeuille immobilier',
    isPro: true,
    canPublish: false,
    canSearch: true,
    defaultListingType: null,
    color: '#B45309',
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    labelFr: 'Administrateur',
    description: 'Accès complet à la plateforme',
    isPro: true,
    canPublish: true,
    canSearch: true,
    defaultListingType: null,
    color: '#374151',
  },
};

export function isPublisher(role: UserRole): boolean {
  return ['owner', 'seller', 'agent', 'promoter', 'admin'].includes(role);
}

export function isSearcher(role: UserRole): boolean {
  return ['tenant', 'buyer', 'investor', 'agent', 'admin'].includes(role);
}

export function isProfessional(role: UserRole): boolean {
  return ['agent', 'promoter', 'investor'].includes(role);
}
