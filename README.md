
## Bootstrap local environment
Start PostgreSQL
```shell
docker-compose up -d
```

Start NestJs Application
```shell
nx serve
```

## Main components

* [pool-state.service.ts](apps/services/wallet/src/app/services/pool-state.service.ts) is for pulling and parsing 
raw pool state
* [pool-state-cache.service.ts](apps/services/wallet/src/app/services/pool-state-cache.service.ts) is for caching parsed pool state into PostgreSQL
