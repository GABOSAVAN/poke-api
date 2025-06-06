import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { PokeApiService } from './pokeapi.service';
import { PokemonSearchResult } from '../interfaces/pokemon.interface';

@Injectable()
export class PokemonService implements OnModuleInit {
  private readonly logger = new Logger(PokemonService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly pokeApiService: PokeApiService,
  ) {}

  /**
   * Inicialización del módulo - carga datos si no existen en Redis
   */
  async onModuleInit() {
    await this.initializePokemonData();
  }

  /**
   * Inicializa los datos de pokémons verificando Redis primero
   */
  private async initializePokemonData(): Promise<void> {
    try {
      this.logger.log('Verificando datos de pokémons en Redis...');

      const dataExists = await this.redisService.pokemonDataExists();

      if (dataExists) {
        this.logger.log('Datos de pokémons encontrados en Redis. No es necesario volver a cargar.');
        return;
      }

      this.logger.log('Datos no encontrados en Redis. Obteniendo desde PokéAPI...');

      // Obtener datos de PokéAPI
      const pokemons = await this.pokeApiService.fetchAllPokemons();

      // Almacenar en Redis
      await this.redisService.storePokemonData(pokemons);

      this.logger.log('Inicialización de datos de pokémons completada');

    } catch (error) {
      this.logger.error('Error durante la inicialización de datos:', error);
      throw error;
    }
  }

  /**
   * Busca pokémons por coincidencia parcial del nombre (prefijo)
   */
  async searchPokemonsByName(searchTerm: string): Promise<PokemonSearchResult[]> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      this.logger.debug(`Buscando pokémons con prefijo: "${searchTerm}"`);

      const results = await this.redisService.searchPokemonsByNamePrefix(searchTerm);

      this.logger.debug(`Encontrados ${results.length} pokémons para "${searchTerm}"`);

      return results;

    } catch (error) {
      this.logger.error('Error en búsqueda de pokémons:', error);
      throw new Error('Error al buscar pokémons');
    }
  }

  /**
   * Fuerza la recarga de datos desde PokéAPI (útil para desarrollo)
   */
  async reloadPokemonData(): Promise<{ message: string; count: number }> {
    try {
      this.logger.log('Forzando recarga de datos de pokémons...');

      // Limpiar datos existentes
      await this.redisService.clearPokemonData();

      // Recargar desde PokéAPI
      const pokemons = await this.pokeApiService.fetchAllPokemons();
      await this.redisService.storePokemonData(pokemons);

      const message = 'Datos de pokémons recargados exitosamente';
      this.logger.log(message);

      return {
        message,
        count: pokemons.length,
      };

    } catch (error) {
      this.logger.error('Error recargando datos:', error);
      throw new Error('Error al recargar datos de pokémons');
    }
  }
}