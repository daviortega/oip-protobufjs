import { Enum, util } from 'protobufjs'
import decodeDescriptor from '../src/builders/decodeDescriptor'
import buildDescriptor from '../src/builders/buildDescriptor'
import buildTxids from '../src/builders/buildTxids'
import buildOipDetails from '../src/builders/buildOipDetails'
import templateBuilder from '../src/builders/templateBuilder'
import { ProtoModules } from '../src'

const SignedMessage = ProtoModules.oipProto.SignedMessage
const OipFiveProto = ProtoModules.oipProto.OipFive
const ANY = ProtoModules.google.protobuf.Any


describe('Test builder/helper functions', () => {
  describe('descriptor', () => {
    it('build and deconstruct descriptor', () => {
      const names = ['name', 'age', 'occupation', 'crystals', 'hobbies', 'friends', 'familyMembers']
      const values = [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'uint32' },
        { name: 'occupation', type: 'string' },
        { name: 'crystals', type: 'enum', values: ['agate', 'rose'] },
        { name: 'hobbies', type: 'enum', values: ['mtg', 'ableton'] },
        { name: 'friends', type: 'OipRef', rule: 'repeated' },
        { name: 'familyMembers', type: 'OipRef', rule: 'repeated' }
      ]
      const fileDescriptor = buildDescriptor(values)

      const TemplateType = decodeDescriptor(fileDescriptor).type

      const nestedArray = TemplateType.nestedArray
      for (let field of nestedArray) {
        if (field.name !== 'Txid') {
          expect(field instanceof Enum)
          expect(names.includes(field.name))
        }
      }
      const fieldArray = TemplateType.fieldsArray
      for (let field of fieldArray) {
        expect(names.includes(field.name)).toBeTruthy()
      }
    })
    it('decode descriptor for web', () => {
      const values = [
        { name: 'name', type: 'string' },
        { name: 'age', type: 'uint32' },
        { name: 'occupation', type: 'string' },
        { name: 'crystals', type: 'enum', values: ['agate', 'rose'] },
        { name: 'hobbies', type: 'enum', values: ['mtg', 'ableton'] },
        { name: 'friends', type: 'OipRef', rule: 'repeated' },
        { name: 'familyMembers', type: 'OipRef', rule: 'repeated' }
      ]
      const fileDescriptor = buildDescriptor(values)
      const { webFmt } = decodeDescriptor(fileDescriptor, true)
      expect(webFmt).toEqual({
        fields: {
          name: {
            extend: undefined,
            type: 'string',
            id: 1,
            repeated: false,
          },
          age: {
            extend: undefined,
            id: 2,
            type: 'uint32',
            repeated: false,
          },
          occupation: {
            extend: undefined,
            id: 3,
            type: 'string',
            repeated: false
          },
          friends: {
            extend: undefined,
            id: 6,
            type: 'OipRef',
            repeated: true
          },
          familyMembers: {
            extend: undefined,
            id: 7,
            type: 'OipRef',
            repeated: true
          }
        },
        enums: {
          Crystals: {
            rule: undefined,
            values: {
              Crystals_AGATE: 1,
              Crystals_ROSE: 2,
              Crystals_UNDEFINED: 0
            }
          },
          Hobbies: {
            rule: undefined,
            values: { 'Hobbies_MTG': 1, 'Hobbies_ABLETON': 2,  Hobbies_UNDEFINED: 0 }
          }
        }
      })
    })
    it('test build descriptor against invalid variable names', () => {
      const one = { name: 'family-members', type: 'OipRef', rule: 'repeated' }
      try {
        buildDescriptor(one)
      } catch (err) {
        expect(err.message).toEqual('invalid field name: family-members. Must start with a letter and only contain letters/numbers.')
      }
      const two = { name: 'hobbies', type: 'enum', values: ['mtg', '09A'] }
      try {
        buildDescriptor(two)
      } catch (err) {
        expect(err.message).toEqual('invalid enum value: 09A for enum field: hobbies. Must start with a letter and only contain letters/numbers.')
      }
      const three = { name: 'crystals', type: 'enum', values: ['_mtg', 's09A'] }
      try {
        buildDescriptor(three)
      } catch (err) {
        expect(err.message).toEqual('invalid enum value: _mtg for enum field: crystals. Must start with a letter and only contain letters/numbers.')
      }
      const four = { name: '0family-members', type: 'OipRef', rule: 'repeated' }
      try {
        buildDescriptor(four)
      } catch (err) {
        expect(err.message).toEqual('invalid field name: 0family-members. Must start with a letter and only contain letters/numbers.')
      }
    })
    it('buildDescriptor against backend builder', () => {
      const descriptorValues = [
        { name: 'mass', type: 'int64', index: 1 },
        { name: 'name', type: 'string', index: 2 },
        { name: 'moons', type: 'OipRef', rule: 'repeated', index: 3 }
      ]

      const planetDescriptor = buildDescriptor(descriptorValues)
      console.log(planetDescriptor.toString('base64'))
      // let type = decodeDescriptor(planetDescriptor).type
      // // console.log(type.parent)

      const templateData = {
        friendlyName: 'Planet',
        description: 'A celestial body moving in an elliptical orbit around a star',
        DescriptorSetProto: planetDescriptor,
        wif: 'cRVa9rNx5N1YKBw8PhavegJPFCiYCfC4n8cYmdc3X1Y6TyFZGG4B',
        network: 'testnet'
      }

      const {
        signedMessage,
        signedMessageBuffer,
        signedMessage64
      } = templateBuilder(templateData)
      console.log(signedMessage64)
    })
    it('decode descriptor with message Txid for a field', () => {
      const descriptor = 'CnkKCnR4aWQucHJvdG8SCG9pcFByb3RvIhgKBFR4aWQSEAoDcmF3GAEgASgMUgNyYXdCCloIb2lwUHJvdG9KMwoFEgMAAAAKCAoBDBIDAAAACggKAQISAwAAAAoJCgIEABIDAAAACgsKBAQAAgASAwAAAGIGcHJvdG8zCscBCgdwLnByb3RvEhJvaXBQcm90by50ZW1wbGF0ZXMaCnR4aWQucHJvdG8iTQoBUBIQCgRtYXNzGAEoA1IEbWFzcxIQCgRuYW1lGAIoCVIEbmFtZRIkCgVtb29ucxgDIAMoCzIOLm9pcFByb3RvLlR4aWRSBW1vb25zSk0KBRIDAAAACggKAQwSAwAAAAoICgECEgMAAAAKCQoCBAASAwAAAAoLCgQEAAIAEgMAAAAKCwoEBAACARIDAAAACgsKBAQAAgISAwAAAA=='
      const type = decodeDescriptor(descriptor).type
      const fieldsArray = type.fieldsArray
      let tmpObj = {}
      for (let fa of fieldsArray) {
        tmpObj[fa.name] = fa.type
      }
      expect(tmpObj).toEqual({
        name: 'string',
        mass: 'int64',
        moons: 'Txid'
      })
    })
    it.skip('build descriptor with correct package name', () => {
      // toDo: add expects
      let values = [
        {name: 'name', type: 'string'},
        {name: 'favoriteSport', type: 'string'}
      ]

      const descriptor = buildDescriptor(values)
      console.log(descriptor.toString('base64'))
      const TemplateType = decodeDescriptor(descriptor).type
      // console.log(TemplateType)
    })
  })
  describe('recordTemplateBuilder', () => {
    it.skip('build record template', () => {
      // toDo: add expects
      let values = [
        {name: 'name', type: 'string'},
        {name: 'favoriteSport', type: 'string'},
        {name: 'favoriteFruit', type: 'string'}
      ]

      const descriptor = buildDescriptor(values)
      let template = templateBuilder({
        friendlyName: 'casualGuy',
        DescriptorSetProto: descriptor,
        description: 'nothing but a casual guy',
        wif: 'cVeJgyPeQS2935MGpLWiPj28sowu2QxRx4vbdM5UinMwk151Epkq',
        network: 'testnet'
      })
      console.log(template.signedMessage64)
    })
  })
  describe('Txid', () => {
    it('build Txid', () => {
      let txids = [
        '169e1e83e930853391bc6f35f605c6754cfead57cf8387639d3b4096c54f18f4',
        'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16'
      ]
      let txidMessages = buildTxids(txids)
      for (let txid of txidMessages) {
        let raw = txid.raw
        expect(txids.includes(raw.toString()))
      }
    })
  })
  describe('OipDetails', () => {
    it('build OipDetails with invalid types expect throw', () => {
      const descriptor = 'CnkKCnR4aWQucHJvdG8SCG9pcFByb3RvIhgKBFR4aWQSEAoDcmF3GAEgASgMUgNyYXdCCloIb2lwUHJvdG9KMwoFEgMAAAAKCAoBDBIDAAAACggKAQISAwAAAAoJCgIEABIDAAAACgsKBAQAAgASAwAAAGIGcHJvdG8zCscBCgdwLnByb3RvEhJvaXBQcm90by50ZW1wbGF0ZXMaCnR4aWQucHJvdG8iTQoBUBIQCgRtYXNzGAEoA1IEbWFzcxIQCgRuYW1lGAIoCVIEbmFtZRIkCgVtb29ucxgDIAMoCzIOLm9pcFByb3RvLlR4aWRSBW1vb25zSk0KBRIDAAAACggKAQwSAwAAAAoICgECEgMAAAAKCQoCBAASAwAAAAoLCgQEAAIAEgMAAAAKCwoEBAACARIDAAAACgsKBAQAAgISAwAAAA=='
      const name = 'tmpl_370840EECB3C27CA'
      let detailsData = {
        name, descriptor, payload: {
          mass: 'string',
        }
      }
      let details
      try {
        details = buildOipDetails(detailsData)
      } catch (err) {
        expect(err).toBeDefined()
      }
      expect(details).toBeUndefined()
      detailsData = {
        name, descriptor, payload: {
          name: 64
        }
      }
      try {
        details = buildOipDetails(detailsData)
      } catch (err) {
        expect(err).toBeDefined()
      }
      expect(details).toBeUndefined()
      detailsData = {
        name, descriptor, payload: {
          moons: ['not a txid']
        }
      }
      try {
        details = buildOipDetails(detailsData)
      } catch (err) {
        expect(err).toBeDefined()
      }
      expect(details).toBeUndefined()
    })
    it('build OipDetails convert repeated fields', () => {
      const file_descriptor_set = 'CkAKB3AucHJvdG8iLQoBUBITCgtzdXBlclBvd2VycxgBIAMoCRITCgtsb3ZlQWZmYWlycxgCIAMoCWIGcHJvdG8z'
      const name = 'tmpl_2F29D8C0'
      const detailsData = {
        descriptor: file_descriptor_set,
        name,
        payload: {
          loveAffairs: ['ScarJo', 'Emma Watson'],
          superPowers: 'awesomeness' // this should be an array but now the builder will convert
        }
      }
      let details
      try {
        details = buildOipDetails(detailsData)
      } catch (err) {
        expect(err).toBeUndefined()
      }
      expect(details).toBeDefined()
    })
    it('test type_url during build', () => {
      const detailsData1 = {
        descriptor: 'CkAKB3AucHJvdG8iLQoBUBITCgtzdXBlclBvd2VycxgBIAMoCRITCgtsb3ZlQWZmYWlycxgCIAMoCWIGcHJvdG8z',
        name: 'tmpl_2F29D8C0',
        payload: {
          superPowers: ['fly', 'invis'],
          loveAffairs: ['ScarJo', 'EmmaWatson']
        }
      }
      const detailsData2 = {
        descriptor: 'CmcKGG9pcFByb3RvX3RlbXBsYXRlcy5wcm90bxISb2lwUHJvdG8udGVtcGxhdGVzIi8KAVASDAoEbmFtZRgBIAEoCRIMCgRzb2lsGAIgASgJEg4KBmNvbG9ycxgDIAMoCWIGcHJvdG8z',
        name: 'tmpl_5D8DB85B',
        payload: {
          name: 'rylo',
          soil: 'earth',
          colors: ['blue', 'yellow', 'red', 'pink']
        }
      }
      let any
      try {
        any = buildOipDetails([detailsData1, detailsData2], true)
      } catch (err) {
        expect(err).toBeUndefined()
      }
      for (let n of any) {
        let type_url = n.type_url
        expect(type_url.startsWith('type.googleapis.com/oipProto.templates.tmpl_')).toBeTruthy()
      }
    })
  })
  describe('SignedMessage', () => {
    it('decode signed message', () => {
      let message = 'p64:CpcBEpQBOpEBCkMKNHR5cGUuZ29vZ2xlYXBpcy5jb20vb2lwUHJvdG8udGVtcGxhdGVzLnRtcGxfMkYyOUQ4QzASCwoDZmx5EgRlbW1hCkoKNHR5cGUuZ29vZ2xlYXBpcy5jb20vb2lwUHJvdG8udGVtcGxhdGVzLnRtcGxfNUQ4REI4NUISEgoEcnlsbxIFZWFydGgaA3JlZBABGAEiIm9ScG1lWXZqZ2Zoa1NwUFdHTDhlUDVlUHVweW9wM2h6OWoqQR8cQQI9PEBYKuv15qK4aJ1BDg+pdLnuFSRMlNKtUg1zSRv3QTPefPerz8MVTqd5o77mIh4klLFuMzeEt5j/uUiz'
      const trimPrefix = message => {
        let mes = message.split(':')
        return mes[1]
      }
      message = trimPrefix(message)
      let decodeArray = new Uint8Array()
      const len = util.base64.decode(message, decodeArray, 0)
      decodeArray = new Uint8Array(len)
      util.base64.decode(message, decodeArray, 0)
      const decodedSignedMessage = SignedMessage.decode(decodeArray)
      const SerializedMessage = decodedSignedMessage.SerializedMessage
      const decodedSerializedMessage = OipFiveProto.decode(SerializedMessage)
      const record = decodedSerializedMessage.record
      let details = record.details
      details = details.details
      for (let detail of details) {
        expect(detail instanceof ANY)
        expect(detail.type_url.startsWith('type.googleapis.com/oipProto.templates.tmpl_')).toBeTruthy()
        console.log(typeof detail.value === 'object')
      }
    })
  })
})