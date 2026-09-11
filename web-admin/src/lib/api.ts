const BASE = (import.meta as { env?: { VITE_PUAX_URL?: string } }).env?.VITE_PUAX_URL
  || 'http://127.0.0.1:2333'

export async function fetchDashboard(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/v4/dashboard`)
  if (!res.ok) throw new Error(`dashboard ${res.status}`)
  return res.json()
}

export async function fetchRoles(): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`${BASE}/v4/roles`)
  if (!res.ok) throw new Error(`roles ${res.status}`)
  const data = await res.json()
  return data.roles || []
}

export async function fetchTheater(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/v4/theater`)
  if (!res.ok) throw new Error(`theater ${res.status}`)
  return res.json()
}

export async function fetchAmp(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/v4/amp`)
  if (!res.ok) throw new Error(`amp ${res.status}`)
  return res.json()
}

export async function fetchShield(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/v4/shield`)
  if (!res.ok) throw new Error(`shield ${res.status}`)
  return res.json()
}

export { BASE }
