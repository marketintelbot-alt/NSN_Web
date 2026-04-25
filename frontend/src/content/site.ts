export type PublicNavigationItem = {
  label: string
  to: string
  children?: Array<{
    label: string
    to: string
  }>
}

export const siteMeta = {
  name: 'North Shore Nautical',
  titleSuffix: 'North Shore Nautical',
  tagline: 'Premium Marine Care & Advisory',
  description:
    "Premium boat detailing, marine care, and practical owner advisory for Chicago's North Shore and Lake Michigan marinas.",
  siteUrl: import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || 'https://nsnautical.com',
  heroImage: '/images/north-shore-hero.jpeg',
  socialImage: '/images/social-card.svg',
  timeZone: 'America/Chicago',
}

export const navigation: PublicNavigationItem[] = [
  { label: 'Home', to: '/' },
  {
    label: 'Services',
    to: '/services',
    children: [
      { label: 'Marine Care', to: '/services' },
      { label: 'Advisory', to: '/advisory' },
    ],
  },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Advisory', to: '/advisory' },
  { label: 'Contact', to: '/contact' },
]

export const serviceAreas = [
  'Chicago',
  'Wilmette',
  'Kenilworth',
  'Winnetka',
  'Glencoe',
  'Highland Park',
  'Lake Forest',
  'Lake Bluff',
]

export const brandPromise =
  'We help North Shore boat owners keep their boats clean, protected, and ready to enjoy all summer.'

export const trustHighlights = [
  'Premium detailing and upkeep-first service plans',
  'Manual request review before any payment is captured',
  'Chicago North Shore and Lake Michigan scheduling fluency',
  'Practical advisory support for confident ownership decisions',
]

export const homeMetrics = [
  {
    label: 'Primary Focus',
    value: 'Marine Care',
    description: 'Detailing, upkeep, protection, and finish care lead the service experience.',
  },
  {
    label: 'Checkout Model',
    value: 'Pending Review',
    description: 'Requests are reviewed before approval, and card authorizations are captured only after approval.',
  },
  {
    label: 'Service Footprint',
    value: 'North Shore + Lake Michigan',
    description: 'Built for marina-based owners across Chicago’s North Shore communities.',
  },
]

export const marineCareHighlights = [
  {
    title: 'Maintenance Detail',
    description: 'For recurring seasonal upkeep, light interior care, and a fresh-ready exterior.',
  },
  {
    title: 'Signature Detail',
    description: 'A fuller marine care package when presentation, comfort, and finish all matter.',
  },
  {
    title: 'Specialty Surface Care',
    description:
      'Buff and wax, non-skid deck scrubs, vinyl deep cleaning, and targeted care for high-touch surfaces.',
  },
]

export const advisoryHighlights = [
  {
    title: 'Buying Guidance',
    description: 'Practical support for sorting through listings, marina realities, and ownership-fit questions.',
  },
  {
    title: 'Care Planning',
    description: 'Seasonal upkeep planning, referral guidance, and owner-side maintenance coordination.',
  },
  {
    title: 'Ownership Support',
    description:
      'North Shore-specific guidance for pre-season prep, post-season planning, and trusted next steps.',
  },
]

export const galleryStories = [
  {
    title: 'Clean exterior finish',
    caption: 'A bright, polished look that feels ready for a full Lake Michigan weekend.',
    image: '/images/north-shore-hero.jpeg',
  },
  {
    title: 'Summer-ready presentation',
    caption: 'Fresh surfaces, clean interiors, and a service rhythm built around marina life.',
    image: '/images/north-shore-hero.jpeg',
  },
  {
    title: 'North Shore detail standards',
    caption: 'Marine care that looks calm, premium, and intentional from the first walkthrough.',
    image: '/images/hero-lake-fallback.svg',
  },
  {
    title: 'Owner-focused upkeep',
    caption: 'Support designed around clean boats, clear communication, and practical next steps.',
    image: '/images/hero-lake-fallback.svg',
  },
]

export const advisoryPillars = [
  {
    title: 'Pre-purchase support',
    description:
      'Owner-side guidance to help you think through fit, upkeep expectations, and practical follow-up questions.',
  },
  {
    title: 'Seasonal planning',
    description:
      'A simple roadmap for pre-season prep, peak-summer upkeep, and post-season care planning.',
  },
  {
    title: 'Referral guidance',
    description:
      'Trusted direction toward technicians, vendors, and next-step specialists when a request falls outside our scope.',
  },
]

export const faqItems = [
  {
    question: 'Which services can I check out online?',
    answer:
      'Routine per-foot marine care services can move to secure checkout online. Heavier condition work and advisory requests are reviewed through an inquiry-first process.',
  },
  {
    question: 'When is my card actually charged?',
    answer:
      'For instant-checkout services, your payment method is authorized first. North Shore Nautical captures payment only after reviewing and approving the request.',
  },
  {
    question: 'What if I am not sure which service fits my boat?',
    answer:
      'Choose the “not sure what I need” option in the booking flow or contact form. Those requests are routed directly to a quote-and-review path.',
  },
  {
    question: 'Do you offer advisory without detailing?',
    answer:
      'Yes. Advisory requests can be submitted on their own for buying guidance, upkeep planning, seasonal support, and referral direction.',
  },
]
