-- Allow anyone to read holdings for the public feed
CREATE POLICY "Anyone can view holdings for feed"
ON public.holdings
FOR SELECT
USING (true);

-- Allow anyone to read profiles for the public feed (wallet addresses)
CREATE POLICY "Anyone can view profiles for feed"
ON public.profiles
FOR SELECT
USING (true);

-- Drop the old restrictive SELECT policies
DROP POLICY "Users can view their own holdings" ON public.holdings;
DROP POLICY "Users can view their own profile" ON public.profiles;