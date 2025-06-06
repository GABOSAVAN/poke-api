import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Pokemon } from './interfaces/pokemon.interface';
import { PokeApiResponse, PokeApiPokemonDetail } from './interfaces/pokeapi-response.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PokemonService implements OnModuleInit {
  private readonly logger = new Logger(PokemonService.name);
  private readonly pokemonsFilePath = path.join(process.cwd(), 'src/data/pokemonsData.json');

  async onModuleInit() {
    // Verificar y generar el archivo al iniciar la aplicación
    await this.initializePokemonsData();
  }

  private async initializePokemonsData(): Promise<void> {
    try {
      if (!fs.existsSync(this.pokemonsFilePath)) {
        this.logger.log('Archivo pokemonsData.json no encontrado. Generando datos...');
        await this.generatePokemonsData();
      } else {
        this.logger.log('Archivo pokemonsData.json encontrado. Datos listos para usar.');
      }
    } catch (error) {
      this.logger.error('Error al inicializar datos de pokémons:', error);
    }
  }

  async searchPokemonsByName(searchTerm: string): Promise<Pokemon[]> {
    try {
      const allPokemons = await this.getAllPokemons();
      
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const searchTermLower = searchTerm.toLowerCase().trim();
      
      // Filtrar pokémons que contengan el término de búsqueda
      const filteredPokemons = allPokemons.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchTermLower)
      );

      // Ordenar por relevancia: coincidencias que empiecen con el término primero
      filteredPokemons.sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(searchTermLower);
        const bStartsWith = b.name.toLowerCase().startsWith(searchTermLower);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      });

      // Limitar a 10 resultados para mejor performance
      return filteredPokemons.slice(0, 10);
    } catch (error) {
      this.logger.error('Error al buscar pokémons:', error);
      throw new Error('Error al buscar pokémons');
    }
  }

  private async getAllPokemons(): Promise<Pokemon[]> {
    try {
      if (!fs.existsSync(this.pokemonsFilePath)) {
        await this.generatePokemonsData();
      }

      const data = fs.readFileSync(this.pokemonsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Error al obtener pokémons:', error);
      throw new Error('Error al obtener los datos de pokémons');
    }
  }

  private async generatePokemonsData(): Promise<void> {
    try {
      this.logger.log('Iniciando generación de datos de pokémons...');
      
      // Obtener la lista de pokémons (aumentamos el límite para tener más datos)
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=200');
      
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`);
      }

      const data: PokeApiResponse = await response.json();
      
      this.logger.log(`Obtenidos ${data.results.length} pokémons. Obteniendo detalles...`);

      // Obtener detalles de cada pokémon con control de concurrencia
      const pokemonDetails: Pokemon[] = [];
      const batchSize = 10; // Procesar en lotes para evitar sobrecarga

      for (let i = 0; i < data.results.length; i += batchSize) {
        const batch = data.results.slice(i, i + batchSize);
        const batchPromises = batch.map(pokemon => this.getPokemonDetails(pokemon.url));
        
        try {
          const batchResults = await Promise.all(batchPromises);
          const transformedBatch = batchResults.map(detail => ({
            id: detail.id,
            name: detail.name,
            image: detail.sprites.other['official-artwork'].front_default || detail.sprites.front_default
          }));
          
          pokemonDetails.push(...transformedBatch);
          this.logger.log(`Procesado lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.results.length/batchSize)}`);
        } catch (error) {
          this.logger.warn(`Error en lote ${Math.floor(i/batchSize) + 1}:`, error);
        }
      }

      // Crear directorio si no existe
      const dataDir = path.dirname(this.pokemonsFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Guardar los datos en el archivo JSON
      fs.writeFileSync(this.pokemonsFilePath, JSON.stringify(pokemonDetails, null, 2));
      
      this.logger.log(`Datos de pokémons generados exitosamente. Total: ${pokemonDetails.length}`);
    } catch (error) {
      this.logger.error('Error al generar datos de pokémons:', error);
      throw new Error('Error al generar los datos de pokémons');
    }
  }

  private async getPokemonDetails(url: string): Promise<PokeApiPokemonDetail> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al obtener detalles del pokémon: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Error al obtener detalles del pokémon desde ${url}:`, error);
      throw error;
    }
  }
}