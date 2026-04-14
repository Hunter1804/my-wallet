export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message)
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type ApiClientOptions = {
  baseUrl: string
  getAccessToken?: () => string | null
}

export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  private url(path: string) {
    const base = this.opts.baseUrl.replace(/\/+$/, '')
    const p = path.startsWith('/') ? path : `/${path}`
    return `${base}${p}`
  }

  async request<T>(method: HttpMethod, path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    const u = new URL(this.url(path))
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === '') continue
        u.searchParams.set(k, String(v))
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const token = this.opts.getAccessToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(u.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const text = await res.text()
    const data = text ? (JSON.parse(text) as unknown) : null

    if (!res.ok) {
      throw new ApiError('API request failed', res.status, data)
    }
    return data as T
  }

  get<T>(path: string, query?: Record<string, unknown>) {
    return this.request<T>('GET', path, undefined, query)
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body)
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body)
  }
  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export const api = new ApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
})

