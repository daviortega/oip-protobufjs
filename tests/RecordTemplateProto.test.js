/* eslint-env jest */
import { ECPair } from 'bitcoinjs-lib'
import { Networks } from '@daviortega/js-oip'
import { util as protoUtil } from 'protobufjs'
import { verify } from 'bitcoinjs-message'

import {
  ProtoModules,
  templateBuilder,
  buildRecordTemplate,
  signMessage,
  buildSignedMessage,
  buildOipFiveTemplate
} from '../src'
import buildDescriptor from '../src/builders/buildDescriptor'

const { floMainnet, floTestnet } = Networks

const network = {
  flo_mainnet: floMainnet.network,
  flo_testnet: floTestnet.network
}

const RecordTemplateProto = ProtoModules.oipProto.RecordTemplateProto
const SignedMessage = ProtoModules.oipProto.SignedMessage
const OipFiveProto = ProtoModules.oipProto.OipFive

const wif = 'cVeJgyPeQS2935MGpLWiPj28sowu2QxRx4vbdM5UinMwk151Epkq'
const p2pkh = 'oRpmeYvjgfhkSpPWGL8eP5ePupyop3hz9j'
const ecpair = ECPair.fromWIF(wif, network.flo_testnet)

describe('RecordTemplate', () => {
  it('build record template', () => {
    const friendlyName = 'Test Template'
    const description = 'description for test template'
    const fileDescriptor = Buffer.from([10, 79, 10, 27, 111, 105, 112, 53, 95, 114, 101, 99, 111, 114, 100, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 21, 111, 105, 112, 53, 46, 114, 101, 99, 111, 114, 100, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 116, 101, 115, 116, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51])

    let { templateBuffer, template64, templateMessage } = buildRecordTemplate({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor
    })

    let targetBuffer = new Uint8Array(129)
    expect(protoUtil.base64.decode(template64, targetBuffer, 0)).toEqual(templateBuffer.length)
    expect(targetBuffer.buffer).toEqual(templateBuffer.buffer)
    expect(protoUtil.base64.encode(targetBuffer, 0, targetBuffer.length)).toEqual(template64)

    let decodedMessageFromBuffer = RecordTemplateProto.decode(templateBuffer)
    expect(decodedMessageFromBuffer).toEqual(templateMessage)
    expect(decodedMessageFromBuffer.friendlyName).toEqual(friendlyName)
    expect(decodedMessageFromBuffer.description).toEqual(description)
    expect(decodedMessageFromBuffer.DescriptorSetProto).toEqual(fileDescriptor)
  })
  it('build OipFive proto message with record template', () => {
    const friendlyName = 'Test Template'
    const description = 'description for test template'
    const fileDescriptor = Buffer.from([10, 79, 10, 27, 111, 105, 112, 53, 95, 114, 101, 99, 111, 114, 100, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 21, 111, 105, 112, 53, 46, 114, 101, 99, 111, 114, 100, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 116, 101, 115, 116, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51])

    let { templateMessage } = buildRecordTemplate({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor
    })

    const { oip5messageBuffer, oip5message64, oip5message } = buildOipFiveTemplate({ recordTemplate: templateMessage })

    let targetBuffer = new Uint8Array(132)
    expect(protoUtil.base64.decode(oip5message64, targetBuffer, 0)).toEqual(oip5messageBuffer.length)
    expect(targetBuffer.buffer).toEqual(oip5messageBuffer.buffer)
    expect(protoUtil.base64.encode(targetBuffer, 0, targetBuffer.length)).toEqual(oip5message64)

    let decodedMessageFromBuffer = OipFiveProto.decode(oip5messageBuffer)
    expect(decodedMessageFromBuffer).toEqual(oip5message)
  })
  it('sign record template message', () => {
    const friendlyName = 'Test Template'
    const description = 'description for test template'
    const fileDescriptor = Buffer.from([10, 79, 10, 27, 111, 105, 112, 53, 95, 114, 101, 99, 111, 114, 100, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 21, 111, 105, 112, 53, 46, 114, 101, 99, 111, 114, 100, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 116, 101, 115, 116, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51])

    let { templateMessage } = buildRecordTemplate({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor
    })

    const { oip5message64 } = buildOipFiveTemplate({ recordTemplate: templateMessage })

    const { signature, p2pkh: pubKeyHash } = signMessage({ message: oip5message64, ECPair: ecpair })
    expect(pubKeyHash).toEqual(p2pkh)

    expect(verify(oip5message64, p2pkh, signature, ecpair.network.messagePrefix)).toBeTruthy()
  })
  it('build proto signed message', () => {
    const friendlyName = 'Test Template'
    const description = 'description for test template'
    const fileDescriptor = Buffer.from([10, 79, 10, 27, 111, 105, 112, 53, 95, 114, 101, 99, 111, 114, 100, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 21, 111, 105, 112, 53, 46, 114, 101, 99, 111, 114, 100, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 116, 101, 115, 116, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51])

    let { templateMessage, template64 } = buildRecordTemplate({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor
    })
    expect(template64).toEqual('Cg1UZXN0IFRlbXBsYXRlEh1kZXNjcmlwdGlvbiBmb3IgdGVzdCB0ZW1wbGF0ZSJRCk8KG29pcDVfcmVjb3JkX3RlbXBsYXRlcy5wcm90bxIVb2lwNS5yZWNvcmQudGVtcGxhdGVzIhEKAVASDAoEdGVzdBgBIAEoCWIGcHJvdG8z')

    const { oip5message64, oip5messageBuffer } = buildOipFiveTemplate({ recordTemplate: templateMessage })

    const { signature, publicKeyAscii } = signMessage({ message: oip5message64, ECPair: ecpair })
    expect(signature.toString('base64')).toEqual('IFQVuOC/3Ae91gHcG7E3BqLT10gaQj/lB4aXvOIYuuSyJ5UjdLK73Xf/0dzYgt8cuvRrwh7vI/nllB6YCwR5wKo=')

    const {
      signedMessage64,
      signedMessageBuffer
    } = buildSignedMessage({ Signature: signature, PubKey: publicKeyAscii, SerializedMessage: oip5messageBuffer })
    expect(signedMessage64).toEqual('CoQBCoEBCg1UZXN0IFRlbXBsYXRlEh1kZXNjcmlwdGlvbiBmb3IgdGVzdCB0ZW1wbGF0ZSJRCk8KG29pcDVfcmVjb3JkX3RlbXBsYXRlcy5wcm90bxIVb2lwNS5yZWNvcmQudGVtcGxhdGVzIhEKAVASDAoEdGVzdBgBIAEoCWIGcHJvdG8zEAEYASIib1JwbWVZdmpnZmhrU3BQV0dMOGVQNWVQdXB5b3AzaHo5aipBIFQVuOC/3Ae91gHcG7E3BqLT10gaQj/lB4aXvOIYuuSyJ5UjdLK73Xf/0dzYgt8cuvRrwh7vI/nllB6YCwR5wKo=')

    const byteSize = 242
    let rawSignedMessage = new Uint8Array(byteSize)
    let numOfBytesWritten = protoUtil.base64.decode(signedMessage64, rawSignedMessage, 0)
    expect(numOfBytesWritten).toEqual(byteSize)

    const decodedMessage = SignedMessage.decode(rawSignedMessage)
    expect(SignedMessage.encode(decodedMessage).finish()).toEqual(signedMessageBuffer)

    expect(decodedMessage.Signature.buffer).toEqual(signature.buffer)
    expect(decodedMessage.SerializedMessage.buffer).toEqual(oip5messageBuffer.buffer)
    expect(decodedMessage.MessageType).toEqual(1)
    expect(decodedMessage.SignatureType).toEqual(1)
    expect(decodedMessage.PubKey).toEqual(publicKeyAscii)
  })
  it('templateBuilder function', () => {
    const friendlyName = 'Test Template'
    const description = 'description for test template'
    const fileDescriptor = Buffer.from([10, 79, 10, 27, 111, 105, 112, 53, 95, 114, 101, 99, 111, 114, 100, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 21, 111, 105, 112, 53, 46, 114, 101, 99, 111, 114, 100, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 116, 101, 115, 116, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51])

    let { signedMessage64 } = templateBuilder({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor,
      wif,
      network: 'testnet'
    })

    expect(signedMessage64).toEqual('CoQBCoEBCg1UZXN0IFRlbXBsYXRlEh1kZXNjcmlwdGlvbiBmb3IgdGVzdCB0ZW1wbGF0ZSJRCk8KG29pcDVfcmVjb3JkX3RlbXBsYXRlcy5wcm90bxIVb2lwNS5yZWNvcmQudGVtcGxhdGVzIhEKAVASDAoEdGVzdBgBIAEoCWIGcHJvdG8zEAEYASIib1JwbWVZdmpnZmhrU3BQV0dMOGVQNWVQdXB5b3AzaHo5aipBIFQVuOC/3Ae91gHcG7E3BqLT10gaQj/lB4aXvOIYuuSyJ5UjdLK73Xf/0dzYgt8cuvRrwh7vI/nllB6YCwR5wKo=')
  })
  it.skip('build a template that extends another', () => {
    const friendlyName = '1x OIP Debug'
    const description = 'this template extends OIP Debug'
    const values = [
      { name: 'extraInfo', type: 'string' }
    ]
    const _extends = [3262498974715895300]
    const fileDescriptor = buildDescriptor(values)

    let { signedMessage64 } = templateBuilder({
      friendlyName,
      description,
      DescriptorSetProto: fileDescriptor,
      wif,
      network: 'testnet',
      _extends
    })
  })

})
