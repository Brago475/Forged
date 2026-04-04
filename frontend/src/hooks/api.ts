const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('forged_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('forged_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  if (response.status === 204) return {} as T
  return response.json()
}

export const api = {
  auth: {
    register: (data: { email: string; username: string; password: string; displayName?: string }) =>
      request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    me: () => request<any>('/auth/me'),

    updateProfile: (data: any) =>
      request<any>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  },

  weight: {
    getAll: (limit = 90) => request<any[]>(`/weight?limit=${limit}`),

    add: (data: { weight: number; date: string; notes?: string }) =>
      request<any>('/weight', { method: 'POST', body: JSON.stringify(data) }),

    delete: (id: string) =>
      request<void>(`/weight/${id}`, { method: 'DELETE' }),
  },

  workout: {
    getLogs: (limit = 30) => request<any[]>(`/workout?limit=${limit}`),

    create: (data: { date: string; planType?: string; dayName?: string; durationMinutes?: number; notes?: string }) =>
      request<any>('/workout', { method: 'POST', body: JSON.stringify(data) }),

    complete: (id: string) =>
      request<any>(`/workout/${id}/complete`, { method: 'PUT' }),

    logExercise: (workoutId: string, data: any) =>
      request<any>(`/workout/${workoutId}/exercises`, { method: 'POST', body: JSON.stringify(data) }),

    logHome: (data: { date: string; exercisesCompleted: number; totalExercises: number }) =>
      request<any>('/workout/home', { method: 'POST', body: JSON.stringify(data) }),

    dashboard: () => request<any>('/workout/dashboard'),
  },

  journal: {
    getAll: (limit = 30) => request<any[]>(`/journal?limit=${limit}`),

    add: (data: { date: string; content: string; mood?: string }) =>
      request<any>('/journal', { method: 'POST', body: JSON.stringify(data) }),
  },

  food: {
    create: (data: any) =>
      request<any>('/food', { method: 'POST', body: JSON.stringify(data) }),

    search: (query: string) => request<any[]>(`/food/search?q=${query}`),

    log: (data: { foodId: string; date: string; mealType: string; servings: number; foodWeightGrams?: number }) =>
      request<any>('/food/log', { method: 'POST', body: JSON.stringify(data) }),

    getLogs: (date: string) => request<any[]>(`/food/log/${date}`),

    summary: (year: number, month: number) =>
      request<any[]>(`/food/summary?year=${year}&month=${month}`),
  },

  fasting: {
    start: (data: { targetHours: number; notes?: string }) =>
      request<any>('/fasting/start', { method: 'POST', body: JSON.stringify(data) }),

    end: (id: string, data: { notes?: string }) =>
      request<any>(`/fasting/${id}/end`, { method: 'PUT', body: JSON.stringify(data) }),

    getActive: () => request<any>('/fasting/active'),
  },

  goals: {
    create: (data: { goalType: string; targetValue?: number; targetUnit?: string; deadline?: string }) =>
      request<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),

    getAll: () => request<any[]>('/goals'),
  },
}