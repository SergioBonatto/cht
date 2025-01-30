import express from 'express';

export const validateMineRequest = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!req.body.data) {
        res.status(400).json({ error: 'Data is required to mine a block' });
    } else {
        next();
    }
};
