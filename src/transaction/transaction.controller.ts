import { Controller, Get, Param, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { Block, TransactionResponse } from 'ethers';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('all')
  async getAllBlock(): Promise<any[]> {
    return await this.transactionService.getAllBlock();
  }

  @Get('block/paginate')
  async getBlockPaginate(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any[]> {
    return await this.transactionService.getBlockPaginate(page, limit);
  }

  @Get('transactions/paginate')
  async getTransactionPaginate(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any[]> {
    return await this.transactionService.getTransactionPaginate(page, limit);
  }

  @Get('infor/:tx')
  async getInforTransaction(
    @Param('tx') tx: string,
  ): Promise<TransactionResponse> {
    return await this.transactionService.getInforTransaction(tx);
  }

  @Get(':text')
  async findTransaction(
    @Param('text') text: string,
  ): Promise<Block | TransactionResponse> {
    return await this.transactionService.findTransaction(text);
  }
}
