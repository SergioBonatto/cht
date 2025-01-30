import express from 'express';
import bodyParser from 'body-parser';
import { blockchain } from './blockchainInstance.js';
import { p2pNetwork } from './p2pNetworkInstance.js';
import { validateMineRequest } from './middleware.js';
import { setupRoutes } from './routes.js';

const app = express();
app.use(bodyParser.json());

setupRoutes(app, blockchain, p2pNetwork);

export { app };
