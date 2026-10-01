import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import About from '../components/landing/About.jsx'
import Creators from '../components/landing/Creators.jsx'
import Features from '../components/landing/Features.jsx'
import Contact from '../components/landing/Contact.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white">
      <Navbar />
      <Hero />
      <About />
      <Creators />
      <Features />
      <Contact />
      <Footer />
    </div>
  )
}