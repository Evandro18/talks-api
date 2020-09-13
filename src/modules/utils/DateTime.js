export const setDateHours = (...args) => {
  const date = new Date()
  date.setHours(...args)
  date.toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" })
  return date
}

export const millisecondsToMinutes = (ms) => {
  return ms / 1000 / 60
}

export const completeZeros = (num) => {
  return num < 10 ? `0${num}` : num
}