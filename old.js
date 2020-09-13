const fs = require('fs')

const file = fs.readFileSync('./data.json', 'utf-8')
const read = JSON.parse(file)
const data = read.data
const formatTalks = (talks) => {
  return talks.map((talk) => {
    const { name, time } = talk.match(/(?<name>.*[^\d{2}min|lightning])(?<time>\d{2}min|lightning)/).groups
    const formattedTime = time.match('lightning') ? 5 : Number(time.replace(/min/gi, ''))
    return { name, time: formattedTime }
  })
}
const setDateHours = (...args) => {
  const date = new Date()
  date.setHours(...args)
  date.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' })
  return date
}

const millisecondsToMinutes = (ms) => {
  return ms / 1000 / 60
}

function shuffleArray(from) {
  const array = Array.from(from)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const talks = shuffleArray(formatTalks(data)) || []
const totalTimeTalks = talks.reduce((acc, talk) => {
  acc += talk.time
  return acc
}, 0)

const config = {
  morning: { start: setDateHours(09, 0, 0), end: setDateHours(12, 0, 0) },
  afternoon: { start: setDateHours(13, 0, 0), end: setDateHours(16, 59, 59) },
}
const firstSectionLimit = millisecondsToMinutes(config.morning.end - config.morning.start)
const secondSectionLimit = millisecondsToMinutes(config.afternoon.end - config.afternoon.start)
const totalTrails = Math.ceil(totalTimeTalks / (firstSectionLimit + secondSectionLimit))

const period = () => ({ total: 0, talks: [] })
const trail = () => ({ morning: period(), afternoon: period() })
const trails = [...new Array(totalTrails)].map((_) => trail())
const populatedTrails = trails.map(({ morning, afternoon }) => {
  const toInsertAfter = []
  while (morning.total < firstSectionLimit && talks.length) {
    const leftover = Math.abs(firstSectionLimit - morning.total)
    let { talk, index } = talks.reduce(
      (acc, item, index) => {
        if (item.time <= leftover && item.time > acc.time) {
          return { talk: item, index }
        }
        return acc
      },
      { talk: talks[talks.length - 1], index: talks.length - 1 }
    )
    talks.splice(index, 1)
    if (morning.total + talk.time <= firstSectionLimit) {
      morning.total += talk.time
      morning.talks.push(talk)
    } else toInsertAfter.push(talk)
  }

  talks.push(...toInsertAfter)
  toInsertAfter.splice(0, toInsertAfter.length)
  while (afternoon.total < secondSectionLimit && talks.length) {
    const leftover = Math.abs(secondSectionLimit - afternoon.total)
    let { talk, index } = talks.reduce(
      (acc, item, index) => {
        if (item.time <= leftover && item.time > acc.time) {
          return { talk: item, index }
        }
        return acc
      },
      { talk: talks[talks.length - 1], index: talks.length - 1 }
    )
    talks.splice(index, 1)

    if (afternoon.total + talk.time <= secondSectionLimit) {
      afternoon.total += talk.time
      afternoon.talks.push(talk)
    } else toInsertAfter.push(talk)
  }
  talks.push(...toInsertAfter)
  toInsertAfter.splice(0, toInsertAfter.length)
  return { morning, afternoon }
})

const completeZeros = (num) => {
  return num < 10 ? `0${num}` : num
}

const calculateStartTime = (start = new Date(), end = new Date(), talks) => {
  const counterTime = new Date(start)
  return talks.reduce((acc, talk) => {
    counterTime.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' })
    const hour = new Date(counterTime)
    counterTime.setMinutes(hour.getMinutes() + talk.time)
    const formattedHour = `${completeZeros(hour.getHours())}:${completeZeros(hour.getMinutes())}`
    acc.push(`${formattedHour} ${talk.name}`)
    return acc
  }, [])
}

let happyHourTime = null
const talksList = populatedTrails.reduce((acc, trails, i) => {
  const { morning, afternoon } = trails
  const data = [
    ...calculateStartTime(config.morning.start, config.morning.end, morning.talks),
    ...calculateStartTime(config.afternoon.start, config.afternoon.end, afternoon.talks),
  ]
  const lastItem = afternoon.talks[afternoon.talks.length - 1]
  const lastTime = data[data.length - 1].match(/\d{2}:\d{2}/)[0]
  if (!happyHourTime || lastTime > happyHourTime) {
    const [hour, minute] = lastTime.split(':')
    const dateTime = setDateHours(Number(hour), Number(minute) + lastItem.time)
    happyHourTime = `${completeZeros(dateTime.getHours())}:${completeZeros(dateTime.getMinutes())}`
  }
  data.push(`${happyHourTime} Networking Event`)
  acc.push({
    title: `Track ${i + 1}`,
    data,
  })
  return acc
}, [])

talksList.forEach((el) => {
  const lastItem = el.data[el.data.length - 1]
  const time = lastItem.match(/\d{2}:\d{2}/)[0]
  if (time !== happyHourTime) {
    lastItem.replace(/\d{2}:\d{2}/, happyHourTime)
  }
  el.data[el.data.length - 1] = lastItem
})

// console.log('talksList', talksList)
fs.writeFileSync('talks_result.json', JSON.stringify(talksList), { encoding: 'utf-8' })
