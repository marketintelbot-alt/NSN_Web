import assert from 'node:assert/strict'
import test from 'node:test'

import { SERVICE_AGREEMENT_POLICY_VERSION } from './serviceCatalog.js'
import { publicServiceRequestSchema } from './serviceRequestSchemas.js'

const agreementSchema = publicServiceRequestSchema.pick({
  agreementPolicyVersion: true,
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
