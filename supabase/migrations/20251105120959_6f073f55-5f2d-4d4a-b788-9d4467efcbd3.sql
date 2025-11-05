-- Update RLS policies to require authentication for business-sensitive data

-- Update market_data_sources table policy
DROP POLICY IF EXISTS "Public can view active data sources" ON public.market_data_sources;

CREATE POLICY "Authenticated users can view active data sources"
ON public.market_data_sources
FOR SELECT
USING (auth.uid() IS NOT NULL AND active = true);

-- Update trading_fees table policy
DROP POLICY IF EXISTS "Public can view active fees" ON public.trading_fees;

CREATE POLICY "Authenticated users can view active fees"
ON public.trading_fees
FOR SELECT
USING (auth.uid() IS NOT NULL AND active = true);

-- Update payment_addresses table policy
DROP POLICY IF EXISTS "Public can view active addresses" ON public.payment_addresses;

CREATE POLICY "Authenticated users can view active addresses"
ON public.payment_addresses
FOR SELECT
USING (auth.uid() IS NOT NULL AND active = true);