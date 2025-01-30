import express from 'express';
import { Blockchain } from '../blockchain/blockchain.js';
import { P2PNetwork } from '../network/p2pNetwork.js';
import { validateMineRequest } from './middleware.js';

export const setupRoutes = (app: express.Application, blockchain: Blockchain, p2pNetwork: P2PNetwork): void => {
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
};
