import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'

export function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy"
        description="Review the North Shore Nautical privacy policy for website usage, booking submissions, and email communications."
        path="/privacy-policy"
      />
      <PageHero
        eyebrow="Privacy Policy"
        title="Privacy information for website visitors and inquiry submissions."
        description="Effective April 23, 2026. This policy explains how North Shore Nautical collects, uses, and protects information shared through this website."
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
                website, including service request details, contact information, requested
                timing, and any notes you choose to share.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                How Information Is Used
              </h2>
              <p className="mt-3">
                Submitted information is used to review inquiries, evaluate booking
                requests, communicate about scheduling, process payment authorization and
                approval workflows, and maintain a clear service record for operational follow-up.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Email Communications
              </h2>
              <p className="mt-3">
                When you submit an inquiry or booking request, an automated email may be
                sent to the email address you provide. North Shore Nautical may also use
                that address to follow up regarding scheduling, approvals, changes requested,
                or service clarifications.
              </p>
            </section>
            <section>
              <h2 className="font-display text-3xl font-semibold text-ink">
                Third-Party Services
              </h2>
              <p className="mt-3">
                This website uses third-party services necessary for hosting, secure
                payment processing, database operations, and email transmission. These
                providers may process limited information as required to operate the
                website and deliver communications.
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
