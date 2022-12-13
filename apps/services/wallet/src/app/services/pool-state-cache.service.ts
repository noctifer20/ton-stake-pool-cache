import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TonClientProvider } from '../providers/ton-client.provider';
import { Address, bnToAddress } from 'ton';
import { PoolStateService } from './pool-state.service';
import BN from 'bn.js';
import { DataSource, Repository } from 'typeorm';
import { PoolMemberState } from '../entities/pool-member-state';
import { InjectRepository } from '@nestjs/typeorm';
import { PoolCacheInfo } from '../entities/pool-cache-info';

@Injectable()
export class PoolStateCacheService implements OnModuleInit {
  private readonly logger = new Logger(PoolStateCacheService.name);

  private knownPool = Address.parse(
    'EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales'
  );

  constructor(
    private readonly tonClientProvider: TonClientProvider,
    private readonly poolStateService: PoolStateService,
    @InjectRepository(PoolMemberState)
    private readonly addressStateRepo: Repository<PoolMemberState>,
    @InjectRepository(PoolCacheInfo)
    private readonly poolCacheInfoRepo: Repository<PoolCacheInfo>,
    private dataSource: DataSource
  ) {}

  onModuleInit() {
    this.poolCacheInfoRepo
      .findOne({
        where: {
          pool: this.knownPool.toFriendly(),
        },
      })
      .then((poolCacheInfo) => {
        // ONE MONTH AGO
        let fromTs = Date.now() - 30 * 24 * 60 * 60 * 1000;
        fromTs = Math.floor(fromTs / 1000);

        if (poolCacheInfo)
          fromTs = Math.min(
            poolCacheInfo.lastCachedTimestamp + 60 * 60 * 36,
            fromTs
          );

        const tillTs = Math.floor(Date.now() / 1000) - 60;

        const keyTimePoints: number[] = [];
        for (let ts = fromTs; ts < tillTs; ts += 60 * 60 * 36) {
          keyTimePoints.push(ts);
        }
        return keyTimePoints.reduce(
          (prevPromise, ts) =>
            prevPromise.then(() => this.cacheByTimestamp(ts)),
          Promise.resolve()
        );
      })
      .then(() => {
        this.logger.verbose('finished caching');
      });

    setInterval(() => {
      this.cacheByTimestamp(Math.floor(Date.now() / 1000));
    }, 1000 * 60 * 60 * 36);
  }

  processMember(
    key: string,
    member: {
      balance: BN;
      pendingDeposit: BN;
      pendingWithdrawal: BN;
    },
    pool: Address,
    cache: Map<string, PoolMemberState>
  ) {
    const address = bnToAddress(0, new BN(key)).toFriendly();

    const cachedMember = cache.get(address);

    if (!cachedMember) {
      cache.set(
        address,
        this.addressStateRepo.create({
          address,
          pool: pool.toFriendly(),
          profit: new BN(0),
          balance: member.balance,
          pendingDeposit: member.pendingDeposit,
          pendingWithdrawal: member.pendingWithdrawal,
        })
      );

      return;
    }

    const balanceWithoutProfit = cachedMember.balance
      .sub(cachedMember.pendingWithdrawal)
      .add(cachedMember.pendingDeposit);

    const profit = cachedMember.profit.add(
      member.balance.sub(balanceWithoutProfit)
    );

    cache.set(address, {
      ...cachedMember,
      profit,
      balance: member.balance,
      pendingDeposit: member.pendingDeposit,
      pendingWithdrawal: member.pendingWithdrawal,
    });
  }

  async processPool(timestamp: number, pool: Address) {
    const cacheInfo = await this.poolCacheInfoRepo.findOne({
      where: {
        pool: pool.toFriendly(),
      },
    });

    if (cacheInfo && cacheInfo.lastCachedTimestamp + 60 * 60 * 36 > timestamp) {
      this.logger.verbose('skipping ', timestamp);
      return;
    }

    this.logger.debug(`processing pool: ${pool}`);

    const { client4 } = this.tonClientProvider;

    const cache = new Map<string, PoolMemberState>();
    const addressStates = await this.addressStateRepo.find({
      where: {
        pool: pool.toFriendly(),
      },
    });
    addressStates.forEach((addressState) =>
      cache.set(addressState.address, addressState)
    );

    const block = await client4.getBlockByUtime(timestamp);
    const { seqno } = block.shards[0];
    const poolState = await this.poolStateService.poolStateParsed(seqno, pool);

    poolState.members.forEach((member, key) => {
      this.processMember(key, member, pool, cache);
    });

    await this.dataSource.transaction(async (entityManager) => {
      await entityManager.save(PoolMemberState, [...cache.values()]);
      await entityManager.upsert(
        PoolCacheInfo,
        {
          pool: pool.toFriendly(),
          lastCachedTimestamp: timestamp,
        },
        {
          conflictPaths: ['pool'],
        }
      );
    });
  }

  async cacheByTimestamp(ts: number) {
    this.logger.debug(`processing election: ${ts}`);

    await this.processPool(ts, this.knownPool);
  }
}
