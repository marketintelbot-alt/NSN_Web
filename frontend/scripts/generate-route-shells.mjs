import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const baseHtml = readFileSync(join(distRoot, 'index.html'), 'utf8')
const siteUrl = 'https://nsnautical.com'
const titleSuffix = 'North Shore Nautical'

const routes = [
  {
    path: '/services',
    title: 'Marine Care Services',
    description:
      'Explore boat detailing, exterior washing, interior care, finish protection, and custom marine care from North Shore Nautical.',
  },
  {
    path: '/pricing',
    title: 'Marine Care Pricing',
    description:
      'Review North Shore Nautical service pricing, per-foot rates, flat-rate care, and custom quote guidance.',
  },
  {
    path: '/gallery',
    title: 'Marine Care Gallery',
    description:
      'Browse before-and-after marine detailing and seasonal boat care work from North Shore Nautical.',
  },
  {
    path: '/advisory',
    title: 'Boat Owner Advisory',
    description:
      'Get practical boat buying, seasonal care, upkeep planning, and owner-side referral guidance.',
  },
  {
    path: '/about',
    title: 'About',
    description:
      'Meet the North Shore Nautical team and learn about its practical, detail-focused approach to marine care.',
  },
  {
    path: '/contact',
    title: 'Contact',
    description:
      'Contact North Shore Nautical for marine detailing, boat care, estimates, and owner advisory across Chicago’s North Shore.',
  },
  {
    path: '/booking',
    title: 'Book Marine Care',
    description:
      'Request North Shore Nautical marine care, review an estimate, and authorize eligible services securely.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'Read the North Shore Nautical privacy policy.',
  },
  {
    path: '/service-agreement',
    title: 'Service Agreement',
    description: 'Review the North Shore Nautical service, cancellation, and refund terms.',
  },
  {
    path: '/booking/confirmation',
    title: 'Booking Confirmation',
    description: 'Review the status of a North Shore Nautical service request.',
    noIndex: true,
  },
  {
    path: '/admin',
    title: 'Admin',
    description: 'North Shore Nautical administration.',
    noIndex: true,
  },
  {
    path: '/portal',
    title: 'Client Portal',
    description: 'North Shore Nautical client portal.',
    noIndex: true,
  },
  {
    path: '/404',
    title: 'Page Not Found',
    description: 'The requested North Shore Nautical page could not be found.',
    noIndex: true,
  },
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function createRouteHtml(route) {
  const canonicalUrl = new URL(route.path, siteUrl).toString()
  const fullTitle = `${route.title} | ${titleSuffix}`
  let html = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escapeHtml(route.description)}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonicalUrl}" />`,
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    )

  if (route.noIndex) {
    html = html.replace(
      '</head>',
      '    <meta name="robots" content="noindex, nofollow" />\n  </head>',
    )
  }

  return html
}

for (const route of routes) {
  const relativePath = route.path === '/404' ? '404.html' : `${route.path.slice(1)}/index.html`
  const outputPath = join(distRoot, relativePath)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, createRouteHtml(route))
}
