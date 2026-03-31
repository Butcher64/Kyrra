import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import { LazyMotion } from 'motion/react'
import { domAnimation } from '@/lib/lazy-motion'
import { getOrganizationSchema, getSoftwareApplicationSchema } from '@/lib/jsonld'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LazyMotion features={domAnimation}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([getOrganizationSchema(), getSoftwareApplicationSchema()]) }}
      />
      <div className="bg-white text-[#1a1f36] min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </LazyMotion>
  )
}
