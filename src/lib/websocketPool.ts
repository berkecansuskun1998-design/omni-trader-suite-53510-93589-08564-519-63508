export interface WebSocketConnection {
  id: string;
  url: string;
  socket: WebSocket | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscriptions: Set<string>;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  lastHeartbeat: Date;
  messageQueue: any[];
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  heartbeatInterval: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  messageBufferSize: number;
}

export class WebSocketConnectionPool {
  private connections: Map<string, WebSocketConnection> = new Map();
  private config: ConnectionPoolConfig = {
    maxConnections: 10,
    heartbeatInterval: 30000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
    messageBufferSize: 1000
  };
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<ConnectionPoolConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async connect(
    id: string,
    url: string,
    onMessage: (data: any) => void,
    protocols?: string[]
  ): Promise<WebSocketConnection> {
    if (this.connections.size >= this.config.maxConnections) {
      throw new Error(`Connection pool limit reached (${this.config.maxConnections})`);
    }

    const existingConn = this.connections.get(id);
    if (existingConn && existingConn.status === 'connected') {
      return existingConn;
    }

    const connection: WebSocketConnection = {
      id,
      url,
      socket: null,
      status: 'connecting',
      subscriptions: new Set(),
      reconnectAttempts: 0,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      reconnectDelay: this.config.reconnectDelay,
      lastHeartbeat: new Date(),
      messageQueue: []
    };

    this.connections.set(id, connection);
    this.messageHandlers.set(id, onMessage);

    await this.establishConnection(connection, protocols);
    return connection;
  }

