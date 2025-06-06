import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { PokemonModule } from './pokemon/pokemon.module';

@Module({
  imports: [RedisModule, PokemonModule],
})
export class AppModule {}