import { parse } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

export const serviceTimeZone = 'America/Chicago'
export const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const
export const noTransportLaunchLocation = 'Not needed' as const
const returnTimeStartHour = 8
const returnTimeEndHour = 22
const returnTimeIntervalMinutes = 30
export const preferredLaunchLocationOptions = [
  ...launchLocations,
  noTransportLaunchLocation,
] as const
export const reservationWindowMessage =
  'This request falls outside our 24-hour scheduling window. Please choose a later launch time or contact us directly for urgent inquiries.'

function buildSelectableTimeValues(startHour: number, endHour: number, intervalMinutes: number) {
  const values: string[] = []

  for (
    let minutes = startHour * 60;
    minutes <= endHour * 60;
    minutes += intervalMinutes
  ) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    values.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }

  return values
}

export const returnTimeOptions = buildSelectableTimeValues(
  returnTimeStartHour,
  returnTimeEndHour,
  returnTimeIntervalMinutes,
)

export function createLaunchDateTime(date: string, time: string) {
  const parsedDate = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date())
  return fromZonedTime(parsedDate, serviceTimeZone)
}

export function has24HourLeadTime(date: string, time: string, currentDate = new Date()) {
  const requestedLaunchDateTime = createLaunchDateTime(date, time)
  return requestedLaunchDateTime.getTime() - currentDate.getTime() >= 24 * 60 * 60 * 1000
}

export function formatReservationDateTime(date: string, time: string) {
  return formatInTimeZone(
    createLaunchDateTime(date, time),
    serviceTimeZone,
    "EEEE, MMMM d, yyyy 'at' h:mm a zzz",
  )
}

export function formatStoredDateTime(value: string) {
  return formatInTimeZone(new Date(value), serviceTimeZone, "EEEE, MMMM d, yyyy 'at' h:mm a zzz")
}

export function isValidReturnTime(value: string) {
  return returnTimeOptions.includes(value)
}

export function formatReturnTimeLabel(value: string) {
  return formatInTimeZone(createLaunchDateTime('2026-01-01', value), serviceTimeZone, 'h:mm a')
}
