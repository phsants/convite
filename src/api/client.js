// Em produção (mesmo servidor) usa URL relativa; em dev usa backend local
const base =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : import.meta.env.PROD
      ? ''
      : 'http://localhost:3000'

function getToken() {
  try {
    return localStorage.getItem('convite_token')
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const url = `${base}${path}`
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) {
      try {
        localStorage.removeItem('convite_token')
        localStorage.removeItem('convite_user')
      } catch {}
    }
    const err = new Error(data.error || res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  auth: {
    login(username, password) {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
    },
  },
  parties: {
    list(order = '-created_date', limit = 1, admin = false) {
      const params = new URLSearchParams({
        order,
        limit: String(limit),
      })
      if (admin) params.set('admin', '1')
      return request(`/api/parties?${params}`)
    },
    get(id) {
      return request(`/api/parties/${id}`)
    },
    create(data) {
      return request('/api/parties', { method: 'POST', body: JSON.stringify(data) })
    },
    update(id, data) {
      return request(`/api/parties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    delete(id) {
      return request(`/api/parties/${id}`, { method: 'DELETE' })
    },
  },
  guests: {
    confirm(confirmationToken, updates) {
      return request('/api/guests/confirm', {
        method: 'POST',
        body: JSON.stringify({ confirmation_token: confirmationToken, updates }),
      })
    },
    filter(params, order = '-created_date', limit = 500) {
      const q = new URLSearchParams()
      if (params.party_id) q.set('party_id', params.party_id)
      if (params.confirmation_token) q.set('confirmation_token', params.confirmation_token)
      q.set('order', order)
      q.set('limit', limit)
      return request(`/api/guests?${q}`)
    },
    get(id) {
      return request(`/api/guests/${id}`)
    },
    create(data) {
      return request('/api/guests', { method: 'POST', body: JSON.stringify(data) })
    },
    update(id, data) {
      return request(`/api/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    delete(id) {
      return request(`/api/guests/${id}`, { method: 'DELETE' })
    },
    bulkCreate(records) {
      return request('/api/guests/bulk', {
        method: 'POST',
        body: JSON.stringify(records),
      })
    },
  },
}
