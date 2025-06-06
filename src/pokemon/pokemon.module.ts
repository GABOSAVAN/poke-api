import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './services/pokemon.service';
import { PokeApiService } from './services/pokeapi.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PokemonController],
  providers: [PokemonService, PokeApiService],
  exports: [PokemonService],
})
export class PokemonModule {}