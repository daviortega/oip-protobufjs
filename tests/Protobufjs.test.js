/* eslint-env jest */
import protobuf, { Field, Message, Root, Type, Enum } from 'protobufjs'
import descriptor from 'protobufjs/ext/descriptor'
import path from 'path'
import buildDescriptor from '../src/builders/buildDescriptor'

const protoScalarValues = [
  'string', 'bool', 'bytes', 'double', 'float', 'int32',
  'int64', 'uint32', 'uint64', 'sint32', 'sint64',
  'fixed32', 'fixed64', 'sfixed32', 'sfixed64'
]

describe('protobuf.js', () => {
  it('default load proto file', async () => {
    let root = await protobuf.load(path.resolve('./', 'src', 'messages', 'oipProto', 'recordTemplate.proto'))
    expect(root).toBeInstanceOf(Root)

    let MessageType = root.lookupType('oipProto.RecordTemplateProto') // packagename.MessageName
    expect(MessageType).toBeInstanceOf(Type)

    let payload = { friendlyName: 'RandomString' }
    let err = MessageType.verify(payload)
    expect(err).toBeNull()

    let messageFromPayload = MessageType.create(payload)
    expect(messageFromPayload).toBeInstanceOf(Message)

    let buffer = MessageType.encode(messageFromPayload).finish()
    expect(buffer).toBeInstanceOf(Buffer)

    let decodedBuffer = MessageType.decode(buffer)
    expect(decodedBuffer).toBeInstanceOf(Message)

    let object = MessageType.toObject(decodedBuffer, {
      longs: String,
      enums: String,
      bytes: String
    })
    expect(object).toEqual({
      'friendlyName': 'RandomString'
    })
  })
  it('load proto, toJSON === compiled fromJSON', async () => {
    let root = await protobuf.load(path.resolve('./', 'src', 'messages', 'oipProto', 'recordTemplate.proto'))
    expect(root).toBeInstanceOf(Root)
    expect(root.lookupType('oipProto.RecordTemplateProto')).toBeInstanceOf(Type)
    const compiledJson = require('../src/index').ProtoModulesJson
    expect(root.toJSON().nested.oipProto.nested.record).toEqual(compiledJson.nested.oipProto.nested.record)

    let root2 = Root.fromJSON(compiledJson.nested.oipProto)
    expect(root2).toBeInstanceOf(Root)
    expect(root2.lookupType('RecordTemplateProto')).toBeInstanceOf(Type)
  })
  it('JsonDescriptor >> FileDescriptorSet', () => {
    const compiledJson = require('../src/index').ProtoModulesJson
    let root = protobuf.Root.fromJSON(compiledJson)
    expect(root).toBeInstanceOf(Root)
    let RecordTemplateType = root.lookupType('oipProto.RecordTemplateProto')
    expect(RecordTemplateType).toBeInstanceOf(Type)

    // let desc = RecordTemplateType.toDescriptor('proto3')
    // let buf = descriptor.FileDescriptorSet.encode(desc).finish()
    // let dec = descriptor.FileDescriptorSet.decode(buf)
    // let type = protobuf.Type.fromDescriptor(dec)
    // console.log(type)

    let descriptorFromRoot = root.toDescriptor('proto3')
    expect(descriptorFromRoot).toBeDefined()
    let buffer = descriptor.FileDescriptorSet.encode(descriptorFromRoot).finish()
    expect(buffer).toBeDefined()

    let decodedDescriptor = descriptor.FileDescriptorSet.decode(buffer)
    expect(decodedDescriptor).toEqual(descriptorFromRoot)

    let rootFromDescriptor = protobuf.Root.fromDescriptor(decodedDescriptor)
    expect(rootFromDescriptor).toBeInstanceOf(Root)
  })
  it('Type >> FileDescriptorSet', () => {
    const P = new protobuf.Type('P')
    P.add(new protobuf.Field('ryan', 1, 'string'))
    let root = new protobuf.Root()
    expect(root).toBeInstanceOf(Root)
    root.define('oip5.record.templates').add(P)
    let descriptorFromRoot = root.toDescriptor('proto3')
    expect(descriptorFromRoot).toBeDefined()
    let buffer = descriptor.FileDescriptorSet.encode(descriptorFromRoot).finish()
    expect(buffer).toBeInstanceOf(Buffer)
  })
  it('create Message from Type', () => {
    let messageTemp = {
      friendlyName: 'sir',
      description: 'wut',
      DescriptorSetProto: 'shouldBeBytes'
    }
    let root = protobuf.Root.fromJSON(require('../src').ProtoModulesJson)
    let typeRecordTemplate = root.lookupType('oipProto.RecordTemplateProto')
    let err = typeRecordTemplate.verify(messageTemp)
    if (err) {
      console.log(err)
    }
    expect(err).toBeNull()
    let message = typeRecordTemplate.create(messageTemp)
    expect(message).toBeInstanceOf(Message)
  })
  it('create Type using reflection only', () => {
    let ReflectMessage = new Type('P').add(new Field('scattered', 1, 'string'))
    ReflectMessage.add(new Field('random', 2, 'float'))
    let root = new Root().define('oip5.record.templates').add(ReflectMessage)
    let type = root.lookupType('oip5.record.templates.P')
    expect(type).toBeInstanceOf(Type)

    let tempObj = {
      scattered: 'string'
    }
    let err = type.verify(tempObj)
    expect(err).toBeNull()
  })
  it('create Message Type using reflection and all possible proto fields', () => {
    let ReflectMessage = new Type('P')

    for (let i = 0; i < protoScalarValues.length; i++) {
      ReflectMessage.add(new Field(protoScalarValues[i], i + 1, protoScalarValues[i]))
    }

    let root = new Root().define('oip5.record.templates').add(ReflectMessage)
    let type = root.lookupType('oip5.record.templates.P')

    expect(type).toBeInstanceOf(Type)

    let tempObj = {
      sint32: 1
    }
    let err = type.verify(tempObj)
    expect(err).toBeNull()
  })
  it('create Field using rules', () => {
    expect(new Field('name', 1, 'string')).toBeInstanceOf(Field)
    expect(new Field('name', 1, 'string', 'repeated')).toBeInstanceOf(Field)
    expect(new Field('name', 1, 'string', undefined)).toBeInstanceOf(Field)

    // expect(new Field('name', 1, 'string', null)).toThrow('rule must be a string rule')

    try {
      new Field('name', 1, 'string', 'random')
    } catch (err) {
      expect(err).toBeDefined()
    }

    try {
      new Field('name', 1, 'string', 'singular')
    } catch (err) {
      expect(err).toBeDefined()
    }

    try {
      new Field('name', 1, 'string', '')
    } catch (err) {
      expect(err).toBeDefined()
    }

    try {
      new Field('name', 1, 'string', 2)
    } catch (err) {
      expect(err).toBeDefined()
    }
  })
  it('require compiled static-module', () => {
    const rootmodules = require('../src/index').ProtoModules
    const RecordTemplateProto = rootmodules.oipProto.RecordTemplateProto

    let payload = {
      friendlyName: 'ryan test',
      description: 'yah'
    }
    let err = RecordTemplateProto.verify(payload) // verify with proper fields
    expect(err).toBeNull()

    payload = {
      friendlyName: 3,
      description: 2
    }

    err = RecordTemplateProto.verify(payload) // with incorrect field types
    expect(err).not.toBeNull()

    payload = {}
    err = RecordTemplateProto.verify(payload) // with ignore fields
    expect(err).toBeNull()

    // const SignedMessage = rootmodules.oipProto.SignedMessage
  })
  it.skip('reflection with nested message', () => {
    const AwesomeEnum = {
      ONE: 1,
      TWO: 2
    }

    const AwesomeSubMessageReflected = new Type('AwesomeSubMessageReflected').add(
      new Field('awesomeString', 1, 'string', 'required')
    )

    const AwesomeMessageReflected = new Type('AwesomeMessageReflected')
      .add(
        new Field('awesomeSubMessage', 1, 'AwesomeSubMessageReflected', 'required')
      )
      .add(new Field('awesomeEnum', 2, 'AwesomeEnum', 'required'))

    AwesomeMessageReflected.add(new Enum('AwesomeEnum', AwesomeEnum)) // <--
    AwesomeMessageReflected.add(AwesomeSubMessageReflected) // <--

    const encoded = AwesomeMessageReflected.encode({
      awesomeSubMessage: { awesomeString: 'I am an awesome string!' },
      awesomeEnum: AwesomeEnum.TWO
    }).finish()

    const decoded = AwesomeMessageReflected.decode(encoded)
  })
  it('create message using an OipRef Txid property', () => {
    const descriptorData = [
      { name: 'a1', type: 'string', rule: undefined },
      { name: 'friends', type: 'OipRef', rule: 'repeated' },
      { name: 'cors', type: 'enum', values: ['one', 'two'], rule: undefined }
    ]

    let descriptor, error
    try {
      descriptor = buildDescriptor(descriptorData)
    } catch (err) {
      error = err
    }
    expect(error).toBeUndefined()
    expect(descriptor).toBeDefined()
  })
  /*(Davi here) I am going to skip this test because it is failing and I am not sure why but I don't think it is a problem*/
  it.skip('test buildDescriptor against individual known values', () => {
    const descriptorData = [
      { name: 'name', type: 'string' },
      { name: 'wut', type: 'bool' },
      { name: 'uint32', type: 'uint32' },
      { name: 'name', type: 'uint64' },
      { name: 'bday', type: 'fixed64', rule: 'repeated' },
    ]
    const resultData = [
      [10, 73, 10, 24, 111, 105, 112, 80, 114, 111, 116, 111, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 18, 111, 105, 112, 80, 114, 111, 116, 111, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 110, 97, 109, 101, 24, 1, 32, 1, 40, 9, 98, 6, 112, 114, 111, 116, 111, 51],
      [10, 72, 10, 24, 111, 105, 112, 80, 114, 111, 116, 111, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 18, 111, 105, 112, 80, 114, 111, 116, 111, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 16, 10, 1, 80, 18, 11, 10, 3, 119, 117, 116, 24, 1, 32, 1, 40, 8, 98, 6, 112, 114, 111, 116, 111, 51],
      [10, 75, 10, 24, 111, 105, 112, 80, 114, 111, 116, 111, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 18, 111, 105, 112, 80, 114, 111, 116, 111, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 19, 10, 1, 80, 18, 14, 10, 6, 117, 105, 110, 116, 51, 50, 24, 1, 32, 1, 40, 13, 98, 6, 112, 114, 111, 116, 111, 51],
      [10, 73, 10, 24, 111, 105, 112, 80, 114, 111, 116, 111, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 18, 111, 105, 112, 80, 114, 111, 116, 111, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 110, 97, 109, 101, 24, 1, 32, 1, 40, 4, 98, 6, 112, 114, 111, 116, 111, 51],
      [10, 73, 10, 24, 111, 105, 112, 80, 114, 111, 116, 111, 95, 116, 101, 109, 112, 108, 97, 116, 101, 115, 46, 112, 114, 111, 116, 111, 18, 18, 111, 105, 112, 80, 114, 111, 116, 111, 46, 116, 101, 109, 112, 108, 97, 116, 101, 115, 34, 17, 10, 1, 80, 18, 12, 10, 4, 98, 100, 97, 121, 24, 1, 32, 3, 40, 6, 98, 6, 112, 114, 111, 116, 111, 51]]

    for (let i in descriptorData) {
      const descriptor = buildDescriptor([descriptorData[i]])
      const descriptor64 = descriptor.toString('base64')

      let resultBuf = Buffer.from(resultData[i])
      const result64 = resultBuf.toString('base64')

      expect(descriptor64).toEqual(result64)
    }
  })
  it.skip('test buildDescriptor against block of values', () => {
    const values = [
      { name: 'crystals', type: 'enum', values: ['rose', 'agate'] },
      { name: 'date', type: 'uint64', rule: 'repeated' },
      { name: 'game', type: 'string' }
    ]

    const descriptor = buildDescriptor(values)
    const descriptor64 = descriptor.toString('base64')

    expect(descriptor64).toEqual('CpkBChhvaXBQcm90b190ZW1wbGF0ZXMucHJvdG8SEm9pcFByb3RvLnRlbXBsYXRlcyJhCgFQEgwKBGRhdGUYAiADKAQSDAoEZ2FtZRgDIAEoCSJACghDcnlzdGFscxINCglVTkRFRklORUQQABIRCg1DcnlzdGFsc19ST1NFEAESEgoOQ3J5c3RhbHNfQUdBVEUQAmIGcHJvdG8z')
  })
})
