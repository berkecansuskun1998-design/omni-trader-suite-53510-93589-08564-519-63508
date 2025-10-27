-- Create user_positions table for real trading positions
CREATE TABLE IF NOT EXISTS public.user_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    entry_price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    current_price NUMERIC(20, 8),
    leverage INTEGER DEFAULT 1,
    stop_loss NUMERIC(20, 8),
    take_profit NUMERIC(20, 8),
    realized_pnl NUMERIC(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_watchlist table for tracking symbols
CREATE TABLE IF NOT EXISTS public.user_watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Create trading_orders table for order history
CREATE TABLE IF NOT EXISTS public.trading_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
    quantity NUMERIC(20, 8) NOT NULL,
    price NUMERIC(20, 8),
    filled_quantity NUMERIC(20, 8) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
    leverage INTEGER DEFAULT 1,
    position_id UUID REFERENCES public.user_positions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_positions
CREATE POLICY "Users can view their own positions"
    ON public.user_positions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions"
    ON public.user_positions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
    ON public.user_positions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own positions"
    ON public.user_positions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for user_watchlist
CREATE POLICY "Users can view their own watchlist"
    ON public.user_watchlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist"
    ON public.user_watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their watchlist"
    ON public.user_watchlist FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist"
    ON public.user_watchlist FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for trading_orders
CREATE POLICY "Users can view their own orders"
    ON public.trading_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON public.trading_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON public.trading_orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all positions"
    ON public.user_positions FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all watchlists"
    ON public.user_watchlist FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all orders"
    ON public.trading_orders FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_user_positions_updated_at
    BEFORE UPDATE ON public.user_positions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_orders_updated_at
    BEFORE UPDATE ON public.trading_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();