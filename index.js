import { createBluetooth } from 'node-ble'

async function NodeBleWrapper (uuid, onNotify) {
  let characteristics = []
  let destroy = noop

  async function init () {
    characteristics = []
    destroy = noop
    ;[characteristics, destroy] = await main(uuid, init)
    await subscribe(characteristics, onNotify)

    while (true) {
      await sleep(100)
    }
  }

  init()

  return {
    getCharacteristics: () => characteristics,
    shutdown: () => destroy()
  }
}

async function main (uuid, onDisconnect) {
  const { bluetooth, destroy } = createBluetooth()
  const adapter = await bluetooth.defaultAdapter()
  const isDiscovering = await adapter.isDiscovering()
  if (!isDiscovering) await adapter.startDiscovery()

  const device = await adapter.waitDevice(uuid)
  device.once('disconnect', () => {
    destroy()
    onDisconnect()
  })
  await connect(device)

  const gatt = await device.gatt()
  const services = await getServices(gatt)
  const characteristics = await Promise.all(services.map(getCharacteristics))
  return [characteristics.flat(), destroy]
}

async function connect (device) {
  // prevent adding mulitple connect-callbacks
  device.helper.removeAllListeners('PropertiesChanged')

  try {
    await device.connect()
  } catch (error) {
    if (error.type === 'org.bluez.Error.Failed') {
      if (error.text === 'Operation already in progress') {
        // 'Operation already in progress' = dbus busy
        await sleep(2000)
        return await connect(device)
      }
      if (error.text === 'le-connection-abort-by-local') {
        // 'le-connection-abort-by-local' = time out
        return await connect(device)
      }
    }

    throw error
  }
}

async function getServices (gatt) {
  const uuids = await gatt.services()
  return Promise.all(uuids.map(uuid => gatt.getPrimaryService(uuid)))
}

async function getCharacteristics (service) {
  const uuids = await service.characteristics()
  return Promise.all(uuids.map(uuid => service.getCharacteristic(uuid)))
}

async function subscribe (characteristics, onNotify) {
  characteristics.forEach(async characteristic => {
    const flags = await characteristic.getFlags()
    if (flags.includes('notify')) {
      characteristic.on('valuechanged', value => {
        onNotify(event(characteristic.helper.object, value))
      })
      await characteristic.startNotifications()
    }
  })
}

function event (source, value) {
  const timestamp = Date.now()
  return { timestamp, source, value }
}

async function sleep (ms) {
  return new Promise(_ => setTimeout(_, ms))
}

function noop () {}

export { NodeBleWrapper }
