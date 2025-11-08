import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe } from 'lucide-react'
import { languagesService, Language } from '../api/languages'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true)
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const navigation = [
    { name: t('navbar.home'), href: '/' },
    { name: t('navbar.tours'), href: '/tours' },
    { name: t('navbar.excursions') || 'Excursions', href: '/excursions' },
    { name: t('navbar.gallery'), href: '/gallery' },
    { name: t('navbar.booking'), href: '/booking' },
    { name: t('navbar.contact'), href: '/contact' },
    { name: 'Admin', href: '/admin' },
  ]

  // Fetch active languages on component mount with caching
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        // Check if we have cached languages
        const cachedData = localStorage.getItem('active_languages')
        const cachedTimestamp = localStorage.getItem('active_languages_timestamp')
        
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
        
        // Use cached data if it's less than 5 minutes old
        if (cachedData && cachedData !== 'undefined' && cachedTimestamp) {
          try {
            const timestamp = parseInt(cachedTimestamp, 10)
            if (now - timestamp < fiveMinutes) {
              const parsed = JSON.parse(cachedData)
              if (Array.isArray(parsed) && parsed.length > 0) {
                setLanguages(parsed)
                setIsLoadingLanguages(false)
                return
              }
            }
          } catch (e) {
            // Clear corrupted cache
            localStorage.removeItem('active_languages')
            localStorage.removeItem('active_languages_timestamp')
          }
        }
        
        // Fetch fresh data from API
        const activeLanguages = await languagesService.getActiveLanguages()
        setLanguages(activeLanguages)
        
        // Cache the data
        localStorage.setItem('active_languages', JSON.stringify(activeLanguages))
        localStorage.setItem('active_languages_timestamp', now.toString())
        
        setIsLoadingLanguages(false)
      } catch (error) {
        console.error('Failed to fetch languages:', error)
        // Fallback to EN and FR if API fails
        setLanguages([
          { id: '1', code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸', is_active: true, is_default: true, created_at: '' },
          { id: '2', code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷', is_active: true, is_default: false, created_at: '' }
        ])
        setIsLoadingLanguages(false)
      }
    }

    fetchLanguages()
  }, [])

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
                disabled={isLoadingLanguages}
              >
                <Globe size={18} />
                <span className="text-sm font-medium">
                  {i18n.language.toUpperCase()}
                </span>
              </button>

              {showLanguageMenu && !isLoadingLanguages && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                        i18n.language === lang.code ? 'text-moroccan-terracotta font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag_emoji}</span>
                      <span>{lang.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button and language switcher */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Mobile Language Switcher - Always visible */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-1 text-gray-700 hover:text-moroccan-terracotta transition-colors duration-200"
                disabled={isLoadingLanguages}
              >
                <Globe size={20} />
                <span className="text-sm font-medium">
                  {i18n.language.toUpperCase()}
                </span>
              </button>

              {showLanguageMenu && !isLoadingLanguages && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                        i18n.language === lang.code ? 'text-moroccan-terracotta font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag_emoji}</span>
                      <span>{lang.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hamburger menu button - Bigger and with margin */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-moroccan-terracotta transition-colors duration-200 p-2 mr-2"
            >
              {isOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="py-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-base font-medium transition-colors duration-200 border-l-4 ${
                    isActive(item.href)
                      ? 'text-moroccan-terracotta bg-moroccan-sand border-moroccan-terracotta'
                      : 'text-gray-700 hover:text-moroccan-terracotta hover:bg-gray-50 border-transparent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar