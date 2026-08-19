export class AuthUtils {
  static isTokenExpired(token: string, offsetSeconds: number = 0): boolean {
    if (!token) return true;
    const expDate = this._getTokenExpirationDate(token);
    if (!expDate) return true;
    return !(
      expDate.valueOf() >
      new Date().valueOf() + offsetSeconds * 1000
    );
  }

  private static _getTokenExpirationDate(token: string): Date | null {
    const decoded: any = this._decode(token);
    if (!decoded?.exp) return null;
    const d = new Date(0);
    d.setUTCSeconds(decoded.exp);
    return d;
  }

  private static _decode(token: string): any | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(payload)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  
  // Additional helper methods
  static isUtcExpiredOrNear(isoUtc: string | null | undefined, seconds = 5): boolean {
    if (!isoUtc) return true;
    const expiresMs = Date.parse(isoUtc);
    if (Number.isNaN(expiresMs)) return true;
    return expiresMs <= Date.now() + seconds * 1000;
  }

  static decodeToken(token: string): any | null {
    return this._decode(token);
  }
  
  static getTokenPayload(token: string): any | null {
    return this._decode(token);
  }
  
  static getTokenExpirationDate(token: string): Date | null {
    return this._getTokenExpirationDate(token);
  }
}