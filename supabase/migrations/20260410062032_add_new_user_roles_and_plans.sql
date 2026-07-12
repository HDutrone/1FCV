/*
  # Add New User Roles and Update Subscription Plans

  ## Summary
  Expands the user role system from 3 roles (tenant, owner, admin) to 8 roles,
  reflecting a full real estate marketplace with buyers, sellers, agents, promoters,
  and investors. Updates subscription plans with proper CDF pricing per role.

  ## New Roles Added
  - `buyer` - Acheteur: searches for properties to purchase (ROI filters, loan simulations)
  - `seller` - Vendeur: lists their own properties for sale (100% commission, price negotiations)
  - `agent` - Courtier/Agent: manages third-party properties (50/50 commission split, KPI tracking)
  - `promoter` - Promoteur: manages new multi-unit development projects
  - `investor` - Investisseur: portfolio analytics, IRR calculations

  ## Existing Roles Retained
  - `tenant` - Locataire/Chercheur: searches for rental properties
  - `owner` - Propriétaire: lists rental properties
  - `admin` - Administrateur: full platform access

  ## Database Changes
  - Add `commission_rate`, `kyc_verified`, `agency_name`, `phone_number` columns to profiles
  - Add new subscription plans for each new role
  - Mark old plans as inactive instead of deleting (preserves FK integrity)

  ## Notes
  - All changes are additive (no existing data dropped)
  - Old plans marked inactive, new plans added
*/

-- ============================================================
-- 1. UPDATE profiles TABLE WITH NEW COLUMNS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN commission_rate numeric(4,2) DEFAULT 0.50;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'kyc_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN kyc_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN agency_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number text DEFAULT '';
  END IF;
END $$;

-- ============================================================
-- 2. MARK OLD PLANS AS INACTIVE & ADD NEW PLANS
-- ============================================================

UPDATE public.subscription_plans SET is_active = false WHERE is_active = true;

INSERT INTO public.subscription_plans (name, target_role, price_cdf, price_usd, features, is_active) VALUES

-- TENANT (Locataire/Chercheur)
('Gratuit Locataire', 'tenant', 0, 0, '{
  "searches_per_day": 5,
  "interests_per_week": 3,
  "max_listings": 0,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Recherche basique avec 5 recherches/jour"
}', true),

('Premium Locataire', 'tenant', 10000, 4, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": 0,
  "alerts": true,
  "no_ads": true,
  "priority_visits": true,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Recherches illimitées, alertes, visites prioritaires"
}', true),

-- BUYER (Acheteur)
('Gratuit Acheteur', 'buyer', 0, 0, '{
  "searches_per_day": 5,
  "interests_per_week": 3,
  "max_listings": 0,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Recherche achat basique"
}', true),

('Premium Acheteur', 'buyer', 10000, 4, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": 0,
  "alerts": true,
  "no_ads": true,
  "priority_visits": true,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": true,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Illimité + simulations prêt + filtres ROI"
}', true),

-- OWNER (Propriétaire)
('Gratuit Propriétaire', 'owner', 0, 0, '{
  "searches_per_day": 5,
  "interests_per_week": 0,
  "max_listings": 1,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "1 annonce gratuite"
}', true),

('Premium Propriétaire', 'owner', 20000, 8, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": -1,
  "alerts": true,
  "no_ads": true,
  "priority_visits": false,
  "boost": true,
  "lead_stats": true,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Annonces illimitées + boost + statistiques leads"
}', true),

-- SELLER (Vendeur)
('Gratuit Vendeur', 'seller', 0, 0, '{
  "searches_per_day": 5,
  "interests_per_week": 0,
  "max_listings": 1,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "1 annonce vente gratuite"
}', true),

('Premium Vendeur', 'seller', 20000, 8, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": -1,
  "alerts": true,
  "no_ads": true,
  "priority_visits": false,
  "boost": true,
  "lead_stats": true,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Ventes illimitées + boost + gestion offres concurrentes"
}', true),

-- AGENT / COURTIER
('Gratuit Agent', 'agent', 0, 0, '{
  "searches_per_day": 10,
  "interests_per_week": 5,
  "max_listings": 3,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": true,
  "description": "3 biens gérés, split commission 50/50"
}', true),

('Premium Agent', 'agent', 25000, 10, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": -1,
  "alerts": true,
  "no_ads": true,
  "priority_visits": true,
  "boost": true,
  "lead_stats": true,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": true,
  "description": "Biens illimités + KPI + split commission optimisé"
}', true),

-- PROMOTER (Promoteur)
('Gratuit Promoteur', 'promoter', 0, 0, '{
  "searches_per_day": 10,
  "interests_per_week": 0,
  "max_listings": 1,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "1 projet promotionnel"
}', true),

('Premium Promoteur', 'promoter', 50000, 20, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": -1,
  "alerts": true,
  "no_ads": true,
  "priority_visits": false,
  "boost": true,
  "lead_stats": true,
  "loan_simulation": false,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Projets multi-unité illimités + CA promotions"
}', true),

-- INVESTOR (Investisseur)
('Gratuit Investisseur', 'investor', 0, 0, '{
  "searches_per_day": 10,
  "interests_per_week": 5,
  "max_listings": 0,
  "alerts": false,
  "no_ads": false,
  "priority_visits": false,
  "boost": false,
  "lead_stats": false,
  "loan_simulation": true,
  "portfolio_analytics": false,
  "commission_split": false,
  "description": "Recherche investissement basique"
}', true),

('Premium Investisseur', 'investor', 30000, 12, '{
  "searches_per_day": -1,
  "interests_per_week": -1,
  "max_listings": 0,
  "alerts": true,
  "no_ads": true,
  "priority_visits": true,
  "boost": false,
  "lead_stats": true,
  "loan_simulation": true,
  "portfolio_analytics": true,
  "commission_split": false,
  "description": "Portefeuille analytics + IRR + simulations prêt illimitées"
}', true);
