import https from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import { setupUPnP } from './upnp.js';
import { Blockchain } from '../blockchain/blockchain.js';

interface P2PNetworkOptions {
    key: Buffer;
    cert: Buffer;
}

export class P2PNetwork {
    blockchain: Blockchain;
    port: number;
    peers: Set<WebSocket>;
    server: WebSocketServer | null;
    options: P2PNetworkOptions;

    constructor(blockchain: Blockchain, port: number, options: P2PNetworkOptions) {
        this.blockchain = blockchain;
        this.port = port;
        this.peers = new Set();
        this.server = null;
        this.options = options;
    }

    async initialize(): Promise<void> {
        const server = https.createServer(this.options);
        this.server = new WebSocketServer({ server });

        this.server.on('connection', (ws: WebSocket) => {
            this.handleNewPeer(ws);
        });

        server.listen(this.port, () => {
            console.log(`WebSocket server running on port ${this.port}`);
        });

        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${this.port} is already in use`);
            } else {
                console.error('Server error:', error);
            }
            process.exit(1);
        });

        await setupUPnP(this.port);

        // Connect to initial peer if provided
        const initialPeer = process.env.INITIAL_PEER;
        if (initialPeer && this.isValidUrl(initialPeer)) {
            this.connectToPeer(initialPeer);
        } else {
            console.warn('No valid initial peer provided');
        }
    }

    isValidUrl(string: string): boolean {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    connectToPeer(peer: string): void {
        const ws = new WebSocket(peer, { rejectUnauthorized: false });
        ws.on('open', () => {
            this.handleNewPeer(ws);
        });
        ws.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }

    handleNewPeer(ws: WebSocket): void {
        this.peers.add(ws);

        ws.on('message', (message: string) => {
            this.handleMessage(ws, JSON.parse(message));
        });

        ws.on('close', () => {
            this.peers.delete(ws);
        });

        // Sync blockchain with the new peer
        this.syncBlockchain(ws);
    }

    syncBlockchain(ws: WebSocket): void {
        ws.send(JSON.stringify({
            type: 'GET_BLOCKCHAIN'
        }));
    }

    handleMessage(ws: WebSocket, message: any): void {
        switch (message.type) {
            case 'GET_BLOCKCHAIN':
                ws.send(JSON.stringify({
                    type: 'BLOCKCHAIN',
                    data: this.blockchain.chain
                }));
                break;

            case 'BLOCKCHAIN':
                this.handleReceivedBlockchain(message.data);
                break;

            case 'NEW_BLOCK':
                this.handleNewBlock(message.data);
                break;

            default:
                console.warn('Unknown message type:', message.type);
                break;
        }
    }

    handleReceivedBlockchain(chain: any[]): void {
        // Check if the received chain is valid and longer
        if (chain.length > this.blockchain.chain.length) {
            // Additional validity check here
            this.blockchain.chain = chain;
        } else {
            console.warn('Received blockchain is not longer than the current chain');
        }
    }

    handleNewBlock(block: any): void {
        // Verify and add new block
        if (this.blockchain.isChainValid() && block.previousHash === this.blockchain.getLatestBlock().hash) {
            this.blockchain.chain.push(block);
            // Propagate to other peers
            this.broadcast({
                type: 'NEW_BLOCK',
                data: block
            });
        } else {
            console.warn('Invalid block received');
        }
    }

    broadcast(message: any): void {
        this.peers.forEach(peer => {
            peer.send(JSON.stringify(message));
        });
    }
}
