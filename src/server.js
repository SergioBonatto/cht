import express from 'express';
import bodyParser from 'body-parser';
import { Blockchain } from './blockchain.js';
import { P2PNetwork } from './p2pNetwork.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const options = {
    key: fs.readFileSync('key_unencrypted.pem'), // Use the unencrypted key
    cert: fs.readFileSync('cert.pem')
};

const blockchain = new Blockchain();
const p2pNetwork = new P2PNetwork(blockchain, process.env.P2P_PORT || 6001, options);

const app = express();
app.use(bodyParser.json());

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
