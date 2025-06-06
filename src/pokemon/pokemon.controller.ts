import { Controller, Get, Query } from '@nestjs/common';
import { PokemonService } from './services/pokemon.service';
import { SearchPokemonDto } from './dto/search-pokemon.dto';
import { PokemonSearchResult } from './interfaces/pokemon.interface';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * Endpoint para buscar pokémons por nombre (coincidencia parcial de prefijo)
   * GET /pokemon/search?name=bulba
   */
  @Get('search')
  async searchPokemons(@Query() searchDto: SearchPokemonDto): Promise<PokemonSearchResult[]> {
    const { name } = searchDto;
    return this.pokemonService.searchPokemonsByName(name || '');
  }

  /**
   * Endpoint para forzar recarga de datos (útil para desarrollo)
   * GET /pokemon/reload
   */
  @Get('reload')
  async reloadData(): Promise<{ message: string; count: number }> {
    return this.pokemonService.reloadPokemonData();
  }
}