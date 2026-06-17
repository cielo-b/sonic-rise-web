import { Navbar }              from '@/components/layout/Navbar'
import { Footer }              from '@/components/layout/Footer'
import { HeroSection }         from '@/components/sections/HeroSection'
import { ServicesSection }     from '@/components/sections/ServicesSection'
import { StatsSection }        from '@/components/sections/StatsSection'
import { PortfolioSection }    from '@/components/sections/PortfolioSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection }          from '@/components/sections/CTASection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <StatsSection />
        <PortfolioSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
