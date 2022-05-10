function log (message) {
  const time = new Date().toLocaleString('sv').split(' ')[1]
  console.log(`${time} >> ${message}`)
}

function noop () {}

function notify (uuid) {
  return value => {
    log(`${uuid}: ${value}`)
  }
}

async function sleep (ms) {
  return new Promise(_ => setTimeout(_, ms))
}

export { log, noop, notify, sleep }
