import { messagingApi } from './config'

export interface ContactRequest {
  to: string
  subject: string
  template: string
  data: {
    name: string
    email: string
    subject: string
    message: string
  }
}

export interface ContactResponse {
  message: string
  notification_id: string
}

export interface NotificationResponse {
  id: string
  type: 'email' | 'whatsapp'
  recipient: string
  subject?: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  sent_at?: string
  created_at: string
}

export const messagingService = {
  // Send contact form message
  async sendContactMessage(contactData: {
    name: string
    email: string
    subject: string
    message: string
  }): Promise<ContactResponse> {
    try {
      const request: ContactRequest = {
        to: contactData.email, // This will be overridden to admin email by the service
        subject: contactData.subject,
        template: 'contact_form',
        data: contactData
      }
      
      const response = await messagingApi.post('/contact', request)
      return response.data
    } catch (error) {
      console.error('Error sending contact message:', error)
      throw new Error('Failed to send contact message')
    }
  },

  // Admin: Get all notifications/messages
  async getAllNotifications(): Promise<NotificationResponse[]> {
    try {
      const response = await messagingApi.get('/notifications')
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw new Error('Failed to fetch notifications')
    }
  },

  // Admin: Get notification by ID
  async getNotificationById(id: string): Promise<NotificationResponse> {
    try {
      const response = await messagingApi.get(`/notifications/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching notification:', error)
      throw new Error('Failed to fetch notification details')
    }
  }
}