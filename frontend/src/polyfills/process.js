const getGlobalScope = () => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof self !== 'undefined') return self;
  return {};
};

const globalScope = getGlobalScope();

if (!globalScope.process) {
  const env = typeof import.meta !== 'undefined' && import.meta.env
    ? { ...import.meta.env }
    : {};

  Object.defineProperty(globalScope, 'process', {
    value: {
      env,
      browser: true,
      cwd: () => '/',
      nextTick: (cb, ...args) => Promise.resolve().then(() => cb(...args))
    },
    writable: false,
    enumerable: false,
    configurable: false
  });
}
