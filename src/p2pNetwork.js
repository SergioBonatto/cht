import https from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import upnp from 'nat-upnp';
import { publicIpv4 } from 'public-ip';

export class P2PNetwork {
    constructor(blockchain, port, options) {
        this.blockchain = blockchain;
        this.port = port;
        this.peers = new Set();
        this.server = null;
        this.options = options;
    }

    async initialize() {
        const server = https.createServer(this.options);
        this.server = new WebSocketServer({ server });

        this.server.on('connection', (ws) => {
            this.handleNewPeer(ws);
        });

        server.listen(this.port, () => {
            console.log(`WebSocket server running on port ${this.port}`);
        });

        // Set up UPnP port forwarding
        const client = upnp.createClient();
        const publicIpAddress = await publicIpv4();
        client.portMapping({
            public: this.port,
            private: this.port,
            ttl: 10
        }, (err) => {
            if (err) {
                console.error('UPnP port mapping error:', err);
            } else {
                console.log(`Port ${this.port} mapped to public IP ${publicIpAddress}`);
            }
        });

        // Connect to initial peer if provided
        const initialPeer = process.env.INITIAL_PEER;
        if (initialPeer && this.isValidUrl(initialPeer)) {
            this.connectToPeer(initialPeer);
        } else {
            console.warn('No valid initial peer provided');
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    connectToPeer(peer) {
        const ws = new WebSocket(peer, { rejectUnauthorized: false });
        ws.on('open', () => {
            this.handleNewPeer(ws);
        });
        ws.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }

    handleNewPeer(ws) {
        this.peers.add(ws);

        ws.on('message', (message) => {
            this.handleMessage(ws, JSON.parse(message));
        });

        ws.on('close', () => {
            this.peers.delete(ws);
        });

        // Sync blockchain with the new peer
        this.syncBlockchain(ws);
    }

    syncBlockchain(ws) {
        ws.send(JSON.stringify({
            type: 'GET_BLOCKCHAIN'
        }));
    }

    handleMessage(ws, message) {
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

    handleReceivedBlockchain(chain) {
        // Check if the received chain is valid and longer
        if (chain.length > this.blockchain.chain.length) {
            // Additional validity check here
            this.blockchain.chain = chain;
        } else {
            console.warn('Received blockchain is not longer than the current chain');
        }
    }

    handleNewBlock(block) {
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

    broadcast(message) {
        this.peers.forEach(peer => {
            peer.send(JSON.stringify(message));
        });
    }
}
