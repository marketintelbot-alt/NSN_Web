export const siteMeta = {
  name: 'North Shore Nautical',
  titleSuffix: 'North Shore Nautical',
  description:
    "Premium boat storage, detailing, waxing, launch delivery, and polished online booking for Chicago's North Shore.",
  siteUrl:
    import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ||
    'https://www.northshorenautical.com',
  heroImage: '/images/north-shore-hero.jpeg',
  socialImage: '/images/social-card.svg',
  timeZone: 'America/Chicago',
}

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Storage', to: '/storage' },
  { label: 'Reserve Launch', to: '/reserve-launch' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
]

export const trustIndicators = [
  'Live available booking times',
  'Lloyd or Evanston launch delivery',
  'Clear confirmation emails',
  'North Shore handling',
]

export const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const

export const serviceAreas = [
  'Evanston',
  'Wilmette',
  'Kenilworth',
  'Winnetka',
  'Glencoe',
  'Highland Park',
  'Lake Forest',
  'Lake Bluff',
]

export const contactDetails = {
  email: 'concierge@northshorenautical.com',
  phoneDisplay: '(847) 555-0142',
  phoneHref: 'tel:+18475550142',
  responseExpectation:
    'Launch delivery reservations and service inquiries are reviewed promptly during business hours, with scheduling coordinated around stored-client readiness, requested timing, and launch destination.',
  urgentNote:
    'For weather-sensitive or time-sensitive changes after you submit a request, call directly so launch timing, Lloyd or Evanston delivery, and any cleaning needs can be reviewed quickly.',
}

export const services = [
  {
    slug: 'storage',
    name: 'Boat Storage',
    summary:
      'Orderly, professionally managed storage designed for owners whose boats stay with North Shore Nautical and are prepared for scheduled launch delivery.',
    bullets: [
      'Structured storage handling and vessel readiness',
      'Careful oversight for stored-client boats',
      'Launch preparation built into the storage relationship',
    ],
  },
  {
    slug: 'detailing',
    name: 'Detailing',
    summary:
      'Interior and exterior detailing services designed to keep stored boats clean, presentable, and ready before launch day.',
    bullets: [
      'Trash removal, basic tidy, spot wipe-downs, and interior vacuuming',
      'Deep vinyl cleaning, UV protection, compartment wipe-downs, and light mildew treatment',
      'Full exterior washing, non-skid deck scrubs, and hardware cleaning',
    ],
  },
  {
    slug: 'waxing',
    name: 'Waxing & Finish Correction',
    summary:
      'Protective waxing and finish-correction work for owners who want stronger gloss, cleaner brightwork, and a more polished presentation.',
    bullets: [
      'Single-stage polish with wax or sealant application',
      'Oxidation removal and multi-stage compounding when needed',
      'Stainless and aluminum hand polishing for finished details',
    ],
  },
  {
    slug: 'launch-coordination',
    name: 'Launch Coordination',
    summary:
      'A polished scheduling process for boats already stored with North Shore Nautical, timed around clean delivery to the launch.',
    bullets: [
      'Advance scheduling and timing review',
      'Delivery coordination to Lloyd or Evanston Boat Launch',
      'Contingency-minded planning around lake conditions',
    ],
  },
  {
    slug: 'driver-reservation',
    name: 'Launch Delivery Reservation',
    summary:
      'A reservation-based delivery service for stored-client boats being brought to Lloyd Boat Launch or Evanston Boat Launch.',
    bullets: [
      'Launch choice between Lloyd Boat Launch and Evanston Boat Launch',
      'Open online times managed directly by North Shore Nautical',
      'Minimal booking form built for phones',
      'Instant booking confirmation with transactional email follow-up',
    ],
  },
]

