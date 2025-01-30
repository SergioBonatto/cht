import fs from 'fs';
import dotenv from 'dotenv';
import { P2PNetwork } from '../network/p2pNetwork.js';
import { blockchain } from './blockchainInstance.js';

dotenv.config();

const options = {
    key: fs.readFileSync('key_unencrypted.pem'), // Use the unencrypted key
    cert: fs.readFileSync('cert.pem')
};

export const p2pNetwork = new P2PNetwork(blockchain, parseInt(process.env.P2P_PORT || '6001'), options);
