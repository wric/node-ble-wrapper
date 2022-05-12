import { exit } from 'process'
import { NodeBleWrapper } from './index.js'

async function main () {
  let lastValue = null

  function onNotify (event) {
    // Example of a notify-callback. In this case my scale spams a
    // lot and I'm only intresssted in changes in weight.
    // event: { timestamp: int, source: string, value: any }
    if (event.value.toString() === lastValue) {
      return
    }

    lastValue = event.value.toString()
    console.log('>> new value!', event)
  }

  const { getCharacteristics, shutdown } = await NodeBleWrapper(
    '08:56:87:15:27:0B', // Your device UUID.
    onNotify
  )

  let i = 0
  while (i < 30) {
    const characteristics = getCharacteristics()
    // getCharacteristics() returns an array with all characteristicts.
    // See more: https://github.com/chrvadala/node-ble/blob/main/docs/api.md#GattCharacteristic
    // (you don't need to set up notifications if you use the onNotify callback above.)
    console.log(`>> got ${characteristics.length} characteristics`)
    await sleep(1000)
  }

  shutdown() // Destroy bluetooth.
  exit()
}

async function sleep (ms) {
  return new Promise(_ => setTimeout(_, ms))
}

main()
