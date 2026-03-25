import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import { SmoothScroll } from '@/components/animation/SmoothScroll'
import { LazyMotion } from 'motion/react'
import { domAnimation } from '@/lib/lazy-motion'
import { getOrganizationSchema, getSoftwareApplicationSchema } from '@/lib/jsonld'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SmoothScroll>
      <LazyMotion features={domAnimation}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([getOrganizationSchema(), getSoftwareApplicationSchema()]) }}
        />
        <Navbar />
        <main className="pt-[72px]">{children}</main>
        <Footer />
      </LazyMotion>
    </SmoothScroll>
  )
}
