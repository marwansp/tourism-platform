import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { messagingService } from '../api/messaging'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const ContactPage = () => {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitting(true)
      await messagingService.sendContactMessage(data)
      toast.success(t('contact.success'))
      reset()
    } catch (error) {
      console.error('Error sending contact message:', error)
      toast.error(t('contact.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: t('contact.info.address')
    },
    {
      icon: Phone,
      title: 'Phone',
      content: t('contact.info.phone')
    },
    {
      icon: Mail,
      title: 'Email',
      content: t('contact.info.email')
    },
    {
      icon: Clock,
      title: 'Hours',
      content: t('contact.info.hours')
    }
  ]

  return (
    <>
      <Helmet>
        <title>{t('contact.title')} - Morocco Tourism</title>
        <meta name="description" content={t('contact.subtitle')} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-moroccan-blue text-white section-padding">
          <div className="container-custom text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('contact.info.title')}
                  </h2>
                  <div className="space-y-6">
                    {contactInfo.map((info, index) => {
                      const Icon = info.icon
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-moroccan-terracotta rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                            <p className="text-gray-600">{info.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin size={48} className="mx-auto mb-2" />
                    <p>Interactive Map</p>
                    <p className="text-sm">Marrakech, Morocco</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('contact.form.title')}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.name')} *
                    </label>
                    <input
                      type="text"
                      {...register('name', {
                        required: t('contact.validation.nameRequired')
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                      placeholder={t('contact.form.namePlaceholder')}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.email')} *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: t('contact.validation.emailRequired'),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: t('contact.validation.emailInvalid')
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                      placeholder={t('contact.form.emailPlaceholder')}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.subject')} *
                    </label>
                    <input
                      type="text"
                      {...register('subject', {
                        required: t('contact.validation.subjectRequired')
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent"
                      placeholder={t('contact.form.subjectPlaceholder')}
                    />
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.form.message')} *
                    </label>
                    <textarea
                      rows={6}
                      {...register('message', {
                        required: t('contact.validation.messageRequired'),
                        minLength: {
                          value: 10,
                          message: t('contact.validation.messageMin')
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moroccan-terracotta focus:border-transparent resize-none"
                      placeholder={t('contact.form.messagePlaceholder')}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send size={18} />
                    <span>{submitting ? t('contact.form.submitting') : t('contact.form.submit')}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Space */}
        <section className="py-8 bg-white border-t">
          <div className="container-custom">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Advertisement</div>
              <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Travel Services Ad Space</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default ContactPage