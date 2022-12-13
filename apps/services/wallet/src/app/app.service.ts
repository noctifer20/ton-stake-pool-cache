import { Injectable } from '@nestjs/common';
import { PoolMemberState } from './entities/pool-member-state';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(PoolMemberState)
    private readonly poolMemberStateRepo: Repository<PoolMemberState>
  ) {}

  getWallet(address: string) {
    return this.poolMemberStateRepo.findOneOrFail({
      where: {
        address,
      },
    });
  }
}
