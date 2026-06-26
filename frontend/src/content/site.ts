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
  tagline: 'Marine Detailing & Care',
  description:
    "Marine detailing, boat detailing, marine care, and practical owner advisory for boat owners across Chicago's North Shore.",
  siteUrl: 'https://nsnautical.com',
  heroImage: '/images/north-shore-hero.jpeg',
  socialImage: '/images/north-shore-hero.jpeg',
  timeZone: 'America/Chicago',
}

export const publicContact = {
  businessName: 'North Shore Nautical',
  categoryLine: 'Marine Detailing & Care',
  serviceAreaLine: 'Serving Chicago’s North Shore',
  phoneDisplay: '314-606-2112',
  phoneHref: 'tel:+13146062112',
  phoneE164: '+1-314-606-2112',
  emailDisplay: 'carter@ellismarinegroup.com',
  emailHref: 'mailto:carter@ellismarinegroup.com',
  websiteDisplay: 'nsnautical.com',
  websiteUrl: 'https://nsnautical.com',
  mobileServiceStatement:
    'We are a mobile/service-area marine care business. Clients are served at boats, docks, marinas, storage locations, and approved service locations.',
}

export const seoKeywords = [
  'North Shore Nautical',
  'Wilmette boat detailing',
  'Winnetka boat detailing',
  'Wilmette Harbor boat detailing',
  'Wilmette marine care',
  'Winnetka marine care',
  'Wilmette Harbor marine care',
  'North Shore boat detailing',
  'Lake Michigan boat detailing',
  'Chicago North Shore marine detailing',
]

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
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export const serviceAreas = [
  'Chicago’s North Shore',
  'Winnetka',
  'Wilmette',
  'Glencoe',
  'Kenilworth',
  'Highland Park',
  'Lake Forest',
  'Evanston',
  'Northbrook',
  'Glenview',
  'Nearby North Shore areas',
]

export const brandPromise =
  'We help North Shore boat owners keep their boats clean, protected, and ready to enjoy all summer.'

export const localSearchFocus =
  'Serving Chicago’s North Shore and nearby boating communities, including Winnetka, Wilmette, Glencoe, Kenilworth, Highland Park, Lake Forest, Evanston, Northbrook, Glenview, and nearby North Shore areas.'

export const teamMembers = [
  {
    name: 'Carter Ellis',
    role: 'President',
    phoneDisplay: publicContact.phoneDisplay,
    phoneHref: publicContact.phoneHref,
    emailDisplay: publicContact.emailDisplay,
    emailHref: publicContact.emailHref,
    initials: 'CE',
  },
  {
    name: 'Johnny Maris',
    role: 'Vice President',
    phoneDisplay: publicContact.phoneDisplay,
    phoneHref: publicContact.phoneHref,
    emailDisplay: 'johnny@ellismarinegroup.com',
    emailHref: 'mailto:johnny@ellismarinegroup.com',
    initials: 'JM',
  },
]

export const trustHighlights = [
  'Premium detailing and upkeep-first service plans',
  'Manual request review before any payment is captured',
  'Chicago North Shore and Lake Michigan scheduling fluency',
  'Practical advisory support for confident ownership decisions',
]

