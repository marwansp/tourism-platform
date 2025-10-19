import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const navigation = [
    { name: t('navbar.home'), href: '/' },
    { name: t('navbar.tours'), href: '/tours' },
    { name: t('navbar.gallery'), href: '/gallery' },
    { name: t('navbar.booking'), href: '/booking' },
    { name: t('navbar.contact'), href: '/contact' },
    { name: 'Admin', href: '/admin' },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setShowLanguageMenu(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/mylogo.png"
              alt="Atlas Brothers Tours Logo"
              className="logo-image h-24 w-auto"
            />
            <span className="text-3xl font-bold text-moroccan-blue">
              ATLAS BROTHERS TOURS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors duration-200 ${isActive(item.href)
                  ? 'text-moroccan-terracotta border-b-2 border-moroccan-terracotta'
                  : 'text-gray-700 hover:text-moroccan-terracotta'
                  }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-1 text-gray-700 hover:text-moroccan-terracotta transition-colors duration-200"
              >
                <Globe size={18} />
                <span className="text-sm font-medium">
                  {i18n.language.toUpperCase()}
                </span>
              </button>

              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg border">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${i18n.language === 'en' ? 'text-moroccan-terracotta font-medium' : 'text-gray-700'
                      }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLanguage('fr')}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${i18n.language === 'fr' ? 'text-moroccan-terracotta font-medium' : 'text-gray-700'
                      }`}
                  >
                    FR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-moroccan-terracotta transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block font-medium transition-colors duration-200 ${isActive(item.href)
                    ? 'text-moroccan-terracotta'
                    : 'text-gray-700 hover:text-moroccan-terracotta'
                    }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Language Switcher */}
              <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">{t('navbar.language')}:</span>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`text-sm font-medium ${i18n.language === 'en' ? 'text-moroccan-terracotta' : 'text-gray-700'
                    }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`text-sm font-medium ${i18n.language === 'fr' ? 'text-moroccan-terracotta' : 'text-gray-700'
                    }`}
                >
                  FR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar