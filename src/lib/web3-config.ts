import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, polygon, bsc, arbitrum, optimism, base } from 'wagmi/chains'

export const projectId = 'f8e5c5a0c5d4e3b2a1f9e8d7c6b5a4f3' // WalletConnect Project ID

const metadata = {
  name: 'OmniTerminal',
  description: 'Professional Multi-Exchange & DEX Trading Terminal',
  url: 'https://omniterminal.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const chains = [mainnet, polygon, bsc, arbitrum, optimism, base] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
})

export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    color: '#627EEA'
  },
  bsc: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpc: 'https://bsc-dataseed.binance.org',
    explorer: 'https://bscscan.com',
    color: '#F3BA2F'
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    color: '#8247E5'
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    color: '#28A0F0'
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpc: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    color: '#FF0420'
  },
  base: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    color: '#0052FF'
  }
}

export const DEX_ROUTERS = {
  ethereum: {
    uniswap: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
  },
  bsc: {
    pancakeswap: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  },
  polygon: {
    quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  }
}

export const PAYMENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1' // Sabit cüzdan adresi
