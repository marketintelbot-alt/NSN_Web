import type { ServiceCatalogItem } from '../types/service'

export const serviceAgreementPolicyVersion = 'service-agreement-v1.1'
export const minimumBoatLengthFeet = 10
export const publishedEstimateMaximumBoatLengthFeet = 40
export const maximumBoatLengthFeet = 70

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

export function formatStartingAtCurrency(amountCents: number | null) {
  const formattedAmount = formatCurrency(amountCents)

  return formattedAmount === 'Pending review' ? formattedAmount : `Starting at ${formattedAmount}`
}

function parseCurrencyAmount(label: string) {
  const match = label.match(/\$([\d,]+(?:\.\d+)?)/)

  if (!match) {
    return null
  }

  const parsed = Number(match[1].replace(',', ''))

  return Number.isFinite(parsed) ? parsed : null
}

export function calculateEstimateCents(service: ServiceCatalogItem | null, boatLengthFeet: number | null) {
  if (!service) {
    return null
  }

  if (service.pricingModel === 'flat') {
    const numericAmount = parseCurrencyAmount(service.pricingLabel)
    return typeof numericAmount === 'number' && Number.isFinite(numericAmount)
      ? Math.round(numericAmount * 100)
      : null
  }

  if (
    service.pricingModel === 'per_foot' &&
    typeof boatLengthFeet === 'number' &&
    Number.isFinite(boatLengthFeet)
  ) {
    const numericRate = parseCurrencyAmount(service.pricingLabel)
    const roundedBoatLengthFeet = roundBoatLengthFeet(boatLengthFeet)

    return typeof numericRate === 'number' && Number.isFinite(numericRate)
      ? Math.round(numericRate * 100) * roundedBoatLengthFeet
      : null
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

  if (service.quoteOnly) {
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
    return roundedBoatLengthFeet > publishedEstimateMaximumBoatLengthFeet
  }

  return false
}
