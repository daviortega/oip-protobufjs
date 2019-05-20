import decodeDescriptor from './decodeDescriptor'
import { ProtoModules } from '../index'

const ANY = ProtoModules.google.protobuf.Any
const OipDetails = ProtoModules.oipProto.OipDetails

const googleApis = 'type.googleapis.com/'

/**
 * Create OipDetails Proto message
 * @param data
 * @param data.name - template name
 * @param data.payload - template object information (fields with assigned values)
 * @param data.descriptor - the file descriptor that defines the template being used for the payload
 * @returns {oipProto.OipDetails}
 */
export default function buildOipDetails (data) {
  if (!Array.isArray(data)) {
    data = [data]
  }

  let details = []

  for (let item of data) {
    const {
      name,
      payload,
      descriptor,
      type
    } = item
    if (!name || name === '') {
      throw Error(`Must provide defined name. Received: ${name}`)
    }
    if (!payload) {
      throw Error(`Must provide payload object to create message from`)
    }
    if (!type && !descriptor) {
      throw Error(`Must provide either a protobufjs Type or a descriptor`)
    }

    let TemplateType
    if (descriptor) {
      TemplateType = decodeDescriptor(descriptor)
    } else TemplateType = type

    let err = TemplateType.verify(payload)
    if (err) throw Error(`Failed payload verification for: ${name}`)

    let message = TemplateType.create(payload)
    let buffer = TemplateType.encode(message).finish()

    let anyPayload = {
      type_url: `${googleApis}${name}`,
      value: buffer
    }
    err = ANY.verify(anyPayload)
    if (err) throw Error(err)

    const anyMessage = ANY.create(anyPayload)

    details.push(anyMessage)
  }

  const OipDetailsPayload = { details }

  let err = OipDetails.verify(OipDetailsPayload)
  if (err) throw Error(`Failed to verify OipDetails payload`)

  return OipDetails.create({ details })
}