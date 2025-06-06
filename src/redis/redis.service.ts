import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Pokemon } from '../pokemon/interfaces/pokemon.interface';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private readonly POKEMON_KEY_PREFIX = 'pokemon:';
  private readonly POKEMON_LIST_KEY = 'pokemon:list';

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Conectado a Redis');
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  /**
   * Verifica si los datos de pokémons existen en Redis
   */
  async pokemonDataExists(): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.POKEMON_LIST_KEY);
      return exists === 1;
    } catch (error) {
      this.logger.error('Error verificando existencia de datos en Redis:', error);
      return false;
    }
  }

  /**
   * Almacena la lista completa de pokémons en Redis
   * Estructura:
   * - pokemon:list -> Lista ordenada de todos los pokémons (ZSET por ID)
   * - pokemon:{id} -> Hash con datos del pokémon individual
   */
  async storePokemonData(pokemons: Pokemon[]): Promise<void> {
    try {
      const pipeline = this.client.multi();

      // Almacenar cada pokémon como hash individual
      for (const pokemon of pokemons) {
        const pokemonKey = `${this.POKEMON_KEY_PREFIX}${pokemon.id}`;
        pipeline.hSet(pokemonKey, {
          id: pokemon.id.toString(),
          name: pokemon.name,
          url: pokemon.url,
        });

        // Agregar al conjunto ordenado para búsquedas eficientes
        pipeline.zAdd(this.POKEMON_LIST_KEY, {
          score: pokemon.id,
          value: JSON.stringify({ id: pokemon.id, name: pokemon.name }),
        });
      }

      await pipeline.exec();
      this.logger.log(`Almacenados ${pokemons.length} pokémons en Redis`);
    } catch (error) {
      this.logger.error('Error almacenando datos en Redis:', error);
      throw error;
    }
  }

  /**
   * Busca pokémons por coincidencia parcial del nombre (prefijo)
   * Utiliza ZSCAN para buscar eficientemente en el conjunto ordenado
   */
  async searchPokemonsByNamePrefix(prefix: string): Promise<{ id: number; name: string }[]> {
    try {
      if (!prefix || prefix.trim() === '') {
        return [];
      }

      const prefixLower = prefix.toLowerCase().trim();
      const results: { id: number; name: string }[] = [];

      // Obtener todos los elementos del conjunto ordenado
      const pokemonList = await this.client.zRange(this.POKEMON_LIST_KEY, 0, -1);

      for (const pokemonJson of pokemonList) {
        try {
          const pokemon = JSON.parse(pokemonJson);
          
          // Verificar si el nombre comienza con el prefijo (coincidencia parcial desde el inicio)
          if (pokemon.name.toLowerCase().startsWith(prefixLower)) {
            results.push({
              id: pokemon.id,
              name: pokemon.name,
            });
          }
        } catch (parseError) {
          this.logger.warn('Error parseando pokémon desde Redis:', parseError);
        }
      }

      // Ordenar por ID y limitar resultados para mejor performance
      return results
        .sort((a, b) => a.id - b.id)
        .slice(0, 20); // Limitar a 20 resultados

    } catch (error) {
      this.logger.error('Error buscando pokémons en Redis:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pokémon específico por ID
   */
  async getPokemonById(id: number): Promise<Pokemon | null> {
    try {
      const pokemonKey = `${this.POKEMON_KEY_PREFIX}${id}`;
      const pokemonData = await this.client.hGetAll(pokemonKey);

      if (!pokemonData || Object.keys(pokemonData).length === 0) {
        return null;
      }

      return {
        id: parseInt(pokemonData.id),
        name: pokemonData.name,
        url: pokemonData.url,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo pokémon ${id} desde Redis:`, error);
      return null;
    }
  }

  /**
   * Limpia todos los datos de pokémons (útil para desarrollo/testing)
   */
  async clearPokemonData(): Promise<void> {
    try {
      const keys = await this.client.keys(`${this.POKEMON_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      await this.client.del(this.POKEMON_LIST_KEY);
      this.logger.log('Datos de pokémons limpiados de Redis');
    } catch (error) {
      this.logger.error('Error limpiando datos de Redis:', error);
      throw error;
    }
  }
}