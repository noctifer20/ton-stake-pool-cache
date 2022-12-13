import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('wallet')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getWallet(@Query('address') address) {
    const wallet = await this.appService.getWallet(address);

    return {
      totalBalance: wallet.balance.toString(),
      totalEarnings: wallet.profit.toString(),
    };
  }
}
