export const siteMeta = {
  name: 'North Shore Nautical',
  titleSuffix: 'North Shore Nautical',
  description:
    "Premium boat storage, launch delivery, and optional pre-launch cleaning for Chicago's North Shore.",
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
  'Stored-client service',
  'Lloyd or Evanston launch delivery',
  'Optional pre-launch cleaning',
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
    slug: 'care',
    name: 'Boat Care',
    summary:
      'Refined care options that keep stored boats launch-ready, including optional cleaning before delivery to the ramp.',
    bullets: [
      'Optional pre-launch cleaning',
      'Readiness checks before scheduled delivery',
      'Clear handling notes and care coordination',
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
      'Optional cleaning selected during reservation',
      'Minimum 24-hour lead time for scheduling review',
      'Requests submitted for confirmation, not instant booking',
    ],
  },
]

export const howItWorks = [
  {
    title: 'Submit your reservation request',
    description:
      'Choose Lloyd Boat Launch or Evanston Boat Launch, select whether you want cleaning, and submit your preferred launch time at least 24 hours in advance.',
  },
  {
    title: 'We confirm scheduling and details',
    description:
      'North Shore Nautical reviews delivery timing, launch destination, and any care notes for the boat already stored with us.',
  },
  {
    title: 'Your boat is prepared for launch-day coordination',
    description:
      'Your boat is prepared in storage, cleaned if requested, and coordinated for orderly launch-day delivery.',
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
      'Please provide your contact details, boat name, boat type or model, approximate length, requested launch date and time, your preferred launch destination, whether you would like cleaning, and any special handling notes.',
  },
  {
    question: 'Is reservation submission an automatic confirmation?',
    answer:
      'No. Reservation requests are submitted for scheduling review. North Shore Nautical confirms availability after reviewing the requested timing, destination, cleaning preference, and service details.',
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
    question: 'Can I keep my boat information on file for faster future reservations?',
    answer:
      'Yes. North Shore Nautical can issue secure invitation-only client accounts so repeat clients can sign in, keep their boat details on file, and submit future launch requests more quickly.',
  },
  {
    question: 'What happens if weather affects launch timing?',
    answer:
      'Lake conditions can affect launch timing. When timing needs to shift because of weather or safety concerns, North Shore Nautical communicates promptly and works to coordinate the best next step.',
  },
]
