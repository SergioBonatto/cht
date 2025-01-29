import express from 'express';
import bodyParser from 'body-parser';
import { Blockchain } from './blockchain.js';
import { P2PNetwork } from './p2pNetwork.js';
import fs from 'fs';
import dotenv from 'dotenv';
import net from 'net';

dotenv.config();

const options = {
    key: fs.readFileSync('key_unencrypted.pem'), // Use the unencrypted key
    cert: fs.readFileSync('cert.pem')
};

const blockchain = new Blockchain();
const p2pNetwork = new P2PNetwork(blockchain, process.env.P2P_PORT || 6001, options);

const app = express();
app.use(bodyParser.json());

// Middleware to validate request body for /mine endpoint
const validateMineRequest = (req, res, next) => {
    if (!req.body.data) {
        return res.status(400).json({ error: 'Data is required to mine a block' });
    } else {
        next();
    }
};

// API endpoints
app.get('/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/mine', validateMineRequest, (req, res) => {
    try {
        const block = blockchain.addBlock(req.body.data);
        p2pNetwork.broadcast({
            type: 'NEW_BLOCK',
            data: block
        });
        res.json(block);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mine block' });
    }
});

// Function to check if a port is in use
const checkPortInUse = (port) => {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                tester.once('close', () => resolve(false)).close();
            })
            .listen(port);
    });
};

// Initialization
export const startServer = async () => {
    try {
        let httpPort = process.env.HTTP_PORT || 3001;
        const portInUse = await checkPortInUse(httpPort);

        if (portInUse) {
            console.error(`Port ${httpPort} is already in use. Trying another port...`);
            httpPort = parseInt(httpPort) + 1;
        }

        const server = app.listen(httpPort, () => {
            console.log(`HTTP Server running on port ${httpPort}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${httpPort} is already in use`);
            } else {
                console.error('Server error:', error);
            }
            process.exit(1);
        });

        await p2pNetwork.initialize();
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
