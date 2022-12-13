import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TonClientProvider } from './providers/ton-client.provider';
import { PoolStateService } from './services/pool-state.service';
import { PoolStateCacheService } from './services/pool-state-cache.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolMemberState } from './entities/pool-member-state';
import { PoolCacheInfo } from './entities/pool-cache-info';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: +process.env.PG_PORT,
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      entities: [PoolMemberState, PoolCacheInfo],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([PoolMemberState, PoolCacheInfo]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TonClientProvider,
    PoolStateService,
    PoolStateCacheService,
  ],
})
export class AppModule {}
