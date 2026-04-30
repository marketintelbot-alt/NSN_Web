import type { ServiceCatalogItem } from '../types/service'

export const serviceAgreementPolicyVersion = 'service-agreement-v1.1'
export const minimumBoatLengthFeet = 10
export const maximumBoatLengthFeet = 30

export function roundBoatLengthFeet(value: number) {
  return Math.ceil(value)
}

export function formatCurrency(amountCents: number | null) {
  if (typeof amountCents !== 'number') {
    return 'Pending review'
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(amountCents / 100)
}

export function calculateEstimateCents(service: ServiceCatalogItem | null, boatLengthFeet: number | null) {
  if (!service || typeof boatLengthFeet !== 'number' || !Number.isFinite(boatLengthFeet)) {
    return null
  }

  const roundedBoatLengthFeet = roundBoatLengthFeet(boatLengthFeet)

  if (service.pricingModel === 'per_foot') {
    const numericRate = Number(
      service.pricingLabel.replace('$', '').replace('/ft', '').replace(',', ''),
    )

    return Number.isFinite(numericRate) ? Math.round(numericRate * 100) * roundedBoatLengthFeet : null
  }

  if (service.pricingModel === 'flat') {
    const numericAmount = Number(service.pricingLabel.replace('$', '').replace(',', ''))
    return Number.isFinite(numericAmount) ? Math.round(numericAmount * 100) : null
  }

  return null
}

export function shouldRouteToInquiry(
  service: ServiceCatalogItem | null,
  boatLengthFeet: number | null,
  flags: {
    notSureWhatINeed: boolean
    heavyOxidation: boolean
    moldMildew: boolean
    severeStaining: boolean
    neglectedCondition: boolean
    unusualAccessIssue: boolean
    majorRestorationNeed: boolean
  },
) {
  if (!service || flags.notSureWhatINeed) {
    return true
  }

  if (service.quoteOnly || service.paymentType !== 'instant_checkout') {
    return true
  }

  if (
    flags.heavyOxidation ||
    flags.moldMildew ||
    flags.severeStaining ||
    flags.neglectedCondition ||
    flags.unusualAccessIssue ||
    flags.majorRestorationNeed
  ) {
    return true
  }

  if (typeof boatLengthFeet === 'number' && Number.isFinite(boatLengthFeet)) {
    const roundedBoatLengthFeet = roundBoatLengthFeet(boatLengthFeet)
    return roundedBoatLengthFeet > maximumBoatLengthFeet
  }

  return false
}
