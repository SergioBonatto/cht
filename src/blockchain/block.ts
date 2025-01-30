import crypto from 'crypto';

export class Block {
    index: number;
    timestamp: number;
    data: string;
    previousHash: string;
    hash: string;

    constructor(index: number, timestamp: number, data: string, previousHash = '') {
        if (typeof index !== 'number' || typeof timestamp !== 'number' || typeof data !== 'string' || typeof previousHash !== 'string') {
            throw new Error('Invalid block parameters');
        }
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash(): string {
        return crypto.createHash('sha256')
            .update(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash)
            .digest('hex');
    }
}
