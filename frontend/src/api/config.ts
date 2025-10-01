import axios from 'axios'

// API base URLs - use proxy paths for all environments (nginx will handle routing)
const API_BASE_URLS = {
  tours: '/api/tours',
  bookings: '/api/bookings',
  messaging: '/api/messaging',
  media: '/api/media'
}

// Create axios instances for each service
export const toursApi = axios.create({
  baseURL: API_BASE_URLS.tours,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const bookingsApi = axios.create({
  baseURL: API_BASE_URLS.bookings,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const messagingApi = axios.create({
  baseURL: API_BASE_URLS.messaging,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const mediaApi = axios.create({
  baseURL: API_BASE_URLS.media,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptors for logging (development only)
if (import.meta.env.DEV) {
  [toursApi, bookingsApi, messagingApi, mediaApi].forEach(api => {
    api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data)
        return Promise.reject(error)
      }
    )
  })
}