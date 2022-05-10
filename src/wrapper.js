import { createBluetooth } from 'node-ble'
import { exit } from 'process'
import { log, noop, sleep } from './utils.js'

async function nodeBleWrapper (uuid, onNotify = noop, connectionAttempts = 0) {
  let characteristics = []

  async function fn (firstRun = false) {
    log(firstRun ? 'starting' : 'restarting')
    characteristics = []
    characteristics = await main(uuid, fn, onNotify, connectionAttempts)
    while (true) {
      await sleep(100)
    }
  }

  try {
    fn(true)
  } catch (error) {
    log('error!')
    console.error(error)
    exit(1)
  }

  return { getCharacteristics: () => characteristics }
}

async function main (uuid, onDisconnect, onNotify, connectionAttempts) {
  const { bluetooth, destroy } = createBluetooth()

  const adapter = await bluetooth.defaultAdapter()
  if (!(await adapter.isDiscovering())) await adapter.startDiscovery()
  const device = await adapter.waitDevice(uuid)

  device.on('disconnect', () => {
    destroy()
    onDisconnect()
  })

  await connectDevice(device, 0, connectionAttempts)
  const gatt = await device.gatt()
  const services = await getServices(gatt)
  const rawCharacteristics = await Promise.all(services.map(getCharacteristics))

  const characteristics = await Promise.all(
    rawCharacteristics.flat().map(mapCharacteristic)
  )

  characteristics
    .filter(characteristic => characteristic.flags.includes('notify'))
    .forEach(async characteristic => {
      await characteristic.startNotifications()
      characteristic.on('valuechanged', value =>
        onNotify({ characteristic: characteristic.uuid, value })
      )
    })

  return characteristics
}

async function connectDevice (device, attempts = 0, maxAttempts = 0) {
  attempts += 1

  log(`connecting [${attempts}/${maxAttempts}]`)

  // Hacky...
  // node-ble adds a callback for each time device.connect()
  // is called, which leads to 'ERR_STREAM_WRITE_AFTER_END'.
  // To avoid we clear all listeners on each connection attempt.
  device.helper.removeAllListeners('PropertiesChanged')

  try {
    await device.connect()
    log('connected')
  } catch (error) {
    if (
      error.type === 'org.bluez.Error.Failed' &&
      error.text === 'Operation already in progress'
    ) {
      log('dbus is buys - backing of 5 s')
      await sleep(5000)
      return await connectDevice(device, attempts, maxAttempts)
    }

    if (error.text === 'le-connection-abort-by-local') {
      // 'le-connection-abort-by-local' is a timeout error thrown by dbus.
      // In that schenario we just want to retry until eventually our
      // maxAttemps are reached.
      if (maxAttempts > 0 && attempts === maxAttempts) {
        log(`max connection attempts reached [${attempts}/${maxAttempts}]`)
        exit(0)
      }

      return await connectDevice(device, attempts, maxAttempts)
    }

    // Any other error is considered un-expected and we re-throw it.
    throw error
  }
}

async function getCharacteristics (service) {
  const uuids = await service.characteristics()
  return Promise.all(uuids.map(uuid => service.getCharacteristic(uuid)))
}

async function mapCharacteristic (characteristic) {
  const [flags, uuid] = await Promise.all([
    characteristic.getFlags(),
    characteristic.getUUID()
  ])
  characteristic.flags = flags
  characteristic.uuid = uuid
  return characteristic
}

async function getServices (gatt) {
  const uuids = await gatt.services()
  return Promise.all(uuids.map(uuid => gatt.getPrimaryService(uuid)))
}

export { nodeBleWrapper }
