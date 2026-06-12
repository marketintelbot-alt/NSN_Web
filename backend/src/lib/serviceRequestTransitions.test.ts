import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertServiceRequestActionAllowed,
  getServiceRequestAvailableActions,
  type ServiceRequestTransitionState,
} from './serviceRequestTransitions.js'

function state(
  overrides: Partial<ServiceRequestTransitionState> = {},
): ServiceRequestTransitionState {
  return {
    requestKind: 'booking',
    bookingStatus: 'pending_review',
    paymentStatus: 'not_started',
    ...overrides,
  }
}

test('captured bookings cannot be declined or moved back to changes requested', () => {
  const actions = getServiceRequestAvailableActions(
    state({ bookingStatus: 'confirmed', paymentStatus: 'captured' }),
  )

  assert.equal(actions.decline, false)
  assert.equal(actions.requestChanges, false)
  assert.equal(actions.cancel, true)
  assert.equal(actions.complete, true)
})

test('authorized bookings can only be approved, declined, or canceled', () => {
  const actions = getServiceRequestAvailableActions(
    state({ paymentStatus: 'authorized' }),
  )

  assert.deepEqual(actions, {
    approveCapture: true,
    requestChanges: false,
    decline: true,
    cancel: true,
    complete: false,
    createPaymentLink: false,
  })
})

test('completed, declined, canceled, and refunded requests expose no actions', () => {
  for (const bookingStatus of ['completed', 'declined', 'canceled', 'refunded'] as const) {
    const actions = getServiceRequestAvailableActions(
      state({
        bookingStatus,
        paymentStatus: bookingStatus === 'refunded' ? 'refunded' : 'captured',
      }),
    )

    assert.deepEqual(actions, {
      approveCapture: false,
      requestChanges: false,
      decline: false,
      cancel: false,
      complete: false,
      createPaymentLink: false,
    })
  }
})

test('inquiries can be revised, declined, or converted to a payment link', () => {
  const actions = getServiceRequestAvailableActions(
    state({ requestKind: 'inquiry' }),
  )

  assert.equal(actions.requestChanges, true)
  assert.equal(actions.decline, true)
  assert.equal(actions.createPaymentLink, true)
  assert.equal(actions.cancel, false)
})

test('server assertions reject unsafe direct API transitions', () => {
  assert.throws(
    () =>
      assertServiceRequestActionAllowed(
        state({ bookingStatus: 'confirmed', paymentStatus: 'captured' }),
        'decline',
      ),
    /can no longer be declined/,
  )

  assert.throws(
    () =>
      assertServiceRequestActionAllowed(
        state({ bookingStatus: 'draft', paymentStatus: 'not_started' }),
        'complete',
      ),
    /confirmed bookings with captured payment/,
  )
})
