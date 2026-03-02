
CREATE TABLE public.beta_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert beta signups"
  ON public.beta_signups
  FOR INSERT
  WITH CHECK (true);
