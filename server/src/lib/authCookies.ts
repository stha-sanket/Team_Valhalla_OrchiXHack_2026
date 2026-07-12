import type { Response, CookieOptions } from 'express';
import { signToken } from 'express-file-cluster/auth';

// When the client and API are served from different origins (ngrok/devtunnel
// demos), browsers only send cookies on cross-site requests if they carry
// SameSite=None — which in turn requires Secure. CROSS_SITE_COOKIES=true in
// .env switches both; Strict remains the default for same-site deployments.
const crossSite = process.env.CROSS_SITE_COOKIES === 'true';

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: crossSite || process.env.NODE_ENV === 'production',
  sameSite: crossSite ? 'none' : 'strict',
};

/** Sign the access JWT and set the efc_token cookie with our attributes
 * (replaces EFC's issueToken, which hardcodes SameSite=Strict). */
export async function issueAccessCookie(res: Response, payload: Record<string, unknown>): Promise<void> {
  res.cookie('efc_token', await signToken(payload), AUTH_COOKIE_OPTIONS);
}

export function setRefreshCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie('efc_refresh_token', token, { ...AUTH_COOKIE_OPTIONS, maxAge: maxAgeMs });
}

/** Clearing must use the same attributes the cookies were set with. */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('efc_token', AUTH_COOKIE_OPTIONS);
  res.clearCookie('efc_refresh_token', AUTH_COOKIE_OPTIONS);
}
