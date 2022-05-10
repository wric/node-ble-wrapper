import { exit } from 'process'
import { getOverview } from './src/helpers.js'
import { nodeBleWrapper } from './src/wrapper.js'
import { sleep } from './src/utils.js'

async function main () {
  const { getCharacteristics } = await nodeBleWrapper(
    '08:56:87:15:27:0B',
    console.log
  )

  let count = 0
  while (count < 30000) {
    console.log('getCharacteristics', getOverview(getCharacteristics()))
    await sleep(1000)
    count++
  }

  exit()
}

main()
