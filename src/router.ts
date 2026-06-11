import { useSyncExternalStore } from 'react';

/**
 * 手写 hash 路由，零依赖。
 * '#/split/abc' → '/split/abc'；无 hash 或非法 hash → '/'。
 */

/** 旧版分享链接（#restore= / #view=）重定向到分账工具的对应子路由，已发出去的链接不能死 */
function normalizeLegacyHash() {
  const m = location.hash.match(/^#(restore|view)=(.+)$/);
  if (m) location.replace(`${location.pathname}#/split/${m[1]}/${m[2]}`);
}
normalizeLegacyHash();

function getPath(): string {
  const h = location.hash;
  return h.startsWith('#/') ? h.slice(1) : '/';
}

function subscribe(cb: () => void): () => void {
  const handler = () => {
    normalizeLegacyHash();
    cb();
  };
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, getPath);
}

export function navigate(path: string) {
  location.hash = '#' + path;
}

/** 替换当前历史记录（重定向用，不留返回足迹） */
export function redirect(path: string) {
  location.replace(`${location.pathname}#${path}`);
}
