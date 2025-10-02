import { BrandHeader } from "@/components/brand-header"
import { Hero } from "@/components/landing/hero"
import { PreviewTabs } from "@/components/landing/preview-tabs"
import { FeatureCards } from "@/components/landing/feature-cards"
import { CTAFooter } from "@/components/landing/cta-footer"

export default function HomePage() {
  return (
    <main>
      <BrandHeader />
      <Hero />
      <section className="container mx-auto px-4 py-14 md:py-20">
        <PreviewTabs />
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <FeatureCards />
      </section>
      <CTAFooter />
    </main>
  )
}
