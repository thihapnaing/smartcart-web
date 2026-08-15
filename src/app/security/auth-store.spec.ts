import { AuthStore } from './auth-store';

// AUTHOR: Htet Nandar(Grace)
// A minimal Storage implementation so these tests don't touch the real browser
// localStorage/sessionStorage - each test gets a fresh, isolated backing store.
class FakeStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('AuthStore', () => {
  describe('without a prefix (AuthService usage)', () => {
    let storage: FakeStorage;
    let store: AuthStore;

    beforeEach(() => {
      storage = new FakeStorage();
      store = new AuthStore(storage, '');
    });

    it('writes under the bare key name', () => {
      store.set('token', 'abc123');

      expect(storage.getItem('token')).toBe('abc123');
    });

    it('reads back what was written directly to storage', () => {
      storage.setItem('username', 'grace');

      expect(store.get('username')).toBe('grace');
    });

    it('returns null for a key that was never set', () => {
      expect(store.get('missing')).toBeNull();
    });

    it('removes a single key', () => {
      store.set('token', 'abc123');

      store.remove('token');

      expect(storage.getItem('token')).toBeNull();
    });

    it('clear() removes every listed key and leaves unrelated keys untouched', () => {
      store.set('token', 'abc123');
      store.set('role', 'CUSTOMER');
      storage.setItem('unrelated', 'keep-me');

      store.clear(['token', 'role']);

      expect(storage.getItem('token')).toBeNull();
      expect(storage.getItem('role')).toBeNull();
      expect(storage.getItem('unrelated')).toBe('keep-me');
    });
  });

  describe('with a prefix (AdminAuthService usage)', () => {
    let storage: FakeStorage;
    let store: AuthStore;

    beforeEach(() => {
      storage = new FakeStorage();
      store = new AuthStore(storage, 'smartcart_admin');
    });

    it('namespaces the key as prefix_name', () => {
      store.set('token', 'xyz789');

      expect(storage.getItem('smartcart_admin_token')).toBe('xyz789');
      expect(storage.getItem('token')).toBeNull();
    });

    it('reads back through the same prefix', () => {
      storage.setItem('smartcart_admin_role', 'ADMIN');

      expect(store.get('role')).toBe('ADMIN');
    });

    it('clear() only touches its own namespaced keys', () => {
      storage.setItem('smartcart_admin_token', 'xyz789');
      storage.setItem('token', 'unrelated-customer-token');

      store.clear(['token']);

      expect(storage.getItem('smartcart_admin_token')).toBeNull();
      expect(storage.getItem('token')).toBe('unrelated-customer-token');
    });
  });

  it('a prefixed and an unprefixed store over the same underlying Storage never collide', () => {
    // This is the actual reason AuthStore takes a prefix at all - AuthService (unprefixed,
    // localStorage) and AdminAuthService ('smartcart_admin', sessionStorage) both wrap a
    // token/role pair, and a customer session must never be able to clobber an admin one.
    const storage = new FakeStorage();
    const customer = new AuthStore(storage, '');
    const admin = new AuthStore(storage, 'smartcart_admin');

    customer.set('token', 'customer-token');
    admin.set('token', 'admin-token');

    expect(customer.get('token')).toBe('customer-token');
    expect(admin.get('token')).toBe('admin-token');
  });
});
