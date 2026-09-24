export interface PageQuery {
  readonly page?: number;
  readonly limit?: number;
}

// Persisted pagination result shape returned by list use cases. Mirrors the
// existing API contract (data/total/page/limit) so consumers stay unchanged.
export interface Page<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
