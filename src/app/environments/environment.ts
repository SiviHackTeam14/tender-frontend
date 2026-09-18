export const environment = {
  apiUrl: 'http://localhost:8000',
  useMock: true,
};

// Shared so the thin HTTP-client services don't each re-implement the
// trailing-slash normalization.
export function apiPath(path: string): string {
  return `${environment.apiUrl.replace(/\/$/, '')}${path}`;
}
