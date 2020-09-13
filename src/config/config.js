const setDateHours = (...args) => {
  const date = new Date()
  date.setHours(...args)
  date.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' })
  return date
}

export const config = {
  morning: { start: setDateHours(9, 0, 0), end: setDateHours(12, 0, 0) },
  afternoon: { start: setDateHours(13, 0, 0), end: setDateHours(16, 59, 59) },
}
