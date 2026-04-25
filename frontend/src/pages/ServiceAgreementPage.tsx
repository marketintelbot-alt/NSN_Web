import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'

const agreementSections = [
  {
    title: '1. Scope of Services',
    body:
      'North Shore Nautical provides marine detailing, cleaning, upkeep support, and advisory services only. North Shore Nautical does not provide boat transportation, towing, launching, retrieval, trailering, vessel operation, captain services, or moving services.',
  },
  {
    title: '2. Pricing and Boat Length',
    body:
      'For per-foot services, pricing is calculated based on boat length provided by the client. Boat length may be rounded up to the nearest whole foot. If boat length is entered incorrectly, North Shore Nautical may adjust or decline the request before approval.',
  },
  {
    title: '3. Payment Authorization and Approval',
    body:
      'Payment method may be authorized at checkout. Payment is not captured until North Shore Nautical reviews and approves the appointment request. Checkout does not guarantee appointment approval.',
  },
  {
    title: '4. Cancellations, Date Modifications, and Refunds',
    body:
      'Clients may cancel or modify their appointment date up to 48 hours before the scheduled service time. If a client cancels 48 hours or more before the scheduled service time, North Shore Nautical will issue a refund for the amount paid, excluding any non-refundable processing fees if applicable. If a client requests to modify the service date 48 hours or more before the scheduled service time, North Shore Nautical will make reasonable efforts to accommodate the requested change based on availability. Cancellations made less than 48 hours before the scheduled service time are non-refundable. Date modification requests made less than 48 hours before the scheduled service time are not guaranteed and may be treated as a late cancellation if North Shore Nautical cannot reasonably accommodate the change. If the client fails to provide access to the boat, provides incorrect location information, is unavailable when access is required, or otherwise prevents North Shore Nautical from completing the scheduled service, the appointment may be treated as a late cancellation and no refund will be issued. Weather-related or operational rescheduling initiated by North Shore Nautical does not qualify as a client cancellation. In those cases, North Shore Nautical will work with the client to reschedule the service at the next reasonable available time. Refunds are not available after service has started or been completed. If a client believes there is a legitimate workmanship issue, the client must notify North Shore Nautical in writing within 24 hours of service completion and provide clear photos of the issue. If North Shore Nautical determines that the issue relates to workmanship within the agreed service scope, the client’s sole remedy will be corrective work, touch-up service, service credit, or another non-cash accommodation determined by North Shore Nautical.',
  },
  {
    title: '5. Access Responsibility',
    body:
      'The client is responsible for ensuring North Shore Nautical has safe, lawful, and reasonable access to the vessel at the scheduled service location. If access is unavailable, restricted, unsafe, or materially different than described, the appointment may be rescheduled, modified, or treated as a late cancellation.',
  },
  {
    title: '6. Boat Condition Disclaimer',
    body:
      'North Shore Nautical does not guarantee full removal of stains, oxidation, mold, mildew, scratches, discoloration, odors, sun damage, or pre-existing wear. Results depend on the vessel’s age, materials, prior maintenance, and condition.',
  },
  {
    title: '7. Pre-Existing Damage',
    body:
      'Client acknowledges that boats may have pre-existing wear, fading, cracking, corrosion, loose hardware, weak stitching, brittle vinyl, oxidized gelcoat, or other age-related issues. North Shore Nautical is not responsible for pre-existing damage or defects revealed during cleaning.',
  },
  {
    title: '8. Weather and Operational Delays',
    body:
      'Marine detailing may be affected by weather, temperature, wind, rain, marina access, or other operational conditions. North Shore Nautical may reschedule service when conditions prevent safe or effective work.',
  },
  {
    title: '9. Advisory Limitations',
    body:
      'Advisory services are general owner support, upkeep planning, purchasing guidance, and referral guidance. North Shore Nautical does not provide legal, financial, surveyor, mechanical certification, captain, transport, or vessel operation services.',
  },
]

export function ServiceAgreementPage() {
  return (
    <>
      <Seo
        title="Service Agreement"
        description="Review the North Shore Nautical service agreement, cancellation policy, refund policy, and advisory limitations."
        path="/service-agreement"
      />
      <PageHero
        eyebrow="Service Agreement"
        title="Service terms for marine care, scheduling, approval, cancellations, and advisory support."
        description="Policy version service-agreement-v1.0. Effective April 23, 2026."
      />

      <section className="section-pad">
        <article className="container panel max-w-4xl px-8 py-10 md:px-12 md:py-14">
          <div className="grid gap-8 text-base leading-8 text-slate">
            {agreementSections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-3xl font-semibold text-ink">{section.title}</h2>
                <p className="mt-3">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}
