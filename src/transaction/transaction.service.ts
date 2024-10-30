import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class TransactionService {
  private provider: ethers.JsonRpcProvider;

  private erc20Abi = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  private erc721Abi = [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  ];

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  }

  async getTransactionBlock(blockNumber: number) {
    try {
      const currentBlockNumber = await this.provider.getBlockNumber();
      if (blockNumber < 0 || blockNumber > currentBlockNumber) {
        throw new BadRequestException('Block number is out of range');
      }

      const blockData = await this.provider.getBlock(blockNumber);
      return blockData;
    } catch (error) {
      throw new BadRequestException('Invalid block number');
    }
  }

  async getTransaction(hash: string) {
    try {
      const data = await this.provider.getTransaction(hash);
      return data;
    } catch (error) {
      throw new BadRequestException('Not data hash');
    }
  }

  // ===============  BEGIN: Find Transaction ===============
  async findTransaction(text: string) {
    try {
      if (!text.startsWith('0x')) {
        const blocks = await this.getTransactionBlock(Number(text));
        return blocks;
      }
      const transactions = await this.getInforTransaction(text);
      return transactions;
    } catch (error) {
      throw new BadRequestException("Can't find with text");
    }
  }
  // ===============  END: Find Transaction ===============

  // ===============  BEGIN: Get BLOCK PAGINATE ===============
  async getBlockPaginate(page: number = 1, limit: number = 10) {
    try {
      const lengthBlock = await this.provider.getBlockNumber();

      const start = (page - 1) * limit;
      const end = start + limit > lengthBlock ? lengthBlock : start + limit;

      // const start = lengthBlock - 100;
      // const end = lengthBlock;

      const data = [];
      for (let i = start; i < end; i++) {
        const blockData = await this.getTransactionBlock(i + 1);
        const txTypes = await this.checkToken(i + 1);
        data.push({ blockData, txTypes });
      }
      return data;
    } catch (error) {
      throw new BadRequestException('Can not get data');
    }
  }
  // ===============  END: Get BLOCK PAGINATE ===============

  // ===============  BEGIN: Get ALL Block ===============
  async getAllBlock() {
    try {
      const endHeight = (await this.provider.getBlockNumber()) || 0;
      const data = [];
      for (let i = 0; i < endHeight; i++) {
        const blockData = await this.getTransactionBlock(i + 1);

        data.push(blockData);
      }
      return data;
    } catch (error) {
      throw new BadRequestException('Can not get data BLOCK');
    }
  }
  // ===============  END: Get ALL Block ===============

  // ===============  BEGIN: Get TRANSACTION PAGINATE ===============
  async getTransactionPaginate(page: number = 1, limit: number = 10) {
    try {
      const block = await this.getAllBlock();
      const start = (page - 1) * limit;
      const end = start + limit > block.length ? block.length : start + limit;
      const transactions = [];
      for (let i = start; i < end; i++) {
        const blockData = await this.getTransactionBlock(i + 1);
        await Promise.all(
          blockData.transactions.map(async (hash) => {
            const transaction = await this.getInforTransaction(hash);
            transactions.push(transaction);
          }),
        );
      }
      return transactions;
    } catch (error) {
      throw new BadRequestException("Can't not get information transaction");
    }
  }
  // ===============  END: Get TRANSACTION PAGINATE ===============

  // ===============  BEGIN: Get Information Transaction ===============
  async getInforTransaction(hashTransaction: string) {
    try {
      const transaction = await this.provider.getTransaction(hashTransaction);
      if (!transaction) {
        throw new BadRequestException('Not data transaction');
      }

      return transaction;
    } catch (error) {
      throw new BadRequestException('Can not get data transaction');
    }
  }
  // ===============  END: Get Information Transaction ===============

  // ===============  BEGIN: Find ERC20 Transactions ===============

  async checkToken(blockNumber: number) {
    const erc20Interface = new ethers.Interface(this.erc20Abi);
    const erc721Interface = new ethers.Interface(this.erc721Abi);
    const txTypes = [];
    try {
      const block = await this.provider.getBlock(blockNumber);
      for (const tx of block.transactions) {
        const receipt = await this.provider.getTransactionReceipt(tx);
        let isNative = true;
        for (const log of receipt.logs) {
          try {
            const erc20ParsedLog = erc20Interface.parseLog(log);
            if (erc20ParsedLog.name === 'Transfer') {
              txTypes.push({ transaction: tx, type: 'ERC20' });
              isNative = false;
              continue;
            }
          } catch (err) {}
          try {
            const erc721ParsedLog = erc721Interface.parseLog(log);
            if (erc721ParsedLog.name === 'Transfer') {
              txTypes.push({ transaction: tx, type: 'ERC721' });
              isNative = false;
              continue;
            }
          } catch (err) {}
        }
        if (isNative) {
          txTypes.push({ transaction: tx, type: 'Native' });
        }
      }
    } catch (error) {}
    return txTypes;
  }

  // ===============  END: Find ERC20 Transactions ===============
}
