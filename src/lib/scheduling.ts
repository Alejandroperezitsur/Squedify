import { parse, format, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';
import type { Appointment, WorkingHours, TimeSlot, DeadTimeBlock } from '@/types';

/**
 * Parse HH:mm string to Date object (using arbitrary date)
 */
function parseTime(timeStr: string): Date {
  return parse(timeStr, 'HH:mm', new Date());
}

/**
 * Generate all time slots for a day based on working hours and slot duration
 */
export function getAvailableSlots(
  date: string,
  workingHours: WorkingHours,
  slotDuration: number,
  appointments: Appointment[],
  serviceDuration: number
): TimeSlot[] {
  const dayStart = parseTime(workingHours.start);
  const dayEnd = parseTime(workingHours.end);
  const slots: TimeSlot[] = [];

  let current = dayStart;
  while (isBefore(current, dayEnd) || isEqual(current, dayEnd)) {
    const timeStr = format(current, 'HH:mm');
    const slotEnd = addMinutes(current, serviceDuration);

    // Check if slot fits within working hours
    const fitsDay = isBefore(slotEnd, dayEnd) || isEqual(slotEnd, dayEnd);

    // Check conflicts with existing appointments
    const conflicts = appointments.some((apt) => {
      if (apt.date !== date || apt.status === 'cancelled') return false;
      const aptStart = parseTime(apt.startTime);
      const aptEnd = parseTime(apt.endTime);

      // Overlap check: slot starts before apt ends AND slot ends after apt starts
      return (
        (isBefore(current, aptEnd) || isEqual(current, aptEnd)) &&
        (isBefore(aptStart, slotEnd) || isEqual(aptStart, slotEnd))
      );
    });

    slots.push({
      time: timeStr,
      available: fitsDay && !conflicts,
    });

    current = addMinutes(current, slotDuration);
  }

  return slots;
}

/**
 * Score slots to suggest best ones
 * - Penalize small gaps before/after
 * - Reward continuity (back-to-back appointments)
 */
export function suggestBestSlots(
  slots: TimeSlot[],
  appointments: Appointment[],
  date: string,
  serviceDuration: number,
  slotDuration: number = 15
): TimeSlot[] {
  const dayAppointments = appointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return slots.map((slot) => {
    if (!slot.available) return { ...slot, recommended: false, score: -1 };

    let score = 50; // base score

    const slotTime = parseTime(slot.time);
    const slotEnd = addMinutes(slotTime, serviceDuration);

    // Find gap before this slot
    const prevApt = dayAppointments
      .slice()
      .reverse()
      .find((apt) => {
        const aptEnd = parseTime(apt.endTime);
        return isBefore(aptEnd, slotTime) || isEqual(aptEnd, slotTime);
      });

    // Find gap after this slot
    const nextApt = dayAppointments.find((apt) => {
      const aptStart = parseTime(apt.startTime);
      return isAfter(aptStart, slotEnd) || isEqual(aptStart, slotEnd);
    });

    const gapBefore = prevApt
      ? (slotTime.getTime() - parseTime(prevApt.endTime).getTime()) / 60000
      : (slotTime.getTime() - parseTime(slots[0].time).getTime()) / 60000;

    const gapAfter = nextApt
      ? (parseTime(nextApt.startTime).getTime() - slotEnd.getTime()) / 60000
      : 0;

    // Penalize small dead-time gaps (10-30 min)
    if (gapBefore > 0 && gapBefore < serviceDuration) {
      score -= (serviceDuration - gapBefore) * 2; // penalty for creating small gap before
    }
    if (gapAfter > 0 && gapAfter < serviceDuration) {
      score -= (serviceDuration - gapAfter) * 2; // penalty for creating small gap after
    }

    // Reward back-to-back (continuity)
    if (gapBefore === 0 || gapBefore <= slotDuration) score += 30;
    if (gapAfter === 0 || gapAfter <= slotDuration) score += 30;

    // Slight preference for earlier slots to compact morning
    const hour = slotTime.getHours();
    if (hour >= 9 && hour <= 11) score += 5;

    return {
      ...slot,
      score: Math.round(score),
      recommended: score >= 70,
    };
  });
}

/**
 * Detect dead time blocks in a day
 */
export function detectDeadTime(
  date: string,
  workingHours: WorkingHours,
  appointments: Appointment[],
  minGap: number = 20
): DeadTimeBlock[] {
  const dayStart = parseTime(workingHours.start);
  const dayEnd = parseTime(workingHours.end);

  const dayAppointments = appointments
    .filter((a) => a.date === date && a.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const deadBlocks: DeadTimeBlock[] = [];

  // Check gap from day start to first appointment
  if (dayAppointments.length > 0) {
    const firstApt = dayAppointments[0];
    const firstStart = parseTime(firstApt.startTime);
    const gapStart = (firstStart.getTime() - dayStart.getTime()) / 60000;
    if (gapStart >= minGap) {
      deadBlocks.push({
        start: workingHours.start,
        end: firstApt.startTime,
        duration: gapStart,
      });
    }
  }

  // Check gaps between appointments
  for (let i = 0; i < dayAppointments.length - 1; i++) {
    const currentEnd = parseTime(dayAppointments[i].endTime);
    const nextStart = parseTime(dayAppointments[i + 1].startTime);
    const gap = (nextStart.getTime() - currentEnd.getTime()) / 60000;

    if (gap >= minGap) {
      deadBlocks.push({
        start: dayAppointments[i].endTime,
        end: dayAppointments[i + 1].startTime,
        duration: gap,
      });
    }
  }

  // Check gap from last appointment to day end
  if (dayAppointments.length > 0) {
    const lastApt = dayAppointments[dayAppointments.length - 1];
    const lastEnd = parseTime(lastApt.endTime);
    const gapEnd = (dayEnd.getTime() - lastEnd.getTime()) / 60000;
    if (gapEnd >= minGap) {
      deadBlocks.push({
        start: lastApt.endTime,
        end: workingHours.end,
        duration: gapEnd,
      });
    }
  }

  // If no appointments, entire day is dead (but we don't report it as such)
  return deadBlocks;
}

/**
 * Check if an appointment overlaps with existing ones
 */
export function hasOverlap(
  newApt: { date: string; startTime: string; endTime: string },
  existing: Appointment[],
  excludeId?: string
): boolean {
  const newStart = parseTime(newApt.startTime);
  const newEnd = parseTime(newApt.endTime);

  return existing.some((apt) => {
    if (apt.id === excludeId) return false;
    if (apt.date !== newApt.date || apt.status === 'cancelled') return false;

    const aptStart = parseTime(apt.startTime);
    const aptEnd = parseTime(apt.endTime);

    return (
      (isBefore(newStart, aptEnd) || isEqual(newStart, aptEnd)) &&
      (isBefore(aptStart, newEnd) || isEqual(aptStart, newEnd))
    );
  });
}

/**
 * Calculate day metrics
 */
export function calculateDayMetrics(
  date: string,
  workingHours: WorkingHours,
  appointments: Appointment[]
): {
  totalSlots: number;
  occupiedSlots: number;
  deadTimeMinutes: number;
  occupancyRate: number;
  totalAppointments: number;
} {
  const dayStart = parseTime(workingHours.start);
  const dayEnd = parseTime(workingHours.end);
  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;

  const dayAppointments = appointments.filter(
    (a) => a.date === date && a.status !== 'cancelled'
  );

  const occupiedMinutes = dayAppointments.reduce((sum, apt) => {
    const start = parseTime(apt.startTime);
    const end = parseTime(apt.endTime);
    return sum + (end.getTime() - start.getTime()) / 60000;
  }, 0);

  const deadBlocks = detectDeadTime(date, workingHours, appointments, 10);
  const deadTimeMinutes = deadBlocks.reduce((sum, b) => sum + b.duration, 0);

  return {
    totalSlots: Math.floor(totalMinutes / 15),
    occupiedSlots: Math.floor(occupiedMinutes / 15),
    deadTimeMinutes,
    occupancyRate: totalMinutes > 0 ? Math.round((occupiedMinutes / totalMinutes) * 100) : 0,
    totalAppointments: dayAppointments.length,
  };
}
