import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react'

const Footer = () => {
  const { t } = useTranslation()

  const quickLinks = [
    { name: t('navbar.home'), href: '/' },
    { name: t('navbar.tours'), href: '/tours' },
    { name: t('navbar.gallery'), href: '/gallery' },
    { name: t('navbar.booking'), href: '/booking' },
    { name: t('navbar.contact'), href: '/contact' },
  ]

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
  ]

  return (
    <footer className="bg-moroccan-blue text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="https://i.ibb.co/qLg7PnQX/Chat-GPT-Image-5-oct-2025-16-29-10.png"
                alt="Atlas Brothers Tours Logo"
                className="logo-image h-16 w-auto"
              />
              <span className="text-xl font-bold">ATLAS BROTHERS TOURS </span>
            </Link>
            <p className="text-gray-300 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-moroccan-gold">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-moroccan-gold transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-moroccan-gold">
              {t('footer.contact')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-moroccan-gold flex-shrink-0" />
                <span className="text-gray-300">{t('contact.info.address')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-moroccan-gold flex-shrink-0" />
                <span className="text-gray-300">{t('contact.info.phone')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-moroccan-gold flex-shrink-0" />
                <span className="text-gray-300">{t('contact.info.email')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock size={18} className="text-moroccan-gold flex-shrink-0" />
                <span className="text-gray-300">{t('contact.info.hours')}</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-moroccan-gold">
              {t('footer.followUs')}
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-moroccan-terracotta hover:bg-moroccan-gold rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon size={18} />
                  </a>
                )
              })}
            </div>
            
            {/* Ad Space Placeholder */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-2">Advertisement</div>
              <div className="h-20 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">Ad Space</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} Morocco Tourism. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer