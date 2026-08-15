// AUTHOR: Htet Nandar(Grace)
/**
 * Thin wrapper around a browser Storage (localStorage/sessionStorage) that namespaces keys
 * with a prefix. Extracted so AuthService (customer/merchant) and AdminAuthService can share
 * the read/write/clear logic without sharing WHERE they store it - customer/merchant sessions
 * live in localStorage (survive tab close, normal shopper UX), admin sessions live in
 * sessionStorage under a 'smartcart_admin' prefix (cleared on tab close, and namespaced so an
 * admin login in one tab can never collide with a customer/merchant session in another tab of
 * the same browser). See AuthService/AdminAuthService for the two configured instances.
 */
export class AuthStore {
  constructor(
    private readonly storage: Storage,
    private readonly prefix: string,
  ) {}

  private key(name: string): string {
    return this.prefix ? `${this.prefix}_${name}` : name;
  }

  set(name: string, value: string): void {
    this.storage.setItem(this.key(name), value);
  }

  get(name: string): string | null {
    return this.storage.getItem(this.key(name));
  }

  remove(name: string): void {
    this.storage.removeItem(this.key(name));
  }

  clear(names: string[]): void {
    names.forEach((name) => this.remove(name));
  }
}
