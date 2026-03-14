import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'

export function TermsOfServicePage() {
  return (
    <>
      <Seo
        title="Terms of Service"
        description="Review the North Shore Nautical terms of service for website usage, reservation requests, and service coordination."
        path="/terms-of-service"
      />
      <PageHero
        eyebrow="Terms of Service"
        title="Terms governing website use and reservation requests."
        description="Effective March 13, 2026. These terms describe the basic conditions for using the North Shore Nautical website and submitting service requests."
      />

      <section className="section-pad">
        <article className="container panel max-w-4xl px-8 py-10 md:px-12 md:py-14">
          <div className="grid gap-8 text-base leading-8 text-slate">
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Website Purpose
              </h2>
              <p className="mt-3">
              The North Shore Nautical website is provided for informational purposes
              and to facilitate service inquiries and reservation requests. Website
              content is intended to describe available services clearly, but it does
              not create a binding service agreement on its own.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Reservation Requests
              </h2>
              <p className="mt-3">
              Launch delivery reservations submitted through the website are requests
              for scheduling review. Submission does not guarantee acceptance,
              confirmation, or delivery availability. Requests must be submitted at
              least 24 hours before the desired launch time.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Client Accounts
              </h2>
              <p className="mt-3">
              If North Shore Nautical enables secure client accounts, each client is
              responsible for maintaining the confidentiality of their login credentials
              and for keeping saved account information accurate and current.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Accuracy of Information
              </h2>
              <p className="mt-3">
              You agree to provide accurate and current information when submitting a
              reservation request or contacting North Shore Nautical. Inaccurate,
              incomplete, or misleading information may affect the ability to review
              or coordinate the request.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Service Changes and Availability
              </h2>
              <p className="mt-3">
              Service availability may change based on scheduling capacity, weather,
              lake conditions, launch access, operational considerations, or other
              circumstances outside normal planning assumptions.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                No Live Scheduling Guarantee
              </h2>
              <p className="mt-3">
              The website does not provide a live booking calendar or automatic launch
              confirmation. Any timing shown or entered through the reservation form
              is subject to manual review and confirmation.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Intellectual Property
              </h2>
              <p className="mt-3">
              Website text, branding, design elements, and presentation are the
              property of North Shore Nautical or its licensors and may not be reused
              without permission.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Limitation of Liability
              </h2>
              <p className="mt-3">
              To the fullest extent permitted by law, North Shore Nautical is not
              liable for indirect, incidental, or consequential damages arising from
              website use, temporary unavailability, or reliance on website content
              before a service arrangement is confirmed directly.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Changes to These Terms
              </h2>
              <p className="mt-3">
              These terms may be updated periodically to reflect operational or
              website changes. Continued use of the website after changes are posted
              constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </article>
      </section>
    </>
  )
}
