# node-ble-wrapper

A helper lib for dealing with BLE devices on Linux. Using the excelent [node-ble](https://github.com/chrvadala/node-ble) library to interact with Bluetoth.

## Usage

Set up permission as described in [node-ble#provide-permissions](https://github.com/chrvadala/node-ble#provide-permissions).

```js
import NodeBleWrapper from 'node-ble-wrapper'
import { exit } from 'process'

async function main () {
  const { getCharacteristics, shutdown } = await NodeBleWrapper(
    '08:56:87:15:27:0B', // device uuid
    console.log // will log all notifications to console
  )

  let i = 0
  while (i < 30) {
    i++
    const characteristics = getCharacteristics()
    console.log(characteristics) // will log [] until connectected
    await sleep(1000)
  }

  shutdown() // close all dbus ble stuff
  exit()
}

main()
```
