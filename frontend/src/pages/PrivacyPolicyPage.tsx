import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'

export function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="Review the North Shore Nautical privacy policy for website usage, reservation submissions, secure client accounts, and email communications."
        path="/privacy-policy"
      />
      <PageHero
        eyebrow="Privacy Policy"
        title="Privacy information for website visitors and inquiry submissions."
        description="Effective March 13, 2026. This policy explains how North Shore Nautical collects, uses, and protects information shared through this website."
      />

      <section className="section-pad">
        <article className="container panel max-w-4xl px-8 py-10 md:px-12 md:py-14">
          <div className="grid gap-8 text-base leading-8 text-slate">
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Information We Collect
              </h2>
              <p className="mt-3">
              North Shore Nautical collects information you submit directly through the
              website, including reservation requests, contact details, boat details,
              requested launch timing, cleaning preferences, and any special
              instructions you choose to share. If client accounts are enabled, the
              site also stores saved-boat information associated with your secure login.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                How Information Is Used
              </h2>
              <p className="mt-3">
              Submitted information is used to review reservation requests, communicate
              about scheduling, respond to inquiries, and maintain a clear service
              record for operational follow-up. If client accounts are enabled,
              account information is used to authenticate returning clients and keep
              saved boat information available for future reservations.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Email Communications
              </h2>
              <p className="mt-3">
              When you submit a reservation request, a confirmation email may be sent
              to the email address you provide. North Shore Nautical may also use that
              address to follow up regarding scheduling, timing changes, or service
              clarifications.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Third-Party Services
              </h2>
              <p className="mt-3">
              This website uses third-party services necessary for hosting, form
              delivery, secure client authentication, and email transmission. These
              providers may process limited information as required to operate the
              website and deliver reservation communications.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Data Retention
              </h2>
              <p className="mt-3">
              Information is retained only for as long as reasonably necessary to
              manage inquiries, coordinate requested services, maintain business
              records, or comply with legal obligations.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Cookies and Analytics
              </h2>
              <p className="mt-3">
              North Shore Nautical may rely on standard website technologies that
              support performance, security, and hosting operations. If analytics are
              added in the future, this policy should be updated to reflect that use.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">Your Choices</h2>
              <p className="mt-3">
              If you would like to update, correct, or request deletion of information
              you previously submitted through the website, contact North Shore
              Nautical directly using the contact information provided on the site.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Policy Updates
              </h2>
              <p className="mt-3">
              This policy may be updated from time to time to reflect service or
              website changes. The effective date at the top of this page indicates
              the most recent version.
              </p>
            </section>
          </div>
        </article>
      </section>
    </>
  )
}
