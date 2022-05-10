# node-ble-wrapper

A helper lib for dealing with BLE devices on Linux. Using the excelent [node-ble](https://github.com/chrvadala/node-ble) library to interact with Bluetoth.

## Usage

Set up permission as described in [node-ble#provide-permissions](https://github.com/chrvadala/node-ble#provide-permissions).

```js
import nodeBleWrapper from 'node-ble-wrapper'

async function main () {
  const { getCharacteristics } = await nodeBleWrapper(
    '08:56:87:15:27:0B', // device uuid
    console.log, // will log all notifies to console
    10 // will try to connect 10 times before exiting (defualt = 0 = infinit)
  )

  while (true) {
    const characteristics = getCharacteristics()
    console.log(characteristics) // will log [] until connectected
    await sleep(1000)
  }
}

main()

```
