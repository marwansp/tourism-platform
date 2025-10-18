import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailsPage from './pages/TourDetailsPage'
import BookingPageV2 from './pages/BookingPageV2'
import GalleryPage from './pages/GalleryPage'
import ContactPage from './pages/ContactPage'
import AdminPage from './pages/AdminPage'
import ReviewPage from './pages/ReviewPage'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{t('meta.title', 'Morocco Tourism - Discover the Magic of Morocco')}</title>
        <meta name="description" content={t('meta.description', 'Discover Morocco with our authentic tours. Experience the Sahara Desert, Atlas Mountains, and historic cities. Book your adventure today!')} />
        <meta name="keywords" content="Morocco, tourism, Sahara Desert, Atlas Mountains, Marrakech, tours, travel" />
        <meta property="og:title" content={t('meta.title', 'Morocco Tourism - Discover the Magic of Morocco')} />
        <meta property="og:description" content={t('meta.description', 'Discover Morocco with our authentic tours')} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      
      <ScrollToTop />
      <Navbar />
      
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailsPage />} />
          <Route path="/booking" element={<BookingPageV2 />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/review/:token" element={<ReviewPage />} />
        </Routes>
      </main>
      
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <WhatsAppButton />
    </div>
  )
}

export default App