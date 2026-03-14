import { Helmet } from 'react-helmet-async'

import { siteMeta } from '../../content/site'

type SeoProps = {
  title: string
  description: string
  path: string
  image?: string
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
  noIndex?: boolean
}

export function Seo({
  title,
  description,
  path,
  image = siteMeta.socialImage,
  structuredData,
  noIndex = false,
}: SeoProps) {
  const canonicalUrl = new URL(path, siteMeta.siteUrl).toString()
  const imageUrl = new URL(image, siteMeta.siteUrl).toString()
  const fullTitle = `${title} | ${siteMeta.titleSuffix}`
  const structuredItems = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : []

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteMeta.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      {structuredItems.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  )
}