  private async establishConnection(
    connection: WebSocketConnection,
    protocols?: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(connection.url, protocols);
        connection.socket = socket;

        socket.onopen = () => {
          connection.status = 'connected';
          connection.reconnectAttempts = 0;
          connection.lastHeartbeat = new Date();
          
          this.flushMessageQueue(connection);
          this.startHeartbeat(connection);
          
          resolve();
        };

        socket.onmessage = (event) => {
          connection.lastHeartbeat = new Date();
          
          try {
            const data = JSON.parse(event.data);
            const handler = this.messageHandlers.get(connection.id);
            if (handler) {
              handler(data);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error for ${connection.id}:`, error);
          connection.status = 'error';
        };

        socket.onclose = () => {
          connection.status = 'disconnected';
          this.stopHeartbeat(connection.id);
          
          if (connection.reconnectAttempts < connection.maxReconnectAttempts) {
            this.scheduleReconnect(connection, protocols);
          }
        };
      } catch (error) {
        connection.status = 'error';
        reject(error);
      }
    });
  }

  private scheduleReconnect(connection: WebSocketConnection, protocols?: string[]): void {
    connection.reconnectAttempts++;
    
    const delay = connection.reconnectDelay * Math.pow(2, connection.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (connection.status === 'disconnected') {
        connection.status = 'connecting';
        this.establishConnection(connection, protocols);
      }
    }, delay);
  }

  private startHeartbeat(connection: WebSocketConnection): void {
    const interval = setInterval(() => {
      if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }

      const timeSinceLastHeartbeat = Date.now() - connection.lastHeartbeat.getTime();
      if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
        console.warn(`Connection ${connection.id} appears stale, reconnecting...`);
        this.disconnect(connection.id);
        this.connect(
          connection.id,
          connection.url,
          this.messageHandlers.get(connection.id)!
        );
      }
    }, this.config.heartbeatInterval);

    this.heartbeatIntervals.set(connection.id, interval);
  }

  private stopHeartbeat(connectionId: string): void {
    const interval = this.heartbeatIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(connectionId);
    }
  }

  send(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
      try {
        connection.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send message:', error);
        this.queueMessage(connection, data);
      }
    } else {
      this.queueMessage(connection, data);
    }
  }

  private queueMessage(connection: WebSocketConnection, data: any): void {
    if (connection.messageQueue.length < this.config.messageBufferSize) {
      connection.messageQueue.push(data);
    } else {
      console.warn(`Message queue full for connection ${connection.id}, dropping oldest message`);
      connection.messageQueue.shift();
      connection.messageQueue.push(data);
    }
  }

  private flushMessageQueue(connection: WebSocketConnection): void {
    while (connection.messageQueue.length > 0) {
      const message = connection.messageQueue.shift();
      if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to flush queued message:', error);
          connection.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  subscribe(connectionId: string, channel: string, params?: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    connection.subscriptions.add(channel);
    
    this.send(connectionId, {
      type: 'subscribe',
      channel,
      ...params
    });
  }

  unsubscribe(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    connection.subscriptions.delete(channel);
    
    this.send(connectionId, {
      type: 'unsubscribe',
      channel
    });
  }

  disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    this.stopHeartbeat(connectionId);
    
    if (connection.socket) {
      connection.socket.close();
      connection.socket = null;
    }

    this.connections.delete(connectionId);
    this.messageHandlers.delete(connectionId);
  }

  disconnectAll(): void {
    for (const connectionId of this.connections.keys()) {
      this.disconnect(connectionId);
    }
  }

  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  getConnectionStatus(connectionId: string): string {
    const connection = this.connections.get(connectionId);
    return connection ? connection.status : 'not_found';
  }

  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter(
      conn => conn.status === 'connected'
    ).length;
  }

  getConnectionHealth(): {
    total: number;
    connected: number;
    connecting: number;
    disconnected: number;
    error: number;
  } {
    const connections = Array.from(this.connections.values());
    return {
      total: connections.length,
      connected: connections.filter(c => c.status === 'connected').length,
      connecting: connections.filter(c => c.status === 'connecting').length,
      disconnected: connections.filter(c => c.status === 'disconnected').length,
      error: connections.filter(c => c.status === 'error').length
    };
  }

  async reconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    if (connection.socket) {
      connection.socket.close();
    }

    connection.status = 'connecting';
    connection.reconnectAttempts = 0;

    await this.establishConnection(connection);
    
    for (const channel of connection.subscriptions) {
      this.subscribe(connectionId, channel);
    }
  }

  setMessageHandler(connectionId: string, handler: (data: any) => void): void {
    this.messageHandlers.set(connectionId, handler);
  }

  getStats(): {
    totalConnections: number;
    activeConnections: number;
    totalSubscriptions: number;
    queuedMessages: number;
    reconnectAttempts: number;
  } {
    const connections = Array.from(this.connections.values());
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      totalSubscriptions: connections.reduce((sum, c) => sum + c.subscriptions.size, 0),
      queuedMessages: connections.reduce((sum, c) => sum + c.messageQueue.length, 0),
      reconnectAttempts: connections.reduce((sum, c) => sum + c.reconnectAttempts, 0)
    };
  }
}

export const wsConnectionPool = new WebSocketConnectionPool({
  maxConnections: 20,
  heartbeatInterval: 30000,
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
  messageBufferSize: 500
});

export class ExchangeWebSocketManager {
  private pool: WebSocketConnectionPool;
  private exchangeConnections: Map<string, string> = new Map();

  constructor(pool: WebSocketConnectionPool) {
    this.pool = pool;
  }

  async connectExchange(
    exchange: string,
    symbol: string,
    onPriceUpdate: (price: number) => void,
    onTradeUpdate?: (trade: any) => void
  ): Promise<void> {
    const connectionId = `${exchange}_${symbol}`;
    
    const wsUrl = this.getWebSocketUrl(exchange, symbol);
    
    await this.pool.connect(
      connectionId,
      wsUrl,
      (data) => this.handleExchangeMessage(exchange, data, onPriceUpdate, onTradeUpdate)
    );

    this.exchangeConnections.set(connectionId, exchange);
    
    this.subscribeToChannels(connectionId, exchange, symbol);
  }

  private getWebSocketUrl(exchange: string, symbol: string): string {
    const urls: Record<string, string> = {
      'BINANCE': `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`,
      'OKX': 'wss://ws.okx.com:8443/ws/v5/public',
      'KUCOIN': 'wss://ws-api-spot.kucoin.com/',
      'COINBASE': 'wss://advanced-trade-ws.coinbase.com',
      'KRAKEN': 'wss://ws.kraken.com',
      'BYBIT': 'wss://stream.bybit.com/v5/public/spot',
      'GATEIO': 'wss://api.gateio.ws/ws/v4/',
      'HUOBI': 'wss://api.huobi.pro/ws',
      'BITFINEX': 'wss://api-pub.bitfinex.com/ws/2'
    };
    
    return urls[exchange] || urls['BINANCE'];
  }

  private subscribeToChannels(connectionId: string, exchange: string, symbol: string): void {
    switch (exchange) {
      case 'OKX':
        this.pool.subscribe(connectionId, 'trades', {
          args: [{ channel: 'trades', instId: symbol.toUpperCase() }]
        });
        break;
      case 'KUCOIN':
        this.pool.subscribe(connectionId, 'market', {
          type: 'subscribe',
          topic: `/market/ticker:${symbol.toUpperCase()}`
        });
        break;
      default:
        break;
    }
  }

  private handleExchangeMessage(
    exchange: string,
    data: any,
    onPriceUpdate: (price: number) => void,
    onTradeUpdate?: (trade: any) => void
  ): void {
    try {
      let price: number | null = null;
      
      switch (exchange) {
        case 'BINANCE':
          if (data.p) price = parseFloat(data.p);
          break;
        case 'OKX':
          if (data.data && data.data[0]?.px) price = parseFloat(data.data[0].px);
          break;
        case 'KUCOIN':
          if (data.data?.price) price = parseFloat(data.data.price);
          break;
        default:
          break;
      }

      if (price !== null) {
        onPriceUpdate(price);
      }

      if (onTradeUpdate) {
        onTradeUpdate(data);
      }
    } catch (error) {
      console.error('Failed to handle exchange message:', error);
    }
  }

  disconnectExchange(exchange: string, symbol: string): void {
    const connectionId = `${exchange}_${symbol}`;
    this.pool.disconnect(connectionId);
    this.exchangeConnections.delete(connectionId);
  }

  disconnectAll(): void {
    this.pool.disconnectAll();
    this.exchangeConnections.clear();
  }

  getConnectionStats() {
    return this.pool.getStats();
  }
}

export const exchangeWSManager = new ExchangeWebSocketManager(wsConnectionPool);