export const serviceMenuSections = [
  {
    title: 'Detailing Packages Include',
    description:
      'Core detailing work is built around practical cleaning, cleaner presentation, and launch-day readiness.',
    items: [
      'Trash removal and basic tidy',
      'Spot wipe-down of seats, helm, and cupholders',
      'Interior vacuuming and light sweep',
      'Deep vinyl cleaning and UV protection',
      'Interior compartments and storage wiped',
      'Light mildew and odor treatment',
      'Full exterior wash of hull and topsides',
      'Non-skid deck scrub',
      'Windows, rails, and hardware cleaned',
    ],
  },
  {
    title: 'Waxing & Restoration Services',
    description:
      'Finish work ranges from gloss-boosting protection to deeper correction for weathered or oxidized surfaces.',
    items: [
      'Single-stage machine polish',
      'Wax or sealant application',
      'Light-to-moderate oxidation removal',
      'Multi-stage compounding and correction',
      'Stainless and aluminum hand polish',
    ],
  },
  {
    title: 'A La Carte Interior Services',
    description:
      'Interior work can also be scheduled as individual services when a full detail is not needed.',
    items: [
      'Carpet and mat shampoo',
      'Vinyl seat deep clean and condition',
      'Cabin interior detail',
      'Mold and mildew treatment',
    ],
  },
  {
    title: 'A La Carte Exterior Services',
    description:
      'Exterior services can be scheduled individually for upkeep, presentation, or finish recovery.',
    items: [
      'Exterior wash only',
      'Non-skid deck scrub',
      'Buff and wax (single-stage)',
      'Oxidation removal',
    ],
  },
  {
    title: 'Specialty & Add-On Services',
    description:
      'Additional finish and seasonal services are available when a boat needs something more specific than a standard detail.',
    items: [
      'Stainless and aluminum polishing',
      'Teak cleaning and oiling',
      'Decal removal',
      'Seasonal launch and haul-out detail',
    ],
  },
]

export const serviceNotes = [
  'Service scope depends on vessel condition and accessibility.',
  'Minimum service charges apply.',
  'Fully insured, with most marinas available upon request.',
]

export const howItWorks = [
  {
    title: 'Choose an open time slot',
    description:
      'Pick from the available launch times already opened by North Shore Nautical.',
  },
  {
    title: 'Confirm your contact details',
    description:
      'Enter your name, email, phone number, and any note that helps with coordination.',
  },
  {
    title: 'Receive your confirmation',
    description:
      'Your booking is saved first, then North Shore Nautical and the client both receive transactional confirmation.',
  },
]

export const principles = [
  {
    title: 'Professional handling',
    description:
      'Every interaction is shaped around careful coordination, clear expectations, and respect for the ownership experience.',
  },
  {
    title: 'North Shore fluency',
    description:
      "The service model is grounded in the rhythms of Chicago's North Shore shoreline, harbors, and launch schedules.",
  },
  {
    title: 'Calm communication',
    description:
      'Clients receive concise, timely updates without unnecessary noise, so the process feels steady from request through launch day.',
  },
]

export const faqs = [
  {
    question: 'How far in advance do I need to reserve launch delivery?',
    answer:
      'Launch delivery reservations must be submitted at least 24 hours before the requested launch time. This lead time allows North Shore Nautical to review delivery availability and confirm scheduling properly.',
  },
  {
    question: 'Do you accept same-day requests?',
    answer:
      'Same-day launch delivery is not guaranteed. If a request falls inside the 24-hour scheduling window, the reservation form will not accept it. For urgent situations, contact North Shore Nautical directly.',
  },
  {
    question: 'What information do I need to submit a reservation?',
    answer:
      'Just provide your name, email address, phone number, and any optional note helpful for launch-day coordination. The time slot itself is selected before you submit.',
  },
  {
    question: 'Is reservation submission an automatic confirmation?',
    answer:
      'Yes. The website only shows slots that North Shore Nautical has already opened, so choosing a time and submitting the form confirms the booking.',
  },
  {
    question: 'Are these reservations usually for boats already stored with North Shore Nautical?',
    answer:
      'Yes. In most cases, launch reservations are for boats already stored with North Shore Nautical. If your storage situation is different, note it in the reservation instructions or contact us directly before scheduling.',
  },
  {
    question: 'Which launch destinations can I choose?',
    answer:
      'Launch delivery reservations currently offer two destination choices: Lloyd Boat Launch and Evanston Boat Launch.',
  },
  {
    question: 'Can I request cleaning before launch delivery?',
    answer:
      'Yes. The reservation form includes a cleaning option so you can request pre-launch cleaning as part of the scheduled delivery.',
  },
  {
    question: 'What if I need a time that is not listed online?',
    answer:
      'Contact North Shore Nautical directly. Additional slots can be opened manually when availability allows.',
  },
  {
    question: 'What happens if weather affects launch timing?',
    answer:
      'Lake conditions can affect launch timing. When timing needs to shift because of weather or safety concerns, North Shore Nautical communicates promptly and works to coordinate the best next step.',
  },
]
