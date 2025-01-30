import { app } from './app.js';
import { p2pNetwork } from './p2pNetworkInstance.js';
import { checkPortInUse } from './utils.js';
import dotenv from 'dotenv';

dotenv.config();

const startServer = async (): Promise<void> => {
    try {
        let httpPort = parseInt(process.env.HTTP_PORT || '3001');
        const portInUse = await checkPortInUse(httpPort);

        if (portInUse) {
            console.error(`Port ${httpPort} is already in use. Trying another port...`);
            httpPort += 1;
        }

        const server = app.listen(httpPort, () => {
            console.log(`HTTP Server running on port ${httpPort}`);
        });

        server.on('error', (error: NodeJS.ErrnoException) => {
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

startServer();
