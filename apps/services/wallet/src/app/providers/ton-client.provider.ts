import { TonClient4 } from 'ton';
import { Injectable, Scope } from '@nestjs/common';

@Injectable()
export class TonClientProvider {
  public client4: TonClient4;

  constructor() {
    this.client4 = new TonClient4({
      endpoint: 'https://mainnet-v4.tonhubapi.com',
      timeout: 10000,
    });
  }
}
