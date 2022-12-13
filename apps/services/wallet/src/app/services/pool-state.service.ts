import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { Address, Cell } from 'ton';
import { TonClientProvider } from '../providers/ton-client.provider';

@Injectable()
export class PoolStateService {
  constructor(private readonly tonClientProvider: TonClientProvider) {}

  async poolStateRaw(seqno: number, pool: Address) {
    const { client4 } = this.tonClientProvider;
    const data = await client4.getAccount(seqno, pool);

    if (data.account.state.type !== 'active') {
      throw Error('Invalid state');
    }

    return Cell.fromBoc(Buffer.from(data.account.state.data!, 'base64'))[0];
  }

  async poolStateParsed(seqno: number, pool: Address) {
    const rawState = await this.poolStateRaw(seqno, pool);
    const parser = rawState.beginParse();

    const locked = parser.readInt(1); // ctx_locked

    const owner = parser.readAddress(); // ctx_owner
    const controller = parser.readAddress(); // ctx_controller
    const proxy = parser.readAddress(); // ctx_proxy

    parser.readRef(); // balance_cell

    const members = parser.readDict(256, (member) => ({
      profitPerCoin: member.readInt(128),
      balance: member.readCoins(),
      pendingWithdrawal: member.readCoins(),
      pendingWithdrawalAll: member.readInt(1),
      pendingDeposit: member.readCoins(),
      withdraw: member.readCoins(),
    })); // ctx_nominators

    const proxyState = parser.readRef(); // ctx_proxy_state

    return {
      locked,
      owner,
      controller,
      proxy,
      members,
    };
  }
}
