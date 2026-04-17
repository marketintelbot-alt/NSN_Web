import { parse } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

export const serviceTimeZone = 'America/Chicago'
export const launchLocations = ['Lloyd Boat Launch', 'Evanston Boat Launch'] as const
export const noTransportLaunchLocation = 'Not needed' as const
export const preferredLaunchLocationOptions = [
  ...launchLocations,
  noTransportLaunchLocation,
] as const
export const reservationWindowMessage =
  'This request falls outside our 24-hour scheduling window. Please choose a later launch time or contact us directly for urgent inquiries.'

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
