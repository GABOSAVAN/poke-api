import { Controller, Get, Query } from '@nestjs/common';
import { PokemonService } from './services/pokemon.service';
import { SearchPokemonDto } from './dto/search-pokemon.dto';
import { PokemonSearchResult } from './interfaces/pokemon.interface';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

   @Get('search')
  async searchPokemons(@Query() searchDto: SearchPokemonDto): Promise<PokemonSearchResult[]> {
    const { name } = searchDto;
    return this.pokemonService.searchPokemonsByName(name || '');
  }

  @Get('reload')
  async reloadData(): Promise<{ message: string; count: number }> {
    return this.pokemonService.reloadPokemonData();
  }
}