import { createWeb3Modal } from '@web3modal/wagmi/react';
import { http, createConfig } from 'wagmi';
import { mainnet, arbitrum, polygon, optimism, base, bsc } from 'wagmi/chains';

export const projectId = 'demo-project-id';

const metadata = {
  name: 'OMNI Trading Terminal',
  description: 'Professional Trading Terminal with Web3 Integration',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const config = createConfig({
  chains: [mainnet, arbitrum, polygon, optimism, base, bsc],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
});

if (typeof window !== 'undefined') {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': 'hsl(var(--primary))',
      '--w3m-border-radius-master': '8px',
    }
  });
}
