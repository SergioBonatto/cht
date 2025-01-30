import net from 'net';

export const checkPortInUse = (port: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', (err: NodeJS.ErrnoException) => {
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
