import { useState, useCallback } from 'react';
import { appointmentService } from '../services/appointments';
import { useCircleStore } from '../stores/circleStore';
import { isDemoMode, DEMO_APPOINTMENTS } from '../utils/demoData';

export function useAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeCircleId } = useCircleStore();

  const fetchAppointments = useCallback(
    async (params?: { from?: string; to?: string; status?: string }) => {
      if (!activeCircleId) return;
      if (isDemoMode()) {
        setAppointments(DEMO_APPOINTMENTS);
        return;
      }
      setLoading(true);
      try {
        const data = await appointmentService.list(activeCircleId, params);
        setAppointments(data.appointments);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [activeCircleId]
  );

  const createAppointment = async (data: any) => {
    if (!activeCircleId) return;
    const result = await appointmentService.create(activeCircleId, data);
    await fetchAppointments();
    return result.appointment;
  };

  const deleteAppointment = async (apptId: string) => {
    if (!activeCircleId) return;
    await appointmentService.delete(activeCircleId, apptId);
    await fetchAppointments();
  };

  return { appointments, loading, fetchAppointments, createAppointment, deleteAppointment };
}
