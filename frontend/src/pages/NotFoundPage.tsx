import { Link } from 'react-router-dom'

import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'

export function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description="The page you requested could not be found."
        path="/404"
      />
      <PageHero
        eyebrow="Not Found"
        title="This page is no longer available."
        description="The page you were looking for may have moved, or the link may be incomplete."
      >
        <Link className="button-primary" to="/">
          Return Home
        </Link>
      </PageHero>
    </>
  )
}
