import crypto from 'crypto';

export class Block {
    constructor(index, timestamp, data, previousHash = '') {
        if (typeof index !== 'number' || typeof timestamp !== 'number' || typeof data !== 'string' || typeof previousHash !== 'string') {
            throw new Error('Invalid block parameters');
        }
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash)
            .digest('hex');
    }
}
