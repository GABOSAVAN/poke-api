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