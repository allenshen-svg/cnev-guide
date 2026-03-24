/* router.js — simple hash-based SPA router */
const Router = {
  routes: {},
  on(path, handler) { this.routes[path] = handler; },
  start() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },
  resolve() {
    const hash = location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    // Try exact match first
    if (this.routes[hash]) { this.routes[hash](); return; }
    // Try pattern matching: /brand/:id, /car/:id
    if (parts[0] === 'brand' && parts[1]) {
      if (this.routes['/brand/:id']) { this.routes['/brand/:id'](parts[1]); return; }
    }
    if (parts[0] === 'car' && parts[1]) {
      if (this.routes['/car/:id']) { this.routes['/car/:id'](parts[1]); return; }
    }
    // Try exact match with leading slash
    const withSlash = '/' + parts.join('/');
    if (this.routes[withSlash]) { this.routes[withSlash](); return; }
    // Fallback to home
    if (this.routes['/']) this.routes['/']();
  }
};
