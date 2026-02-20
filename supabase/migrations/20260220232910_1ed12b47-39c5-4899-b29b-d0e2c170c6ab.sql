
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Holdings table
CREATE TABLE public.holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  logo_url TEXT,
  amount_invested NUMERIC,
  shares NUMERIC,
  price_at_purchase NUMERIC,
  captured_image_url TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holdings"
  ON public.holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings"
  ON public.holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings"
  ON public.holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings"
  ON public.holdings FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for captured images
INSERT INTO storage.buckets (id, name, public) VALUES ('captured-images', 'captured-images', true);

CREATE POLICY "Anyone can view captured images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'captured-images');

CREATE POLICY "Authenticated users can upload captured images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'captured-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own captured images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'captured-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own captured images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'captured-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger to auto-create profile (will be called from edge function which sets the wallet_address via metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, wallet_address)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'wallet_address', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
