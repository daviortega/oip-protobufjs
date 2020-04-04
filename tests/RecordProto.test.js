import buildDescriptor from '../src/builders/buildDescriptor'
import recordProtoBuilder from '../src/builders/recordProtoBuilder'
import buildOipDetails from '../src/builders/buildOipDetails'
import templateBuilder from '../src/builders/templateBuilder'
import decodeDescriptor from '../src/builders/decodeDescriptor'

const wif = 'cVeJgyPeQS2935MGpLWiPj28sowu2QxRx4vbdM5UinMwk151Epkq'

describe('RecordProto', () => {
  it('create record', () => {
    // create a fileDescriptor
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

    // create message from file descriptor
    const payload = {
      name: 'ryan',
      age: 23,
      occupation: 'dev',
      crystals: 2,
      hobbies: 2,
      friends: [Buffer.from('b2c12a7c8dc4dd82abe49ff28351c163ed3dc71a9ec1d5f8dd8d38d8b9f99a04')],
      familyMembers: [Buffer.from('b2f12a7c8dc4dd82abe49ff28351c163ed3dc71a9ec1d5f8dd8d38d8b9f99a04')]
    }

    const details = buildOipDetails([{ payload, name: 'mockName', descriptor: fileDescriptor }])

    const { signedMessage64 } = recordProtoBuilder({
      details,
      wif,
      network: 'testnet'
    })
  })
  it('create record from existing template', () => {
    const descriptor = 'ClEKG29pcDVfcmVjb3JkX3RlbXBsYXRlcy5wcm90bxIVb2lwNS5yZWNvcmQudGVtcGxhdGVzIhMKAVASDgoGcG93ZXJzGAEgAygJYgZwcm90bzM='
    const name = 'tmpl_8D66C6AFF9BDD8EE'
    const payload = { powers: ['flight', 'music making', 'love'] }

    const details = buildOipDetails({ descriptor, name, payload })
    const { signedMessage64 } = recordProtoBuilder({ details, wif, network: 'testnet' })

  })
  it('create a record from luna template', () => {
    const pubkey = 'ofbB67gqjgaYi45u8Qk2U3hGoCmyZcgbN4'
    const wif = 'cRVa9rNx5N1YKBw8PhavegJPFCiYCfC4n8cYmdc3X1Y6TyFZGG4B'

    const descriptor = 'CogBCgdwLnByb3RvEhJvaXBQcm90by50ZW1wbGF0ZXMiJwoBUBIQCgRtYXNzGAEoA1IEbWFzcxIQCgRuYW1lGAIoCVIEbmFtZUpACgUSAwAAAAoICgEMEgMAAAAKCAoBAhIDAAAACgkKAgQAEgMAAAAKCwoEBAACABIDAAAACgsKBAQAAgESAwAAAA=='
    const name = 'tmpl_370840EECB3C27CA'
    const payload = {
      name: 'Ryan Moon',
      mass: 33
    }
    // const details = buildOipDetails({descriptor, name, payload})
    const record = recordProtoBuilder({
      detailsData: {descriptor, name, payload},
      wif,
      network: 'testnet',
    })
  })
})



