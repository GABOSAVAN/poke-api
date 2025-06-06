export interface PokeApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokeApiResult[];
  }
  
  export interface PokeApiResult {
    name: string;
    url: string;
  }
  
  export interface PokeApiPokemonDetail {
    id: number;
    name: string;
    sprites: {
      front_default: string;
      other: {
        'official-artwork': {
          front_default: string;
        };
      };
    };
  }