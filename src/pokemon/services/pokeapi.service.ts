import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PokeApiResponse } from '../interfaces/pokeapi-response.interface';
import { Pokemon } from '../interfaces/pokemon.interface';

@Injectable()
export class PokeApiService {
  private readonly logger = new Logger(PokeApiService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Obtiene la lista completa de pokémons desde la PokéAPI
   */
  async fetchAllPokemons(): Promise<Pokemon[]> {
    try {
      this.logger.log('Iniciando obtención de pokémons desde PokéAPI...');

      const url = 'https://pokeapi.co/api/v2/pokemon?limit=2000';
      const response = await firstValueFrom(
        this.httpService.get<PokeApiResponse>(url)
      );

      const pokeApiData = response.data;
      this.logger.log(`Obtenidos ${pokeApiData.results.length} pokémons de PokéAPI`);

      // Transformar los datos extrayendo el ID de la URL
      const pokemons: Pokemon[] = pokeApiData.results.map((result) => {
        const id = this.extractIdFromUrl(result.url);
        return {
          id,
          name: result.name,
          url: result.url,
        };
      });

      // Filtrar pokémons con ID válido y ordenar por ID
      const validPokemons = pokemons
        .filter(pokemon => pokemon.id > 0)
        .sort((a, b) => a.id - b.id);

      this.logger.log(`Procesados ${validPokemons.length} pokémons válidos`);
      return validPokemons;

    } catch (error) {
      this.logger.error('Error obteniendo pokémons de PokéAPI:', error);
      throw new Error('No se pudieron obtener los datos de PokéAPI');
    }
  }

  /**
   * Extrae el ID del pokémon desde su URL
   * Ejemplo: https://pokeapi.co/api/v2/pokemon/1/ -> 1
   */
  private extractIdFromUrl(url: string): number {
    try {
      const matches = url.match(/\/pokemon\/(\d+)\//);
      return matches ? parseInt(matches[1], 10) : 0;
    } catch (error) {
      this.logger.warn(`Error extrayendo ID de URL: ${url}`, error);
      return 0;
    }
  }
}