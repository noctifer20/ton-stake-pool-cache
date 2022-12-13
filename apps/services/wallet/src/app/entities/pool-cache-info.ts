import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['pool'])
export class PoolCacheInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pool: string;

  @Column()
  lastCachedTimestamp: number;
}
