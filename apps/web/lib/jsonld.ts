export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kyrra',
    url: 'https://kyrra.io',
    description: 'Pare-feu cognitif anti-prospection pour dirigeants',
    foundingDate: '2026',
  }
}

export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Kyrra',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: "IA de filtrage des emails de prospection pour les dirigeants.",
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'EUR', name: 'Free' },
      { '@type': 'Offer', price: '15', priceCurrency: 'EUR', name: 'Pro', billingIncrement: 'P1M' },
      { '@type': 'Offer', price: '19', priceCurrency: 'EUR', name: 'Team', billingIncrement: 'P1M' },
    ],
  }
}
