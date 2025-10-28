-- Add asset types and multi-market support
CREATE TYPE public.asset_type AS ENUM ('crypto', 'stock', 'forex', 'commodity', 'index');
CREATE TYPE public.market_type AS ENUM ('spot', 'futures', 'options', 'cfd');

-- Update trading_orders table for multi-asset support
ALTER TABLE public.trading_orders 
ADD COLUMN IF NOT EXISTS asset_type public.asset_type DEFAULT 'crypto',
ADD COLUMN IF NOT EXISTS market_type public.market_type DEFAULT 'spot',
ADD COLUMN IF NOT EXISTS exchange VARCHAR,
ADD COLUMN IF NOT EXISTS trading_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC;

-- Update user_positions for multi-asset
ALTER TABLE public.user_positions
ADD COLUMN IF NOT EXISTS asset_type public.asset_type DEFAULT 'crypto',
ADD COLUMN IF NOT EXISTS market_type public.market_type DEFAULT 'spot',
ADD COLUMN IF NOT EXISTS exchange VARCHAR,
ADD COLUMN IF NOT EXISTS total_fees NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_paid NUMERIC DEFAULT 0;

-- Update watchlist for multi-asset
ALTER TABLE public.user_watchlist
ADD COLUMN IF NOT EXISTS asset_type public.asset_type DEFAULT 'crypto',
ADD COLUMN IF NOT EXISTS exchange VARCHAR,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Trading fees configuration table
CREATE TABLE IF NOT EXISTS public.trading_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type public.asset_type NOT NULL,
    market_type public.market_type NOT NULL,
    exchange VARCHAR,
    maker_fee NUMERIC NOT NULL DEFAULT 0.001,
    taker_fee NUMERIC NOT NULL DEFAULT 0.002,
    min_fee NUMERIC DEFAULT 0,
    max_fee NUMERIC,
    platform_commission_rate NUMERIC NOT NULL DEFAULT 0.0001, -- 0.01% platform cut
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commission earnings tracking
CREATE TABLE IF NOT EXISTS public.commission_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_id UUID REFERENCES public.trading_orders(id),
    position_id UUID REFERENCES public.user_positions(id),
    amount NUMERIC NOT NULL,
    asset_type public.asset_type NOT NULL,
    symbol VARCHAR NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Market data sources configuration
CREATE TABLE IF NOT EXISTS public.market_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    asset_type public.asset_type NOT NULL,
    api_endpoint TEXT,
    websocket_endpoint TEXT,
    rate_limit_per_minute INTEGER,
    requires_api_key BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trading_fees
CREATE POLICY "Anyone can view active trading fees"
ON public.trading_fees FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage trading fees"
ON public.trading_fees FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for commission_earnings
CREATE POLICY "Users can view their own commission earnings"
ON public.commission_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all commission earnings"
ON public.commission_earnings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create commission records"
ON public.commission_earnings FOR INSERT
WITH CHECK (true);

-- RLS Policies for market_data_sources
CREATE POLICY "Anyone can view active data sources"
ON public.market_data_sources FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage data sources"
ON public.market_data_sources FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_trading_fees_updated_at
BEFORE UPDATE ON public.trading_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fee structures
INSERT INTO public.trading_fees (asset_type, market_type, exchange, maker_fee, taker_fee, platform_commission_rate) VALUES
('crypto', 'spot', 'BINANCE', 0.001, 0.001, 0.0001),
('crypto', 'futures', 'BINANCE', 0.0002, 0.0004, 0.0001),
('stock', 'spot', 'NASDAQ', 0.0, 0.0, 0.0005),
('stock', 'spot', 'NYSE', 0.0, 0.0, 0.0005),
('forex', 'spot', 'FOREX', 0.0001, 0.0001, 0.00005),
('commodity', 'futures', 'CME', 0.0005, 0.0005, 0.0001);

-- Insert default market data sources
INSERT INTO public.market_data_sources (name, asset_type, api_endpoint, websocket_endpoint, rate_limit_per_minute, requires_api_key, active) VALUES
('Binance', 'crypto', 'https://api.binance.com/api/v3', 'wss://stream.binance.com:9443/ws', 1200, false, true),
('Alpha Vantage', 'stock', 'https://www.alphavantage.co/query', null, 5, true, true),
('Finnhub', 'stock', 'https://finnhub.io/api/v1', 'wss://ws.finnhub.io', 60, true, true),
('Polygon.io', 'stock', 'https://api.polygon.io/v2', 'wss://socket.polygon.io', 200, true, true),
('Forex API', 'forex', 'https://api.exchangerate-api.com/v4/latest', null, 100, false, true);