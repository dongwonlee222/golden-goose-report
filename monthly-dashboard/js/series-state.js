export function createSeriesSelection(keys) {
  const allKeys = [...new Set(keys)];
  let isolatedKeys = null;

  return {
    get visibleKeys() {
      return isolatedKeys ? [...isolatedKeys] : [...allKeys];
    },
    get isIsolated() {
      return isolatedKeys !== null;
    },
    toggleOnly(key) {
      const keys = [...new Set(Array.isArray(key) ? key : [key])];
      if (!keys.length || keys.some(item => !allKeys.includes(item))) return this.visibleKeys;
      const same = isolatedKeys?.length === keys.length && keys.every(item => isolatedKeys.includes(item));
      isolatedKeys = same ? null : keys;
      return this.visibleKeys;
    },
    showAll() {
      isolatedKeys = null;
      return this.visibleKeys;
    },
  };
}
