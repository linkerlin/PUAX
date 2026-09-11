/**
 * v4 HTTP 路由（dashboard / roles / amp / theater）。
 * 从 server/core 抽出，便于单测而不必起监听。
 */

import { buildV4Dashboard, buildV4RoleCatalog } from '../core/v4-dashboard.js';
import { ampSpecDoc } from '../core/amp.js';
import { planSiliconTheater } from '../core/silicon-theater.js';
import { getTtfSummary } from '../core/ttf.js';

export interface V4Response {
  status: number;
  json: unknown;
}

export function dispatchV4(method: string, pathname: string): V4Response | null {
  if (method === 'OPTIONS' && pathname.startsWith('/v4/')) {
    return { status: 204, json: null };
  }
  if (method !== 'GET') return null;
  switch (pathname) {
    case '/v4/dashboard':
      return { status: 200, json: buildV4Dashboard() };
    case '/v4/roles':
      return { status: 200, json: { roles: buildV4RoleCatalog() } };
    case '/v4/amp':
      return { status: 200, json: ampSpecDoc() };
    case '/v4/theater':
      return { status: 200, json: planSiliconTheater() };
    case '/v4/ttf':
      return { status: 200, json: getTtfSummary() };
    default:
      return null;
  }
}
