async function readCharacteristic (characteristics, uuid, offset = 0) {
  // https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattCharacteristic+readValue
  const characteristic = characteristics.find(c => c.uuid === uuid)
  if (!characteristic) return null
  return characteristic.readValue(offset)
}

async function writeCharacteristic (
  characteristics,
  uuid,
  value,
  optionsOrOffset = {}
) {
  // https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattCharacteristic+writeValue
  const characteristic = characteristics.find(c => c.uuid === uuid)
  if (!characteristic) return false
  await characteristic.writeValue(value, optionsOrOffset)
  return true
}

function getOverview (characteristics) {
  return characteristics.map(characteristic => characteristic.helper.object)
}

export { getOverview, readCharacteristic, writeCharacteristic }
