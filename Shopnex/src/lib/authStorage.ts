export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const KEY = 'shopnex.auth.tokens';

export function readTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    return null;
  }
}

export function writeTokens(tokens: AuthTokens | null) {
  if (!tokens) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(tokens));
}


