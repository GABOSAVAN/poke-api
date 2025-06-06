import { Controller, Get, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { Pokemon } from './interfaces/pokemon.interface';
import { SearchPokemonDto } from './dto/search-pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get('search')
  async searchPokemons(@Query() searchDto: SearchPokemonDto): Promise<Pokemon[]> {
    const { name } = searchDto;
    return this.pokemonService.searchPokemonsByName(name || '');
  }
}