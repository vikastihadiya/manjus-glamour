-- ============================================================
-- MANJU'S THE WORLD OF GLAMOUR
-- COMPLETE SUPABASE DATABASE REPAIR
-- Run this ONCE in Supabase -> SQL Editor.
-- ============================================================

-- ---------- TABLES / COLUMNS ----------

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  customer_name text,
  phone text,
  service text,
  service_name text,
  date date,
  time text,
  status text DEFAULT 'New',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  price numeric,
  duration text,
  category text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  original_price numeric,
  offer_price numeric,
  start_date timestamptz,
  end_date timestamptz,
  terms text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  name text,
  category text,
  description text,
  date date,
  featured boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bride_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  name text,
  category text,
  description text,
  date date,
  featured boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  name text,
  category text,
  description text,
  date date,
  featured boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.before_after (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  before_image_url text,
  after_image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bridal_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  price numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  title text,
  description text,
  message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text,
  answer text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  value text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing tables without deleting data.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status text DEFAULT 'New';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS offer_price numeric;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['gallery','bride_gallery','customer_gallery'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS title text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS name text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS category text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS description text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS date date', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS image_url text', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()', t);
  END LOOP;
END $$;

ALTER TABLE public.before_after ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.before_after ADD COLUMN IF NOT EXISTS before_image_url text;
ALTER TABLE public.before_after ADD COLUMN IF NOT EXISTS after_image_url text;
ALTER TABLE public.before_after ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.bridal_packages ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.bridal_packages ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.bridal_packages ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE public.bridal_packages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.team ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.team ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS question text;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- If an old settings table contains values but no keys, these six rows
-- make the new settings screen usable. Existing keys are preserved.
INSERT INTO public.settings (key,value)
SELECT v.key, v.value
FROM (VALUES
  ('business_name','Manju''s The World of Glamour'),
  ('artist_name','Manju Chaudhary'),
  ('phone','+91 88267 74495'),
  ('whatsapp','918826774495'),
  ('email','manjustudio83@gmail.com'),
  ('address','F-22/170, 2nd Floor, Sector 3, Rohini, New Delhi - 110085')
) AS v(key,value)
WHERE NOT EXISTS (
  SELECT 1 FROM public.settings s WHERE s.key = v.key
);

-- ---------- RLS ----------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bride_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridal_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Remove only policies created by this repair, then recreate them.
DROP POLICY IF EXISTS manju_public_appointments_insert ON public.appointments;
DROP POLICY IF EXISTS manju_admin_appointments_select ON public.appointments;
DROP POLICY IF EXISTS manju_admin_appointments_update ON public.appointments;
DROP POLICY IF EXISTS manju_admin_appointments_delete ON public.appointments;
CREATE POLICY manju_public_appointments_insert ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY manju_admin_appointments_select ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY manju_admin_appointments_update ON public.appointments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY manju_admin_appointments_delete ON public.appointments FOR DELETE TO authenticated USING (true);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['services','offers','gallery','bride_gallery','customer_gallery','before_after','bridal_packages','team','testimonials','faqs','settings'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS manju_public_%I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS manju_admin_%I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS manju_admin_%I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS manju_admin_%I_delete ON public.%I', t, t);
    EXECUTE format('CREATE POLICY manju_public_%I_select ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY manju_admin_%I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY manju_admin_%I_update ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY manju_admin_%I_delete ON public.%I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- ---------- STORAGE ----------
INSERT INTO storage.buckets (id,name,public) VALUES
('gallery','gallery',true),
('bride-gallery','bride-gallery',true),
('customer-gallery','customer-gallery',true),
('before-after','before-after',true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS manju_storage_public_read ON storage.objects;
DROP POLICY IF EXISTS manju_storage_auth_insert ON storage.objects;
DROP POLICY IF EXISTS manju_storage_auth_update ON storage.objects;
DROP POLICY IF EXISTS manju_storage_auth_delete ON storage.objects;

CREATE POLICY manju_storage_public_read ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id IN ('gallery','bride-gallery','customer-gallery','before-after'));

CREATE POLICY manju_storage_auth_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('gallery','bride-gallery','customer-gallery','before-after'));

CREATE POLICY manju_storage_auth_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id IN ('gallery','bride-gallery','customer-gallery','before-after'))
WITH CHECK (bucket_id IN ('gallery','bride-gallery','customer-gallery','before-after'));

CREATE POLICY manju_storage_auth_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('gallery','bride-gallery','customer-gallery','before-after'));

-- Done.
