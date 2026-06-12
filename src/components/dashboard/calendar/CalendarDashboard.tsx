"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Trash2,
  Check,
  X,
  AlertCircle,
  ArrowRightLeft,
  Settings,
  Shield,
  Send,
} from "lucide-react";
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  getAvailabilities,
  saveAvailabilities,
  getSellers,
  transferCalendar,
  getTransfers,
  deleteTransfer,
  getProspects,
} from "@/app/actions/calendar";
import { getUnits } from "@/app/actions/units";
import config from "@/config/config";

interface CalendarDashboardProps {
  currentUserId: string;
  currentUserRole: string;
}

export default function CalendarDashboard({
  currentUserId,
  currentUserRole,
}: CalendarDashboardProps) {
  const isUserAdmin = currentUserRole === "SUPER_ADMIN" || currentUserRole === "ADMIN";

  const [activeTab, setActiveTab] = useState<"calendar" | "availability" | "transfers">("calendar");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "3days" | "day">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Data States
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [sellersList, setSellersList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [prospectsList, setProspectsList] = useState<any[]>([]);
  const [availabilitiesList, setAvailabilitiesList] = useState<any[]>([]);
  const [transfersList, setTransfersList] = useState<any[]>([]);
  
  // Filtering & Selection
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>("ALL");
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  
  // Modals & Forms
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("09:00");
  
  const [isPending, startTransition] = useTransition();

  // Booking Form State
  const [prospectSelectionType, setProspectSelectionType] = useState<"existing" | "new">("new");
  const [selectedProspectId, setSelectedProspectId] = useState<string>("");
  const [formProspectName, setFormProspectName] = useState("");
  const [formProspectEmail, setFormProspectEmail] = useState("");
  const [formProspectPhone, setFormProspectPhone] = useState("");
  const [formProspectAddress, setFormProspectAddress] = useState("");
  const [formUnitsOfInterest, setFormUnitsOfInterest] = useState<string[]>([]);
  const [formMeetingType, setFormMeetingType] = useState<"VIRTUAL" | "IN_PERSON">("VIRTUAL");
  const [formSellerId, setFormSellerId] = useState<string>("");
  const [formNotes, setFormNotes] = useState("");
  const [formSendEmail, setFormSendEmail] = useState(true);
  
  // Availability Form State
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [availSlotDuration, setAvailSlotDuration] = useState<number>(30);

  // Transfer Form State
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferType, setTransferType] = useState<"TEMPORARY" | "DEFINITIVE">("TEMPORARY");
  const [transferStartDate, setTransferStartDate] = useState("");
  const [transferEndDate, setTransferEndDate] = useState("");

  // Load Data
  const loadData = async () => {
    startTransition(async () => {
      try {
        const apps = await getAppointments(selectedSellerFilter);
        setAppointmentsList(apps);

        const sellers = await getSellers();
        setSellersList(sellers);

        const unitsData = await getUnits();
        setUnitsList(unitsData.filter((u: any) => u.state !== "COMMON_AREA"));

        const prospectsData = await getProspects();
        setProspectsList(prospectsData);

        const avails = await getAvailabilities(isUserAdmin && selectedSellerFilter !== "ALL" ? selectedSellerFilter : currentUserId);
        setAvailabilitiesList(avails);

        // Map database availabilities to edit slots
        setAvailSlots(
          avails.map((av) => ({
            dayOfWeek: av.dayOfWeek,
            startTime: av.startTime,
            endTime: av.endTime,
            meetingType: av.meetingType,
            slotDuration: av.slotDuration,
          }))
        );
        if (avails.length > 0) {
          setAvailSlotDuration(avails[0].slotDuration);
        }

        if (isUserAdmin) {
          const transfers = await getTransfers();
          setTransfersList(transfers);
        }
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    });
  };

  useEffect(() => {
    loadData();
  }, [selectedSellerFilter]);

  // Handle Prospect Select Change
  useEffect(() => {
    if (prospectSelectionType === "existing" && selectedProspectId) {
      const selectedP = prospectsList.find((p) => p.id === selectedProspectId);
      if (selectedP) {
        setFormProspectName(selectedP.name);
        setFormProspectEmail(selectedP.email);
        setFormProspectPhone(selectedP.phone || "");
        setFormProspectAddress(selectedP.address || "");
      }
    } else if (prospectSelectionType === "new") {
      setSelectedProspectId("");
      setFormProspectName("");
      setFormProspectEmail("");
      setFormProspectPhone("");
      setFormProspectAddress("");
    }
  }, [prospectSelectionType, selectedProspectId]);

  // Helper date manipulators
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sun=0, Mon=1...
    // Adjust Mon=0, Tue=1... Sun=6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    return { days, firstDayIndex: adjustedFirstDay };
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (calendarView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (calendarView === "3days") {
      newDate.setDate(newDate.getDate() - 3);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarView === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (calendarView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (calendarView === "3days") {
      newDate.setDate(newDate.getDate() + 3);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Availability handlers
  const addAvailabilitySlot = (dayOfWeek: number) => {
    setAvailSlots((prev) => [
      ...prev,
      {
        dayOfWeek,
        startTime: "09:00",
        endTime: "13:00",
        meetingType: "BOTH",
        slotDuration: availSlotDuration,
      },
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, key: string, value: any) => {
    setAvailSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [key]: value } : slot))
    );
  };

  const handleSaveAvailability = async () => {
    startTransition(async () => {
      try {
        const slotsWithDuration = availSlots.map((slot) => ({
          ...slot,
          slotDuration: availSlotDuration,
        }));
        const targetUserId = isUserAdmin && selectedSellerFilter !== "ALL" ? selectedSellerFilter : currentUserId;
        await saveAvailabilities(targetUserId, slotsWithDuration);
        alert("Disponibilidad guardada correctamente.");
        loadData();
      } catch (error: any) {
        alert("Error al guardar disponibilidad: " + error.message);
      }
    });
  };

  // Transfer handlers
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId) {
      alert("Por favor selecciona los vendedores de origen y destino.");
      return;
    }
    if (transferFromId === transferToId) {
      alert("El vendedor de origen y destino no pueden ser el mismo.");
      return;
    }
    if (transferType === "TEMPORARY" && (!transferStartDate || !transferEndDate)) {
      alert("Por favor selecciona el rango de fechas para el traspaso temporal.");
      return;
    }

    startTransition(async () => {
      try {
        await transferCalendar({
          fromSellerId: transferFromId,
          toSellerId: transferToId,
          isDefinitive: transferType === "DEFINITIVE",
          startDate: transferType === "TEMPORARY" ? new Date(transferStartDate) : new Date(),
          endDate: transferType === "TEMPORARY" ? new Date(transferEndDate) : new Date(),
        });
        alert("Traspaso configurado con éxito.");
        setTransferFromId("");
        setTransferToId("");
        setTransferStartDate("");
        setTransferEndDate("");
        loadData();
      } catch (error: any) {
        alert("Error al configurar el traspaso: " + error.message);
      }
    });
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm("¿Estás seguro de revocar este traspaso temporal?")) return;
    startTransition(async () => {
      try {
        await deleteTransfer(id);
        alert("Traspaso revocado con éxito.");
        loadData();
      } catch (error: any) {
        alert("Error al revocar el traspaso: " + error.message);
      }
    });
  };

  // Appointment scheduling submit
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProspectName || !formProspectEmail) {
      alert("Nombre y Correo electrónico son obligatorios.");
      return;
    }

    const [hours, minutes] = bookingTime.split(":");
    const finalDate = new Date(bookingDate);
    finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    startTransition(async () => {
      try {
        await createAppointment({
          sellerId: isUserAdmin ? (formSellerId || undefined) : currentUserId,
          date: finalDate,
          type: formMeetingType,
          prospectName: formProspectName,
          prospectEmail: formProspectEmail,
          prospectPhone: formProspectPhone || undefined,
          prospectAddress: formProspectAddress || undefined,
          unitsOfInterest: formUnitsOfInterest,
          notes: formNotes || undefined,
          sendEmail: formSendEmail,
        });
        alert("Cita agendada correctamente.");
        setIsBookingModalOpen(false);
        // Reset Form
        setFormProspectName("");
        setFormProspectEmail("");
        setFormProspectPhone("");
        setFormProspectAddress("");
        setFormUnitsOfInterest([]);
        setFormNotes("");
        setFormSellerId("");
        loadData();
      } catch (error: any) {
        alert("Error al agendar cita: " + error.message);
      }
    });
  };

  const handleUpdateStatus = async (id: string, status: "SCHEDULED" | "COMPLETED" | "CANCELLED") => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(id, status);
        setSelectedAppointment((prev: any) => (prev ? { ...prev, status } : null));
        loadData();
      } catch (error: any) {
        alert("Error al actualizar estado: " + error.message);
      }
    });
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    startTransition(async () => {
      try {
        await updateAppointmentNotes(id, notes);
        setSelectedAppointment((prev: any) => (prev ? { ...prev, notes } : null));
        loadData();
        alert("Notas guardadas.");
      } catch (error: any) {
        alert("Error al actualizar notas: " + error.message);
      }
    });
  };

  // Days mapping for calendar view rendering
  const daysOfWeekNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const renderMonthView = () => {
    const { days, firstDayIndex } = getDaysInMonth(currentDate);
    const dayCells = [];

    // Empty cells for padding from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<div key={`empty-${i}`} className="bg-base-200/40 border-b border-r border-base-300 h-28 opacity-30" />);
    }

    // Days in month
    for (let day = 1; day <= days; day++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const cellDateStr = cellDate.toDateString();

      // Find appointments on this day
      const dayApps = appointmentsList.filter(
        (app) => new Date(app.date).toDateString() === cellDateStr
      );

      const isToday = new Date().toDateString() === cellDateStr;

      dayCells.push(
        <div
          key={`day-${day}`}
          className={`bg-base-100 border-b border-r border-base-200 p-2 h-28 flex flex-col justify-between hover:bg-base-200/20 transition-all group relative cursor-pointer`}
          onClick={() => {
            const dateInputFormat = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            setBookingDate(dateInputFormat);
            setIsBookingModalOpen(true);
          }}
        >
          <div className="flex justify-between items-center">
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? "bg-primary text-primary-content" : "text-base-content"
              }`}
            >
              {day}
            </span>
            <button
              className="opacity-0 group-hover:opacity-100 btn btn-circle btn-xs btn-ghost text-primary transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                const dateInputFormat = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                setBookingDate(dateInputFormat);
                setIsBookingModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 mt-1 max-h-[70px] no-scrollbar">
            {dayApps.map((app) => (
              <div
                key={app.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAppointment(app);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border border-l-4 transition-all hover:scale-[1.02] ${
                  app.status === "COMPLETED"
                    ? "bg-success/10 border-success text-success"
                    : app.status === "CANCELLED"
                    ? "bg-error/10 border-error text-error"
                    : app.isTransferred
                    ? "bg-warning/15 border-warning text-warning"
                    : "bg-info/10 border-info text-info"
                }`}
                title={`${app.prospectName} (${app.type === "VIRTUAL" ? "Virtual" : "Presencial"})`}
              >
                {new Date(app.date).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                - {app.prospectName}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Remaining cells to make it standard grid multiple of 7
    const totalCells = dayCells.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
      dayCells.push(<div key={`empty-end-${i}`} className="bg-base-200/40 border-b border-r border-base-300 h-28 opacity-30" />);
    }

    return (
      <div className="border-t border-l border-base-200 rounded-lg overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-base-300/30 text-center py-2 font-bold text-xs uppercase text-gray-500 tracking-wider">
          {daysOfWeekNames.map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-base-100">{dayCells}</div>
      </div>
    );
  };

  const renderTimelineView = (daysCount: number) => {
    const dates = [];
    const baseDate = new Date(currentDate);

    if (calendarView === "week") {
      // Find start of week (Monday)
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      baseDate.setDate(diff);
    }

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d);
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {dates.map((date) => {
          const dateStr = date.toDateString();
          const dayApps = appointmentsList.filter(
            (app) => new Date(app.date).toDateString() === dateStr
          );
          
          return (
            <div key={dateStr} className="bg-base-100 rounded-xl p-4 border border-base-200 flex flex-col min-h-[350px] shadow-sm hover:shadow-md transition-shadow">
              <div className="border-b border-base-200 pb-2 mb-3">
                <p className="text-xs uppercase font-bold text-primary">
                  {date.toLocaleDateString("es-ES", { weekday: "short" })}
                </p>
                <h3 className="text-xl font-extrabold text-base-content mt-0.5">
                  {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
                {dayApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppointment(app)}
                    className={`p-2.5 rounded-lg border border-l-4 cursor-pointer transition-all hover:translate-x-1 ${
                      app.status === "COMPLETED"
                        ? "bg-success/5 border-success text-success-content"
                        : app.status === "CANCELLED"
                        ? "bg-error/5 border-error text-error-content"
                        : app.isTransferred
                        ? "bg-warning/10 border-warning text-warning-content"
                        : "bg-info/5 border-info text-info-content"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold bg-base-200 px-1.5 py-0.5 rounded text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(app.date).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className={`badge badge-xs ${app.type === 'VIRTUAL' ? 'badge-info' : 'badge-accent'}`}>
                        {app.type === 'VIRTUAL' ? 'Virt' : 'Pres'}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate">{app.prospectName}</p>
                    <p className="text-[9px] text-gray-400 truncate">{app.prospectEmail}</p>
                  </div>
                ))}

                {dayApps.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[120px] text-center text-gray-400">
                    <p className="text-xs italic">Sin citas</p>
                  </div>
                )}
              </div>

              <button
                className="mt-3 btn btn-outline btn-xs w-full text-primary hover:bg-primary border-primary/20"
                onClick={() => {
                  const dateInputFormat = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  setBookingDate(dateInputFormat);
                  setIsBookingModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Agendar
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const getDayLabel = () => {
    if (calendarView === "month") {
      return currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    } else if (calendarView === "week") {
      const end = new Date(currentDate);
      const day = currentDate.getDay();
      const diffMon = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(currentDate);
      start.setDate(diffMon);
      end.setDate(diffMon + 6);
      return `${start.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    } else if (calendarView === "3days") {
      const end = new Date(currentDate);
      end.setDate(currentDate.getDate() + 2);
      return `${currentDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header Tabs */}
      <div className="flex flex-wrap justify-between items-center border-b border-base-200 pb-4 gap-4">
        <div className="flex gap-2 bg-base-100 p-1.5 rounded-xl border border-base-300">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`btn btn-sm border-0 ${
              activeTab === "calendar"
                ? "bg-primary text-primary-content hover:bg-primary/95"
                : "btn-ghost text-gray-500"
            }`}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Citas
          </button>
          <button
            onClick={() => setActiveTab("availability")}
            className={`btn btn-sm border-0 ${
              activeTab === "availability"
                ? "bg-primary text-primary-content hover:bg-primary/95"
                : "btn-ghost text-gray-500"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Mi Disponibilidad
          </button>
          {isUserAdmin && (
            <button
              onClick={() => setActiveTab("transfers")}
              className={`btn btn-sm border-0 ${
                activeTab === "transfers"
                  ? "bg-primary text-primary-content hover:bg-primary/95"
                  : "btn-ghost text-gray-500"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Traspaso de Calendarios
            </button>
          )}
        </div>

        {/* Global Loading Spinner */}
        {isPending && <span className="loading loading-spinner text-primary"></span>}

        {/* Filters & Actions for Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Seller dropdown filter for Admin */}
            {isUserAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 uppercase">Ver agenda de:</span>
                <select
                  value={selectedSellerFilter}
                  onChange={(e) => setSelectedSellerFilter(e.target.value)}
                  className="select select-sm select-bordered w-48 text-sm"
                >
                  <option value="ALL">Todos los asesores</option>
                  {sellersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.id === currentUserId ? " (Yo)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View togglers */}
            <div className="join bg-base-100 border border-base-300 p-0.5 rounded-lg text-xs font-semibold">
              {(["month", "week", "3days", "day"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`join-item btn btn-xs border-0 ${
                    calendarView === view ? "bg-base-300 text-base-content" : "btn-ghost text-gray-400"
                  } capitalize`}
                >
                  {view === "month"
                    ? "Mes"
                    : view === "week"
                    ? "Semana"
                    : view === "3days"
                    ? "3 Días"
                    : "1 Día"}
                </button>
              ))}
            </div>

            {/* Schedule New Cita Button */}
            <button
              onClick={() => {
                const now = new Date();
                const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                setBookingDate(formatted);
                setIsBookingModalOpen(true);
              }}
              className="btn btn-sm bg-brand-orange border-0 text-white hover:bg-brand-orange/90"
            >
              <Plus className="w-4 h-4 mr-1" /> Nueva Cita
            </button>
          </div>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === "calendar" && (
        <div className="flex flex-col gap-4">
          {/* Calendar Navigation */}
          <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
            <h2 className="text-lg font-bold font-primary capitalize flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {getDayLabel()}
            </h2>
            <div className="flex gap-1">
              <button onClick={handlePrev} className="btn btn-sm btn-circle btn-ghost">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="btn btn-sm btn-ghost font-semibold text-xs text-primary"
              >
                Hoy
              </button>
              <button onClick={handleNext} className="btn btn-sm btn-circle btn-ghost">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="w-full">
            {calendarView === "month" && renderMonthView()}
            {calendarView === "week" && renderTimelineView(7)}
            {calendarView === "3days" && renderTimelineView(3)}
            {calendarView === "day" && renderTimelineView(1)}
          </div>
        </div>
      )}

      {/* Tab: Availability */}
      {activeTab === "availability" && (
        <div className="bg-base-100 rounded-xl border border-base-200 p-6 shadow-sm max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold font-primary flex items-center gap-2 text-primary">
                <Settings className="w-5 h-5" />
                Configurar mi Disponibilidad
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Define los días y horas que estarás disponible para atender citas virtuales o presenciales.
              </p>
            </div>

            {isUserAdmin && selectedSellerFilter !== "ALL" && (
              <div className="badge badge-warning p-3 gap-1">
                <Shield className="w-3.5 h-3.5" />
                Modo Admin: Editando {sellersList.find((s) => s.id === selectedSellerFilter)?.name}
              </div>
            )}
          </div>

          {/* Slot Duration Configuration */}
          <div className="mb-6 p-4 bg-base-200/50 rounded-xl border border-base-300 max-w-sm flex items-center justify-between">
            <div>
              <label className="text-sm font-bold block">Duración de la Cita</label>
              <span className="text-[11px] text-gray-500">Duración predeterminada por cita</span>
            </div>
            <select
              value={availSlotDuration}
              onChange={(e) => setAvailSlotDuration(parseInt(e.target.value))}
              className="select select-bordered select-sm w-32 font-bold"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>

          {/* Weekly Availability Grid */}
          <div className="space-y-6">
            {daysOfWeekNames.map((dayName, index) => {
              const adjustedDayIndex = index + 1 === 7 ? 0 : index + 1; // Mon=1, Sun=0
              const daySlots = availSlots.filter((slot) => slot.dayOfWeek === adjustedDayIndex);

              return (
                <div key={dayName} className="flex flex-col md:flex-row md:items-start border-b border-base-200 pb-5 last:border-b-0">
                  <div className="md:w-40 font-bold text-sm uppercase text-gray-400 pt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {dayName}
                  </div>

                  <div className="flex-1 flex flex-col gap-3 mt-3 md:mt-0">
                    {daySlots.map((slot, sIdx) => {
                      const globalIdx = availSlots.findIndex((s) => s === slot);
                      return (
                        <div key={sIdx} className="flex flex-wrap items-center gap-3 bg-base-200/40 p-3 rounded-lg border border-base-300/40 animate-fade-in">
                          {/* Start Time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Desde:</span>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateAvailabilitySlot(globalIdx, "startTime", e.target.value)}
                              className="input input-sm input-bordered font-semibold w-32 md:w-36 min-w-[130px]"
                            />
                          </div>

                          {/* End Time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Hasta:</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateAvailabilitySlot(globalIdx, "endTime", e.target.value)}
                              className="input input-sm input-bordered font-semibold w-32 md:w-36 min-w-[130px]"
                            />
                          </div>

                          {/* Meeting Type */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tipo:</span>
                            <select
                              value={slot.meetingType}
                              onChange={(e) => updateAvailabilitySlot(globalIdx, "meetingType", e.target.value)}
                              className="select select-sm select-bordered font-semibold"
                            >
                              <option value="BOTH">Virtual & Presencial</option>
                              <option value="VIRTUAL">Sólo Virtual</option>
                              <option value="IN_PERSON">Sólo Presencial</option>
                            </select>
                          </div>

                          {/* Remove Slot */}
                          <button
                            onClick={() => removeAvailabilitySlot(globalIdx)}
                            className="btn btn-ghost btn-sm text-error btn-circle"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => addAvailabilitySlot(adjustedDayIndex)}
                      className="btn btn-ghost btn-xs w-fit text-primary font-bold hover:bg-primary/10"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Añadir horario
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="mt-8 pt-4 border-t border-base-200 flex justify-end">
            <button onClick={handleSaveAvailability} className="btn bg-primary text-primary-content hover:bg-primary/90">
              <Check className="w-4 h-4 mr-1" /> Guardar Disponibilidad
            </button>
          </div>
        </div>
      )}

      {/* Tab: Calendar Transfers */}
      {activeTab === "transfers" && isUserAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Transfer Form */}
          <div className="bg-base-100 rounded-xl border border-base-200 p-5 shadow-sm h-fit">
            <h3 className="text-lg font-bold font-primary mb-4 text-primary flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Configurar Traspaso
            </h3>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">TRASPASAR CITAS DE:</span></label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="select select-bordered select-sm w-full font-semibold"
                  required
                >
                  <option value="">-- Seleccionar vendedor --</option>
                  {sellersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.id === currentUserId ? " (Yo)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">TRASPASAR CITAS A:</span></label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="select select-bordered select-sm w-full font-semibold"
                  required
                >
                  <option value="">-- Seleccionar destinatario --</option>
                  {sellersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.id === currentUserId ? " (Yo)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">TIPO DE TRASPASO:</span></label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="transferType"
                      checked={transferType === "TEMPORARY"}
                      onChange={() => setTransferType("TEMPORARY")}
                      className="radio radio-primary radio-sm"
                    />
                    Temporal
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="transferType"
                      checked={transferType === "DEFINITIVE"}
                      onChange={() => setTransferType("DEFINITIVE")}
                      className="radio radio-primary radio-sm"
                    />
                    Definitivo
                  </label>
                </div>
              </div>

              {transferType === "TEMPORARY" && (
                <div className="space-y-3 p-3 bg-base-200/50 rounded-lg border border-base-300 animate-fade-in">
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-[10px] font-bold text-gray-500">DESDE (FECHA/HORA):</span></label>
                    <input
                      type="datetime-local"
                      value={transferStartDate}
                      onChange={(e) => setTransferStartDate(e.target.value)}
                      className="input input-sm input-bordered font-semibold text-xs"
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text text-[10px] font-bold text-gray-500">HASTA (FECHA/HORA):</span></label>
                    <input
                      type="datetime-local"
                      value={transferEndDate}
                      onChange={(e) => setTransferEndDate(e.target.value)}
                      className="input input-sm input-bordered font-semibold text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-sm bg-primary hover:bg-primary/95 text-primary-content w-full font-bold mt-2">
                Ejecutar Traspaso
              </button>
            </form>
          </div>

          {/* Transfers Log */}
          <div className="bg-base-100 rounded-xl border border-base-200 p-5 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold font-primary mb-4 text-primary">Historial de Traspasos Temporales Activos</h3>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th>Receptor</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {transfersList.map((t) => {
                    const isOver = new Date(t.endDate).getTime() < Date.now();
                    return (
                      <tr key={t.id} className={isOver ? "opacity-40" : ""}>
                        <td className="font-semibold">{t.fromName}</td>
                        <td className="font-semibold text-primary">{t.toName}</td>
                        <td>{new Date(t.startDate).toLocaleString()}</td>
                        <td>{new Date(t.endDate).toLocaleString()}</td>
                        <td>
                          {!isOver && (
                            <button
                              onClick={() => handleDeleteTransfer(t.id)}
                              className="btn btn-ghost btn-xs text-error font-bold"
                            >
                              Revocar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {transfersList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                        No hay traspasos temporales configurados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Appointment Details */}
      {selectedAppointment && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-white border border-base-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={() => setSelectedAppointment(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-base-200 pb-4 mb-4">
              <span className={`p-3 rounded-full ${
                selectedAppointment.status === "COMPLETED"
                  ? "bg-success/15 text-success"
                  : selectedAppointment.status === "CANCELLED"
                  ? "bg-error/15 text-error"
                  : "bg-info/15 text-info"
              }`}>
                <CalendarIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-lg text-base-content leading-tight">Detalles de la Cita</h3>
                <span className={`badge badge-sm mt-1 uppercase font-bold tracking-wider ${
                  selectedAppointment.status === "COMPLETED"
                    ? "badge-success text-white"
                    : selectedAppointment.status === "CANCELLED"
                    ? "badge-error text-white"
                    : "badge-info text-white"
                }`}>
                  {selectedAppointment.status === "SCHEDULED" ? "Programada" : selectedAppointment.status === "COMPLETED" ? "Completada" : "Cancelada"}
                </span>
              </div>
            </div>

            {/* Main Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-400 text-[10px] uppercase">Fecha y Hora</p>
                  <p className="font-bold text-gray-800">
                    {new Date(selectedAppointment.date).toLocaleString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <User className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="font-bold text-gray-400 text-[10px] uppercase">Prospecto</p>
                  <p className="font-bold text-gray-800">{selectedAppointment.prospectName}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.prospectEmail}</p>
                  {selectedAppointment.prospectPhone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {selectedAppointment.prospectPhone}
                    </p>
                  )}
                  {selectedAppointment.prospectAddress && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" /> {selectedAppointment.prospectAddress}
                    </p>
                  )}
                </div>
              </div>

              {selectedAppointment.prospect?.units && selectedAppointment.prospect.units.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <Building className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-400 text-[10px] uppercase">Unidades de Interés</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAppointment.prospect.units.map((unitId: string) => (
                        <span key={unitId} className="badge badge-sm badge-outline badge-primary font-bold">
                          {unitId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Buttons */}
              <div className="border-t border-base-200 pt-4 flex gap-2">
                {selectedAppointment.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, "COMPLETED")}
                      className="btn btn-success text-white btn-sm flex-1 font-bold"
                    >
                      <Check className="w-4 h-4 mr-1" /> Completar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, "CANCELLED")}
                      className="btn btn-error text-white btn-sm flex-1 font-bold"
                    >
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </button>
                  </>
                )}
                {selectedAppointment.status !== "SCHEDULED" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, "SCHEDULED")}
                    className="btn btn-outline btn-sm w-full font-bold"
                  >
                    Reabrir Cita
                  </button>
                )}
              </div>

              {/* Notes Form */}
              <div className="border-t border-base-200 pt-4">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Notas Internas</label>
                <textarea
                  defaultValue={selectedAppointment.notes || ""}
                  onBlur={(e) => handleUpdateNotes(selectedAppointment.id, e.target.value)}
                  placeholder="Escribe comentarios privados sobre la cita..."
                  className="textarea textarea-bordered textarea-sm w-full text-xs min-h-[70px] resize-none"
                />
                <span className="text-[9px] text-gray-400 block mt-1">
                  Se guarda automáticamente al hacer clic fuera del campo de notas.
                </span>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedAppointment(null)} />
        </div>
      )}

      {/* Modal: Schedule Booking */}
      {isBookingModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-white border border-base-200 shadow-2xl rounded-2xl p-6 relative">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black font-primary mb-4 text-primary flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" /> Agendar Cita
            </h3>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">FECHA:</span></label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="input input-sm input-bordered font-semibold"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">HORA:</span></label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="input input-sm input-bordered font-semibold w-full min-w-[130px]"
                    required
                  />
                </div>
              </div>

              {/* meeting Type & Seller */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">TIPO DE REUNIÓN:</span></label>
                  <select
                    value={formMeetingType}
                    onChange={(e) => setFormMeetingType(e.target.value as any)}
                    className="select select-bordered select-sm w-full font-semibold"
                  >
                    <option value="VIRTUAL">Virtual</option>
                    <option value="IN_PERSON">Presencial</option>
                  </select>
                </div>

                {isUserAdmin && (
                  <div className="form-control">
                    <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">ASIGNAR A:</span></label>
                    <select
                      value={formSellerId}
                      onChange={(e) => setFormSellerId(e.target.value)}
                      className="select select-bordered select-sm w-full font-semibold"
                    >
                      <option value="">-- Asesor Automático --</option>
                      {sellersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}{s.id === currentUserId ? " (Yo)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="divider text-xs font-bold text-gray-400 uppercase tracking-widest my-2">Información del Prospecto</div>

              {/* Selection between Existing or New */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="prospectType"
                    checked={prospectSelectionType === "new"}
                    onChange={() => setProspectSelectionType("new")}
                    className="radio radio-primary radio-xs"
                  />
                  Crear Nuevo Prospecto
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="prospectType"
                    checked={prospectSelectionType === "existing"}
                    onChange={() => setProspectSelectionType("existing")}
                    className="radio radio-primary radio-xs"
                  />
                  Seleccionar Existente
                </label>
              </div>

              {prospectSelectionType === "existing" && (
                <div className="form-control w-full">
                  <select
                    value={selectedProspectId}
                    onChange={(e) => setSelectedProspectId(e.target.value)}
                    className="select select-bordered select-sm w-full font-semibold text-sm"
                    required
                  >
                    <option value="">-- Seleccionar prospecto --</option>
                    {prospectsList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prospect inputs */}
              <div className="space-y-3">
                <div className="form-control">
                  <input
                    type="text"
                    placeholder="Nombre Completo *"
                    value={formProspectName}
                    onChange={(e) => setFormProspectName(e.target.value)}
                    className="input input-sm input-bordered font-medium"
                    required
                    disabled={prospectSelectionType === "existing" && !!selectedProspectId}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <input
                      type="email"
                      placeholder="Correo Electrónico *"
                      value={formProspectEmail}
                      onChange={(e) => setFormProspectEmail(e.target.value)}
                      className="input input-sm input-bordered font-medium"
                      required
                      disabled={prospectSelectionType === "existing" && !!selectedProspectId}
                    />
                  </div>
                  <div className="form-control">
                    <input
                      type="tel"
                      placeholder="Celular / Teléfono"
                      value={formProspectPhone}
                      onChange={(e) => setFormProspectPhone(e.target.value)}
                      className="input input-sm input-bordered font-medium"
                      disabled={prospectSelectionType === "existing" && !!selectedProspectId}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <input
                    type="text"
                    placeholder="Dirección Física (Opcional)"
                    value={formProspectAddress}
                    onChange={(e) => setFormProspectAddress(e.target.value)}
                    className="input input-sm input-bordered font-medium"
                    disabled={prospectSelectionType === "existing" && !!selectedProspectId}
                  />
                </div>
              </div>

              {/* units picker */}
              <div className="form-control">
                <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">UNIDAD(ES) DE INTERÉS:</span></label>
                <div className="border border-base-300 rounded-lg p-3 max-h-24 overflow-y-auto grid grid-cols-3 gap-2">
                  {unitsList.map((u) => (
                    <label key={u.id} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formUnitsOfInterest.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormUnitsOfInterest((prev) => [...prev, u.id]);
                          } else {
                            setFormUnitsOfInterest((prev) => prev.filter((id) => id !== u.id));
                          }
                        }}
                        className="checkbox checkbox-primary checkbox-xs"
                      />
                      {u.identifier}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="form-control">
                <textarea
                  placeholder="Notas o comentarios internos..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="textarea textarea-bordered textarea-sm w-full text-xs min-h-[50px] resize-none"
                />
              </div>

              {/* Email dispatch alert */}
              <div className="form-control bg-base-200/50 p-3 rounded-lg border border-base-300 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold">Enviar correo de notificación</p>
                    <p className="text-[10px] text-gray-500">Se le notificará automáticamente al cliente y al asesor.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formSendEmail}
                  onChange={(e) => setFormSendEmail(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </div>

              <div className="modal-action mt-2">
                <button type="submit" className="btn btn-sm bg-primary hover:bg-primary/95 text-primary-content font-bold">
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsBookingModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
