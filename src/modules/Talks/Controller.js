import { Request, Response } from 'express'
import { shuffleArray } from '../utils/Shuffle'
import { millisecondsToMinutes, completeZeros } from '../utils/DateTime'
import { config } from '../../config/config'
import httpStatus from 'http-status'

const period = () => ({ total: 0, talks: [] })
const trail = () => ({ morning: period(), afternoon: period() })

class Period {
  constructor(total = 0, talks = []) {
    this.total = total
    this.talks = talks
  }
}

class Trail {
  /**
   * 
   * @param {Period} morning 
   * @param {Period} afternoon 
   */
  constructor(morning = new Period(), afternoon = new Period()) {
    this.morning = morning
    this.afternoon = afternoon
  }
}

class Talk {
  constructor(name = '', time = 0) {
    this.name = name
    this.time = time
  }
}

class TalksController {

  constructor(happyHourTime) {
    this.happyHourTime = happyHourTime
  }

  /**
   * @param {Request} req 
   * @param {Response} res 
   */
  ordenation(req, res) {
    const data = req.body
    try {
      const talks = shuffleArray(this.formatTalks(data)) || []
      const totalTimeTalks = talks.reduce((acc, talk) => {
        acc += talk.time
        return acc
      }, 0)

      const firstSectionLimit = millisecondsToMinutes(config.morning.end - config.morning.start)
      const secondSectionLimit = millisecondsToMinutes(config.afternoon.end - config.afternoon.start)
      const totalTrails = Math.ceil(totalTimeTalks / (firstSectionLimit + secondSectionLimit))
      const trails = [...new Array(totalTrails)].map(_ => new Trail())
      const populatedTrails = this.populateTrails(trails)
      const trailsTalksWithTime = this.populateTimeTalks(populatedTrails)
      const finalTalks = this.revalidateHappyHour(trailsTalksWithTime)
      res.status(httpStatus.Ok).json(finalTalks)
    } catch (error) {

    }
  }

  /**
   * @param {[string]} talks 
   * @returns {[Talk]}
   */
  formatTalks(talks) {
    return talks.map(talk => {
      const { name, time } = talk.match(/(?<name>.*[^\d{2}min|lightning])(?<time>\d{2}min|lightning)/).groups
      const formattedTime = time.match('lightning') ? 5 : Number(time.replace(/min/gi, ''))
      return new Talk(name, formattedTime)
    })
  }
  /**
   * @param {[Trail]} trails
   * @param {[Talks]} talks
   * @param {number} firstSectionLimit
   * @param {number} secondSectionLimit
   * @returns {[Trail]}
   */
  populateTrails(trails, talks, firstSectionLimit, secondSectionLimit) {
    const populatedTrails = trails.map(({ morning, afternoon }) => {
      const toInsertAfter = []
      while (morning.total < firstSectionLimit && talks.length) {
        const leftover = Math.abs(firstSectionLimit - morning.total)
        let { talk, index } = talks.reduce((acc, item, index) => {
          if (item.time <= leftover && item.time > acc.time) {
            return { talk: item, index }
          }
          return acc
        }, { talk: talks[talks.length - 1], index: talks.length - 1 })
        talks.splice(index, 1)
        if ((morning.total + talk.time) <= firstSectionLimit) {
          morning.total += talk.time
          morning.talks.push(talk)
        } else toInsertAfter.push(talk)
      }

      talks.push(...toInsertAfter)
      toInsertAfter.splice(0, toInsertAfter.length)
      while (afternoon.total < secondSectionLimit && talks.length) {
        const leftover = Math.abs(secondSectionLimit - afternoon.total)
        let { talk, index } = talks.reduce((acc, item, index) => {
          if (item.time <= leftover && item.time > acc.time) {
            return { talk: item, index }
          }
          return acc
        }, { talk: talks[talks.length - 1], index: talks.length - 1 })
        talks.splice(index, 1)

        if ((afternoon.total + talk.time) <= secondSectionLimit) {
          afternoon.total += talk.time
          afternoon.talks.push(talk)
        } else toInsertAfter.push(talk)
      }
      talks.push(...toInsertAfter)
      toInsertAfter.splice(0, toInsertAfter.length)

      return new Trail(morning, afternoon)
    })
  }

  /**
   * @param {Date} start 
   * @param {Date} end 
   * @param {[Talk]} talks 
   */
  calculateStartTalkTime(start = new Date(), end = new Date(), talks) {
    const counterTime = new Date(start)
    return talks.reduce((acc, talk) => {
      counterTime.toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" })
      const hour = new Date(counterTime)
      counterTime.setMinutes(hour.getMinutes() + talk.time)
      const formattedHour = `${completeZeros(hour.getHours())}:${completeZeros(hour.getMinutes())}`
      acc.push(`${formattedHour} ${talk.name}`)
      return acc
    }, [])
  }

  /**
   * @param {[Trail]} trails 
   * @returns {[Trail]}
   */
  populateTimeTalks(trails) {
    return trails.reduce((acc, trails, i) => {
      const { morning, afternoon } = trails
      const data = [...this.calculateStartTime(config.morning.start, config.morning.end, morning.talks), ...this.calculateStartTime(config.afternoon.start, config.afternoon.end, afternoon.talks)]
      const lastItem = afternoon.talks[afternoon.talks.length - 1]
      const lastTime = data[data.length - 1].match(/\d{2}:\d{2}/)[0]
      if (!this.happyHourTime || lastTime > this.happyHourTime) {
        const [hour, minute] = lastTime.split(':')
        const dateTime = setDateHours(Number(hour), Number(minute) + lastItem.time)
        this.happyHourTime = `${completeZeros(dateTime.getHours())}:${completeZeros(dateTime.getMinutes())}`
      }
      data.push(`${this.happyHourTime} Networking Event`)
      acc.push({
        title: `Track ${i + 1}`,
        data
      })
      return acc
    }, [])
  }

  /**
   * 
   * @param {[Trail]} talks 
   * @returns {[Trail]}
   */
  revalidateHappyHour(trails) {
    return trails.map(el => {
      const lastItem = el.data[el.data.length - 1]
      const time = lastItem.match(/\d{2}:\d{2}/)[0]
      if (time !== happyHourTime) {
        lastItem.replace(/\d{2}:\d{2}/, happyHourTime)
      }
      el.data[el.data.length - 1] = lastItem
      return el
    })
  }

}

export const talksController = new TalksController()