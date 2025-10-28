import { useState, useEffect, useCallback } from 'react';
import { AssetType, Exchange } from '@/types/trading';
import { fetchMarketPrice } from '@/lib/market-data';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
  assetType: AssetType;
  exchange: Exchange;
}

interface AssetConfig {
  symbol: string;
  assetType: AssetType;
  exchange: Exchange;
}

export const useMultiAssetPrice = (assets: AssetConfig[]) => {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchInitialPrices = useCallback(async () => {
    try {
      setLoading(true);
      const pricePromises = assets.map(async (asset) => {
        const price = await fetchMarketPrice({
          exchange: asset.exchange,
          assetType: asset.assetType,
          symbol: asset.symbol,
        });

        if (price) {
          return {
            symbol: asset.symbol,
            price,
            change24h: (Math.random() - 0.5) * 10, // Mock change for now
            volume: Math.random() * 1000000000,
            high24h: price * (1 + Math.random() * 0.05),
            low24h: price * (1 - Math.random() * 0.05),
            assetType: asset.assetType,
            exchange: asset.exchange,
          };
        }

        // Fallback to mock data
        return {
          symbol: asset.symbol,
          price: Math.random() * 70000 + 10000,
          change24h: (Math.random() - 0.5) * 10,
          volume: Math.random() * 1000000000,
          high24h: Math.random() * 75000 + 15000,
          low24h: Math.random() * 65000 + 5000,
          assetType: asset.assetType,
          exchange: asset.exchange,
        };
      });

      const priceData = await Promise.all(pricePromises);
      const priceMap = new Map(priceData.map(p => [p.symbol, p]));
      setPrices(priceMap);
    } catch (error) {
      console.error('Error fetching multi-asset prices:', error);
      // Use mock data as fallback
      const mockPrices = new Map(
        assets.map(asset => [
          asset.symbol,
          {
            symbol: asset.symbol,
            price: Math.random() * 70000 + 10000,
            change24h: (Math.random() - 0.5) * 10,
            volume: Math.random() * 1000000000,
            high24h: Math.random() * 75000 + 15000,
            low24h: Math.random() * 65000 + 5000,
            assetType: asset.assetType,
            exchange: asset.exchange,
          }
        ])
      );
      setPrices(mockPrices);
    } finally {
      setLoading(false);
    }
  }, [assets]);

  useEffect(() => {
    if (assets.length === 0) {
      setLoading(false);
      return;
    }

    fetchInitialPrices();

    // Polling for price updates
    const pollInterval = setInterval(() => {
      fetchInitialPrices();
    }, 10000); // Update every 10 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [assets, fetchInitialPrices]);

  const getPrice = useCallback((symbol: string): PriceData | undefined => {
    return prices.get(symbol);
  }, [prices]);

  return { prices, loading, getPrice, refetch: fetchInitialPrices };
};
