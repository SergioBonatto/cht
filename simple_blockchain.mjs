import fs from 'fs';
import https from 'https';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';
import upnp from 'nat-upnp';
import { publicIpv4 } from 'public-ip';
import dotenv from 'dotenv';

dotenv.config();

const options = {
    key: fs.readFileSync('key_unencrypted.pem'), // Use a chave não criptografada
    cert: fs.readFileSync('cert.pem')
};

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash).digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(this.chain.length, Date.now(), data, previousBlock.hash);
        this.chain.push(newBlock);
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    printChain() {
        this.chain.forEach(block => {
            console.log("Index:", block.index);
            console.log("Timestamp:", block.timestamp);
            console.log("Data:", block.data);
            console.log("Hash:", block.hash);
            console.log("Previous Hash:", block.previousHash);
            console.log("--------------------");
        });
    }
}

class P2PNetwork {
    constructor(blockchain, port) {
        this.blockchain = blockchain;
        this.port = port;
        this.peers = new Set();
        this.server = null;
    }

    async initialize() {
        const server = https.createServer(options);
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
        }
    }

    handleReceivedBlockchain(chain) {
        // Check if the received chain is valid and longer
        if (chain.length > this.blockchain.chain.length) {
            // Additional validity check here
            this.blockchain.chain = chain;
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
        }
    }

    broadcast(message) {
        this.peers.forEach(peer => {
            peer.send(JSON.stringify(message));
        });
    }
}

// Example usage
const app = express();
app.use(bodyParser.json());

const blockchain = new Blockchain();
const p2pNetwork = new P2PNetwork(blockchain, process.env.P2P_PORT || 6001);

// API endpoints
app.get('/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/mine', (req, res) => {
    const block = blockchain.addBlock(req.body.data);
    p2pNetwork.broadcast({
        type: 'NEW_BLOCK',
        data: block
    });
    res.json(block);
});

// Initialization
const httpPort = process.env.HTTP_PORT || 3001;
app.listen(httpPort, () => {
    console.log(`HTTP Server running on port ${httpPort}`);
});

p2pNetwork.initialize();
