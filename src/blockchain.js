import { Block } from './block.js';

export class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(data) {
        if (typeof data !== 'string') {
            throw new Error('Invalid data type');
        }
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(this.chain.length, Date.now(), data, previousBlock.hash);
        this.chain.push(newBlock);
        return newBlock;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            } else if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    printChain() {
        this.chain.forEach(block => {
            console.log("Index:", block.index);
            console.log("Timestamp:", block.timestamp);
            console.log("Data:", block.data);
            console.log("Hash:", block.hash);
            console.log("Previous Hash:", block.previousHash);
            console.log("--------------------");
        });
    }
}
