import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  ValueTransformer,
} from 'typeorm';
import BN from 'bn.js';

export const bigint: ValueTransformer = {
  to: (entityValue: BN) => entityValue.toString(),
  from: (databaseValue: string): BN => new BN(databaseValue),
};

@Entity()
@Unique(['address', 'pool'])
export class PoolMemberState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  address: string;
  @Column()
  pool: string;

  @Column('bigint', { transformer: bigint })
  profit: BN;

  @Column('bigint', { transformer: bigint })
  balance: BN;
  @Column('bigint', { transformer: bigint })
  pendingWithdrawal: BN;
  @Column('bigint', { transformer: bigint })
  pendingDeposit: BN;
}
