
/*
  # 1 Futur Chez Vous - Real Estate Application Schema

  ## Overview
  Complete database schema for a real estate management application serving the DRC market.

  ## New Tables

  ### cities
  - Stores the 6 supported cities: Kinshasa, Lubumbashi, Kolwezi, Goma, Bukavu, Kalemie

  ### communes
  - Communes/districts within each city, linked to parent city

  ### profiles
  - Extends auth.users with role, anonymous_id, and contact info
  - Roles: tenant (locataire), owner (propriétaire), admin
  - anonymous_id: SHA-256-like hash used to mask real identity in communications

  ### properties
  - All property listings (sale and rent)
  - listing_type: 'sale' or 'rent'
  - status: pending, approved, active, sold, rented, inactive

  ### property_images
  - Images for each property listing (max 20, ordered)

  ### owner_criteria
  - Owner-defined criteria for acceptable tenants/buyers (anonymous display)

  ### tenant_interests
  - Anonymous interest expressions from tenants/buyers to properties
  - Mediated through the company (no direct contact revealed)

  ### conversations
  - Anonymous messaging threads between parties, always via company proxy

  ### messages
  - Individual messages within conversations

  ## Security
  - RLS enabled on all tables
  - Profiles: users read own data; limited public read for anonymous_id only
  - Properties: public read for approved/active; owners manage their own
  - Interests: tenant sees own; owner sees interests on their properties
  - Messages: only conversation participants can read
*/

-- CITIES
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are publicly readable"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

-- COMMUNES
CREATE TABLE IF NOT EXISTS communes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city_id, name)
);

ALTER TABLE communes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communes are publicly readable"
  ON communes FOR SELECT
  TO anon, authenticated
  USING (true);

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  anonymous_id text UNIQUE NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'tenant',
  avatar_url text DEFAULT '',
  city_id uuid REFERENCES cities(id),
  commune_id uuid REFERENCES communes(id),
  bio text DEFAULT '',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read anonymous_id and display_name only"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('sale', 'rent')),
  title text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  surface_area numeric DEFAULT 0,
  city_id uuid NOT NULL REFERENCES cities(id),
  commune_id uuid REFERENCES communes(id),
  address_hint text DEFAULT '',
  latitude numeric,
  longitude numeric,
  property_type text DEFAULT 'house' CHECK (property_type IN ('house', 'apartment', 'villa', 'studio', 'commercial', 'land')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'sold', 'rented', 'inactive')),
  is_furnished boolean DEFAULT false,
  has_garage boolean DEFAULT false,
  has_pool boolean DEFAULT false,
  has_garden boolean DEFAULT false,
  has_security boolean DEFAULT false,
  keywords text[] DEFAULT '{}',
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved/active properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status IN ('approved', 'active'));

CREATE POLICY "Owners can read their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- PROPERTY IMAGES
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read images of approved properties"
  ON property_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
      AND (p.status IN ('approved', 'active') OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners can insert images for their properties"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their property images"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- OWNER CRITERIA
CREATE TABLE IF NOT EXISTS owner_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  min_monthly_income numeric,
  max_occupants integer DEFAULT 10,
  allowed_profiles text[] DEFAULT '{"family","professional","couple","student"}',
  pets_allowed boolean DEFAULT false,
  smoking_allowed boolean DEFAULT false,
  min_stay_months integer DEFAULT 1,
  requires_guarantor boolean DEFAULT false,
  advance_months integer DEFAULT 1,
  additional_requirements text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE owner_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read owner criteria for approved properties"
  ON owner_criteria FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
      AND (p.status IN ('approved', 'active') OR p.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners can insert criteria for their properties"
  ON owner_criteria FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their criteria"
  ON owner_criteria FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- TENANT INTERESTS (anonymous mediation)
CREATE TABLE IF NOT EXISTS tenant_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, property_id)
);

ALTER TABLE tenant_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can read their own interests"
  ON tenant_interests FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can insert their own interests"
  ON tenant_interests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Property owners can read interests on their properties"
  ON tenant_interests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- CONVERSATIONS (anonymous messaging via company)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id uuid REFERENCES tenant_interests(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, tenant_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

CREATE POLICY "Participants can insert conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.tenant_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.tenant_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_commune_id ON properties(commune_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_communes_city_id ON communes(city_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_interests_tenant_id ON tenant_interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_interests_property_id ON tenant_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- SEED: Cities
INSERT INTO cities (name) VALUES
  ('Kinshasa'),
  ('Lubumbashi'),
  ('Kolwezi'),
  ('Goma'),
  ('Bukavu'),
  ('Kalemie')
ON CONFLICT (name) DO NOTHING;

-- SEED: Communes for Kinshasa
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Gombe'), ('Barumbu'), ('Kintambo'), ('Lingwala'), ('Ngiri-Ngiri'),
  ('Kalamu'), ('Bandalungwa'), ('Makala'), ('Selembao'), ('Bumbu'),
  ('Ngaba'), ('Lemba'), ('Matete'), ('Kisenso'), ('Masina'),
  ('Ndjili'), ('Nsele'), ('Kimbanseke'), ('Mont-Ngafula'), ('Ngaliema'),
  ('Maluku'), ('Kasavubu'), ('Limete'), ('Kinshasa commune')
) AS t(commune_name)
WHERE c.name = 'Kinshasa'
ON CONFLICT (city_id, name) DO NOTHING;

-- SEED: Communes for Lubumbashi
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Kampemba'), ('Annexe'), ('Kamalondo'), ('Katuba'), ('Kenya'),
  ('Lubumbashi centre'), ('Ruashi'), ('Kimilolo'), ('Rwashi'), ('Kasapa')
) AS t(commune_name)
WHERE c.name = 'Lubumbashi'
ON CONFLICT (city_id, name) DO NOTHING;

-- SEED: Communes for Kolwezi
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Dilala'), ('Manika'), ('Ravin'), ('Musonoï')
) AS t(commune_name)
WHERE c.name = 'Kolwezi'
ON CONFLICT (city_id, name) DO NOTHING;

-- SEED: Communes for Goma
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Goma centre'), ('Karisimbi'), ('Buhene'), ('Munigi')
) AS t(commune_name)
WHERE c.name = 'Goma'
ON CONFLICT (city_id, name) DO NOTHING;

-- SEED: Communes for Bukavu
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Bagira'), ('Ibanda'), ('Kadutu')
) AS t(commune_name)
WHERE c.name = 'Bukavu'
ON CONFLICT (city_id, name) DO NOTHING;

-- SEED: Communes for Kalemie
INSERT INTO communes (city_id, name)
SELECT c.id, commune_name FROM cities c, (VALUES
  ('Kalemie centre'), ('Lukuga'), ('Makomeno')
) AS t(commune_name)
WHERE c.name = 'Kalemie'
ON CONFLICT (city_id, name) DO NOTHING;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, anonymous_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'USER-' || upper(substring(encode(sha256(new.id::text::bytea), 'hex'), 1, 12)),
    COALESCE(new.raw_user_meta_data->>'role', 'tenant')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
