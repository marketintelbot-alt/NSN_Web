export type ServiceRequestTransitionState = {
  requestKind: 'booking' | 'inquiry'
  bookingStatus:
    | 'draft'
    | 'pending_review'
    | 'changes_requested'
    | 'confirmed'
    | 'completed'
    | 'canceled'
    | 'declined'
    | 'refunded'
    | 'failed_payment'
  paymentStatus:
    | 'not_started'
    | 'authorized'
    | 'captured'
    | 'canceled'
    | 'refunded'
    | 'failed'
}

export type ServiceRequestAvailableActions = {
  approveCapture: boolean
  requestChanges: boolean
  decline: boolean
  cancel: boolean
  complete: boolean
  createPaymentLink: boolean
}

const reviewableBookingStatuses = new Set([
  'draft',
  'pending_review',
  'changes_requested',
  'failed_payment',
])
const editablePaymentStatuses = new Set(['not_started', 'failed', 'canceled'])
const terminalBookingStatuses = new Set(['completed', 'canceled', 'declined', 'refunded'])

export function getServiceRequestAvailableActions(
  state: ServiceRequestTransitionState,
): ServiceRequestAvailableActions {
  const isReviewable = reviewableBookingStatuses.has(state.bookingStatus)
  const hasEditablePayment = editablePaymentStatuses.has(state.paymentStatus)

  return {
    approveCapture:
      state.requestKind === 'booking' &&
      state.bookingStatus === 'pending_review' &&
      state.paymentStatus === 'authorized',
    requestChanges: isReviewable && hasEditablePayment,
    decline:
      isReviewable &&
      (hasEditablePayment || state.paymentStatus === 'authorized'),
    cancel:
      state.requestKind === 'booking' &&
      !terminalBookingStatuses.has(state.bookingStatus) &&
      state.paymentStatus !== 'refunded',
    complete:
      state.requestKind === 'booking' &&
      state.bookingStatus === 'confirmed' &&
      state.paymentStatus === 'captured',
    createPaymentLink: isReviewable && hasEditablePayment,
  }
}

export function assertServiceRequestActionAllowed(
  state: ServiceRequestTransitionState,
  action: keyof ServiceRequestAvailableActions,
) {
  if (getServiceRequestAvailableActions(state)[action]) {
    return
  }

  const messages: Record<keyof ServiceRequestAvailableActions, string> = {
    approveCapture: 'Only authorized requests pending review can be approved and captured.',
    requestChanges:
      'Changes can only be requested before a payment authorization or capture is active.',
    decline: 'This request can no longer be declined.',
    cancel: 'This booking can no longer be canceled.',
    complete: 'Only confirmed bookings with captured payment can be marked completed.',
    createPaymentLink: 'This request can no longer be accepted for payment.',
  }

  throw new Error(messages[action])
}
