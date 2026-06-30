import assert from 'node:assert/strict'
import test from 'node:test'

import {
  maximumBoatLengthFeet,
  SERVICE_AGREEMENT_POLICY_VERSION,
} from './serviceCatalog.js'
import { publicServiceRequestSchema } from './serviceRequestSchemas.js'

const agreementSchema = publicServiceRequestSchema.pick({
  agreementPolicyVersion: true,
})
const boatLengthSchema = publicServiceRequestSchema.pick({
  boatLengthFeet: true,
})
const submissionIntentSchema = publicServiceRequestSchema.pick({
  submissionIntent: true,
})

test('the server accepts only the current service agreement version', () => {
  assert.equal(
    agreementSchema.parse({
      agreementPolicyVersion: SERVICE_AGREEMENT_POLICY_VERSION,
    }).agreementPolicyVersion,
    SERVICE_AGREEMENT_POLICY_VERSION,
  )

  assert.throws(
    () =>
      agreementSchema.parse({
        agreementPolicyVersion: 'service-agreement-v0',
      }),
    /service agreement has changed/i,
  )
})

test('the server accepts public boat lengths up to the configured maximum', () => {
  assert.equal(
    boatLengthSchema.parse({
      boatLengthFeet: maximumBoatLengthFeet,
    }).boatLengthFeet,
    maximumBoatLengthFeet,
  )

  assert.throws(
    () =>
      boatLengthSchema.parse({
        boatLengthFeet: maximumBoatLengthFeet + 1,
      }),
    new RegExp(`Boat length must be ${maximumBoatLengthFeet} feet or fewer`, 'i'),
  )
})

test('the server normalizes stale checkout intents to inquiry', () => {
  assert.equal(
    submissionIntentSchema.parse({
      submissionIntent: 'checkout',
    }).submissionIntent,
    'inquiry',
  )
})