export const pricingConditionNotes = [
  {
    title: 'Boat condition changes pricing',
    description:
      'Published rates assume routine condition and boats from 10-30 feet. Heavy oxidation, mildew, severe staining, neglected surfaces, unusual access, restoration needs, or boats over 30 feet may increase price or move the request to manual quote review.',
  },
  {
    title: 'Larger boats are quoted directly',
    description:
      'If your boat is larger than 30 feet, contact North Shore Nautical for a custom quote so the team can review size, access, timing, and condition before pricing the work.',
  },
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
    title: 'Interior Refresh',
    description:
      'A light interior-only visit for routine upkeep between deeper details, focused on seating, helm touchpoints, cupholders, debris removal, and a dry microfiber finish.',
  },
  {
    title: 'Maintenance Detail',
    description:
      'For recurring seasonal upkeep with full exterior wash and dry, light interior care, and a fresh-ready exterior.',
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

export type GalleryCategory = {
  label: string
  slug: string
}

export type GalleryStory = {
  title: string
  caption: string
  image: string
  imageAlt: string
  category: string
  categorySlug: string
  beforeImage?: string
  beforeAlt?: string
  afterImage?: string
  afterAlt?: string
  tags?: string[]
}

export const galleryCategories: GalleryCategory[] = [
  { label: 'All Work', slug: 'all' },
  { label: 'Sea Doo', slug: 'sea-doo' },
  { label: 'Bayliner', slug: 'bayliner' },
  { label: 'Sea Ray', slug: 'sea-ray' },
  { label: 'Tige', slug: 'tige' },
  { label: 'Mastercraft', slug: 'mastercraft' },
]

export const galleryStories: GalleryStory[] = [
  {
    title: 'Sea Doo GTX detail',
    caption:
      'Before-and-after Sea Doo cleanup focused on the footwell, cockpit surfaces, seating area, and finished presentation.',
    image: '/images/gallery/sea-doo-after.jpg',
    imageAlt: 'Clean Sea Doo GTX seat and exterior after detailing',
    category: 'Sea Doo',
    categorySlug: 'sea-doo',
    beforeImage: '/images/gallery/sea-doo-before.jpg',
    beforeAlt: 'Dirty Sea Doo footwell and cockpit area before detailing',
    afterImage: '/images/gallery/sea-doo-after.jpg',
    afterAlt: 'Clean Sea Doo GTX seat and exterior after detailing',
    tags: ['Personal watercraft', 'Interior cleanup', 'Footwell grime', 'Finished presentation'],
  },
  {
    title: 'Bayliner cockpit carpet reset',
    caption:
      'Before-and-after cockpit carpet cleanup showing stained foot traffic before the service and a brighter walkthrough after the detail pass.',
    image: '/images/gallery/bayliner/bayliner-cockpit-carpet-after.jpg',
    imageAlt: 'Bayliner cockpit carpet after cleaning',
    category: 'Bayliner',
    categorySlug: 'bayliner',
    beforeImage: '/images/gallery/bayliner/bayliner-cockpit-carpet-before.jpg',
    beforeAlt: 'Stained Bayliner cockpit carpet before cleaning',
    afterImage: '/images/gallery/bayliner/bayliner-cockpit-carpet-after.jpg',
    afterAlt: 'Bayliner cockpit carpet after cleaning',
    tags: ['Cockpit carpet', 'Interior cleanup', 'Before and after', 'Detail pass'],
  },
  {
    title: 'Bayliner hull rail cleanup',
    caption:
      'Exterior before-and-after focused on rail-line grime, water spotting, and the cleaned hull presentation after the wash and finish work.',
    image: '/images/gallery/bayliner/bayliner-hull-rail-after.jpg',
    imageAlt: 'Clean Bayliner hull and rail after exterior detailing',
    category: 'Bayliner',
    categorySlug: 'bayliner',
    beforeImage: '/images/gallery/bayliner/bayliner-hull-rail-before.jpg',
    beforeAlt: 'Bayliner hull and rail with grime before exterior detailing',
    afterImage: '/images/gallery/bayliner/bayliner-hull-rail-after.jpg',
    afterAlt: 'Clean Bayliner hull and rail after exterior detailing',
    tags: ['Exterior wash', 'Rail-line grime', 'Water spots', 'Before and after'],
  },
  {
    title: 'Bayliner finish presentation',
    caption:
      'A close-up finish photo highlighting the cleaned Bayliner side profile, badge line, and reflective hull surface.',
    image: '/images/gallery/bayliner/bayliner-finish-detail.jpg',
    imageAlt: 'Clean Bayliner side profile and badge after detailing',
    category: 'Bayliner',
    categorySlug: 'bayliner',
    tags: ['Gelcoat finish', 'Hull presentation', 'Brand detail', 'Final look'],
  },
  {
    title: 'Sea Ray sink basin cleanup',
    caption:
      'Before-and-after Sea Ray sink basin cleanup showing built-up grime around the drain before service and a cleaner galley surface after the detail pass.',
    image: '/images/gallery/sea-ray/sea-ray-sink-basin-after.jpg',
    imageAlt: 'Clean Sea Ray galley sink and cooktop after detailing',
    category: 'Sea Ray',
    categorySlug: 'sea-ray',
    beforeImage: '/images/gallery/sea-ray/sea-ray-sink-basin-before.jpg',
    beforeAlt: 'Dirty Sea Ray sink basin and drain before detailing',
    afterImage: '/images/gallery/sea-ray/sea-ray-sink-basin-after.jpg',
    afterAlt: 'Clean Sea Ray galley sink and cooktop after detailing',
    tags: ['Cabin galley', 'Sink basin', 'Before and after', 'Interior detail'],
  },
  {
    title: 'Sea Ray side compartment cleanup',
    caption:
      'A close detail comparison focused on the low side compartment and textured surfaces where debris and dark buildup collect.',
    image: '/images/gallery/sea-ray/sea-ray-side-compartment-after.jpg',
    imageAlt: 'Clean Sea Ray side compartment after detailing',
    category: 'Sea Ray',
    categorySlug: 'sea-ray',
    beforeImage: '/images/gallery/sea-ray/sea-ray-side-compartment-before.jpg',
    beforeAlt: 'Dirty Sea Ray side compartment before detailing',
    afterImage: '/images/gallery/sea-ray/sea-ray-side-compartment-after.jpg',
    afterAlt: 'Clean Sea Ray side compartment after detailing',
    tags: ['Side compartment', 'Textured surfaces', 'Before and after', 'Detail access'],
  },
  {
    title: 'Sea Ray galley finish',
    caption:
      'Finished Sea Ray galley presentation with the counter, sink, cooktop cover, surrounding trim, and storage surfaces cleaned up.',
    image: '/images/gallery/sea-ray/sea-ray-galley-finish.jpg',
    imageAlt: 'Clean Sea Ray galley with sink, cooktop, counter, and wood trim',
    category: 'Sea Ray',
    categorySlug: 'sea-ray',
    tags: ['Galley finish', 'Counter surfaces', 'Wood trim', 'Final look'],
  },
  {
    title: 'Sea Ray cabin presentation',
    caption:
      'A wider cabin view showing the dinette, seating, table, trim, and surrounding interior surfaces after the cleanup.',
    image: '/images/gallery/sea-ray/sea-ray-cabin-finish.jpg',
    imageAlt: 'Clean Sea Ray cabin dinette and seating after detailing',
    category: 'Sea Ray',
    categorySlug: 'sea-ray',
    tags: ['Cabin interior', 'Dinette seating', 'Interior presentation', 'Final look'],
  },
]

export const galleryPreviewStories = galleryCategories
  .filter((category) => category.slug !== 'all')
  .flatMap((category) => {
    const story = galleryStories.find((item) => item.categorySlug === category.slug)
    return story ? [story] : []
  })

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
      'Routine flat and per-foot marine care services can move to secure checkout online. Boats over 30 feet, heavier condition work, and advisory requests are reviewed through an inquiry-first process.',
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
    question: 'What is included in Interior Refresh?',
    answer:
      'Interior Refresh is a light interior-only reset for routine upkeep between deeper details. It includes light vacuum if needed, vinyl seating wipe-down, helm touch-point cleaning, cupholder and high-touch-area wipe-down, quick debris removal, and a dry microfiber finish. Exterior cleaning, wax, ceramic, polishing, shampooing, and heavy stain or mildew work are not included.',
  },
  {
    question: 'Do you offer advisory without detailing?',
    answer:
      'Yes. Advisory requests can be submitted on their own for buying guidance, upkeep planning, seasonal support, and referral direction.',
  },
]
