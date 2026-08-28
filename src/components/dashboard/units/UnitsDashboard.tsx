"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  LayoutGrid,
  TableProperties,
  Kanban,
  Search,
  Check,
  AlertTriangle,
  ExternalLink,
  User as UserIcon,
  Maximize2,
  Building2,
  MapPin,
  Compass,
  Layers,
  ChevronRight,
  Eye,
  Bed,
  Bath,
  Edit,
  X,
  Sparkles,
  Download,
  Filter,
} from "lucide-react";
import { UrbanizationUnit, updateUrbanizationUnitState } from "@/app/actions/units";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UnitsDashboardProps {
  initialUnits: UrbanizationUnit[];
  currentUser: User;
}

type ZoneTab = "zone-1" | "zone-2" | "zone-3";
type ViewMode = "grid" | "table" | "kanban";

export default function UnitsDashboard({
  initialUnits,
  currentUser,
}: UnitsDashboardProps) {
  const [units, setUnits] = useState<UrbanizationUnit[]>(initialUnits);
  const [activeZone, setActiveZone] = useState<ZoneTab>("zone-1");
  const [activeView, setActiveView] = useState<ViewMode>("grid");

  // Filtros secundarios para Lotes (Zonas 1 y 2)
  const [selectedBlock, setSelectedBlock] = useState<string>("ALL"); // "ALL", "mz-k", etc.
  const [selectedPosition, setSelectedPosition] = useState<string>("ALL"); // "ALL", "Esquinera", "Medianera"

  // Filtros secundarios para Torres (Zona 3)
  const [selectedTower, setSelectedTower] = useState<string>("ALL"); // "ALL", "tower-a", "tower-b", "tower-c"
  const [selectedFloorLevel, setSelectedFloorLevel] = useState<string>("ALL"); // "ALL", "1", "2", "3", "4", "5", "6"
  const [selectedApartmentType, setSelectedApartmentType] = useState<string>("ALL"); // "ALL", "depa-1", etc.

  // Filtros generales
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL"); // "ALL", "AVAILABLE", "RESERVED", "SOLD"
  const [searchQuery, setSearchQuery] = useState("");

  const [isPending, startTransition] = useTransition();

  // Notificaciones
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Modal de Detalle / Edición
  const [selectedUnit, setSelectedUnit] = useState<UrbanizationUnit | null>(null);
  const [modalBuyerName, setModalBuyerName] = useState("");
  const [modalState, setModalState] = useState<"AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA">("AVAILABLE");
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const isSupervisor = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  // Cambio de zona limpia filtros secundarios
  const handleZoneChange = (zone: ZoneTab) => {
    setActiveZone(zone);
    setSelectedBlock("ALL");
    setSelectedPosition("ALL");
    setSelectedTower("ALL");
    setSelectedFloorLevel("ALL");
    setSelectedApartmentType("ALL");
  };

  // Filtrado de unidades según la zona y controles activos
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // 1. Filtro de Zona
      if (u.zoneId !== activeZone) return false;

      // 2. Filtros para Zonas de Lotes (Zona 1 y Zona 2)
      if (activeZone === "zone-1" || activeZone === "zone-2") {
        if (selectedBlock !== "ALL" && u.blockId !== selectedBlock) return false;
        if (selectedPosition !== "ALL" && u.lotPosition !== selectedPosition) return false;
      }

      // 3. Filtros para Zona de Torres (Zona 3)
      if (activeZone === "zone-3") {
        if (selectedTower !== "ALL" && u.towerId !== selectedTower) return false;
        if (selectedFloorLevel !== "ALL" && String(u.floorLevel) !== selectedFloorLevel) return false;
        if (selectedApartmentType !== "ALL" && u.apartmentTypeId !== selectedApartmentType) return false;
      }

      // 4. Filtro de Estado Comercial
      if (selectedStatus !== "ALL" && u.state !== selectedStatus) return false;

      // 5. Buscador en texto libre
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = u.code.toLowerCase().includes(query);
        const matchesIdentifier = u.identifier.toLowerCase().includes(query);
        const matchesBuyer = u.buyerName ? u.buyerName.toLowerCase().includes(query) : false;
        const matchesType = u.type.toLowerCase().includes(query);
        if (!matchesCode && !matchesIdentifier && !matchesBuyer && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [
    units,
    activeZone,
    selectedBlock,
    selectedPosition,
    selectedTower,
    selectedFloorLevel,
    selectedApartmentType,
    selectedStatus,
    searchQuery,
  ]);

  // Contadores globales por zona
  const zoneStats = useMemo(() => {
    const forZone = units.filter((u) => u.zoneId === activeZone);
    const available = forZone.filter((u) => u.state === "AVAILABLE").length;
    const reserved = forZone.filter((u) => u.state === "RESERVED").length;
    const sold = forZone.filter((u) => u.state === "SOLD").length;
    return {
      total: forZone.length,
      available,
      reserved,
      sold,
      percentageSold: forZone.length > 0 ? Math.round(((sold + reserved) / forZone.length) * 100) : 0,
    };
  }, [units, activeZone]);

  // Opciones de Manzanas disponibles para la zona actual
  const availableBlocks = useMemo(() => {
    if (activeZone === "zone-1") {
      return [
        { id: "mz-o", letter: "Mz. O", count: 15 },
        { id: "mz-p", letter: "Mz. P", count: 14 },
        { id: "mz-q", letter: "Mz. Q", count: 28 },
        { id: "mz-r", letter: "Mz. R", count: 12 },
      ];
    }
    if (activeZone === "zone-2") {
      return [
        { id: "mz-k", letter: "Mz. K", count: 16 },
        { id: "mz-l", letter: "Mz. L", count: 18 },
        { id: "mz-m", letter: "Mz. M", count: 16 },
        { id: "mz-n", letter: "Mz. N", count: 14 },
      ];
    }
    return [];
  }, [activeZone]);

  // Cambio rápido de estado desde Grilla o Tabla
  const handleQuickStatusChange = async (
    unit: UrbanizationUnit,
    newState: "AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA"
  ) => {
    if (unit.state === newState) return;

    // Validación de reversión
    const isReversion =
      (unit.state === "SOLD" && (newState === "RESERVED" || newState === "AVAILABLE")) ||
      (unit.state === "RESERVED" && newState === "AVAILABLE");

    if (isReversion && !isSupervisor) {
      showNotification(
        "error",
        "Revertir una unidad reservada o vendida requiere autorización de Supervisor / Administrador."
      );
      return;
    }

    startTransition(async () => {
      try {
        await updateUrbanizationUnitState(unit.id, newState, unit.buyerName, {
          floorOrBlockId: unit.blockId || unit.floorId || "urbanization",
          identifier: unit.identifier,
          areaSqm: unit.areaSqm,
          type: unit.type,
        });

        setUnits((prev) =>
          prev.map((u) => (u.id === unit.id ? { ...u, state: newState } : u))
        );

        showNotification(
          "success",
          `${unit.code} actualizado a ${
            newState === "AVAILABLE" ? "Disponible" : newState === "RESERVED" ? "Reservado" : "Vendido"
          }`
        );
      } catch (e: any) {
        showNotification("error", e.message || "Error al actualizar estado");
      }
    });
  };

  // Abrir Modal de Detalle
  const openDetailModal = (unit: UrbanizationUnit) => {
    setSelectedUnit(unit);
    setModalBuyerName(unit.buyerName || "");
    setModalState(unit.state);
  };

  const closeDetailModal = () => {
    setSelectedUnit(null);
  };

  // Guardar cambios desde Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    setIsSaving(true);
    try {
      await updateUrbanizationUnitState(selectedUnit.id, modalState, modalBuyerName, {
        floorOrBlockId: selectedUnit.blockId || selectedUnit.floorId || "urbanization",
        identifier: selectedUnit.identifier,
        areaSqm: selectedUnit.areaSqm,
        type: selectedUnit.type,
      });

      setUnits((prev) =>
        prev.map((u) =>
          u.id === selectedUnit.id
            ? { ...u, state: modalState, buyerName: modalBuyerName || null }
            : u
        )
      );

      showNotification("success", `Unidad ${selectedUnit.code} actualizada con éxito.`);
      closeDetailModal();
    } catch (e: any) {
      showNotification("error", e.message || "Error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-fade-in pb-16 px-2 sm:px-4">
      {/* Notificación flotante */}
      {notification && (
        <div className="toast toast-top toast-end z-[110]">
          <div
            className={`alert shadow-lg ${
              notification.type === "success"
                ? "alert-success text-white bg-green-600 border-none"
                : "alert-error text-white bg-red-600 border-none"
            }`}
          >
            <div>
              {notification.type === "success" ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-primary text-gray-900 flex items-center gap-2">
              Módulo de Unidades, Manzanas y Torres
            </h1>
            <p className="text-gray-500 text-sm font-secondary mt-0.5">
              Gestiona el inventario comercial, disponibilidad y asignación de compradores del proyecto.
            </p>
          </div>
        </div>

        {/* Métricas rápidas de la Zona Activa */}
        <div className="flex items-center gap-3 bg-base-50 p-2.5 rounded-xl border border-base-200">
          <div className="px-3 py-1 bg-white rounded-lg shadow-xs border border-gray-100 text-center">
            <div className="text-[10px] uppercase font-bold text-gray-600">Total</div>
            <div className="text-base font-extrabold text-gray-900">{zoneStats.total}</div>
          </div>
          <div className="px-3 py-1 bg-green-50 rounded-lg border border-green-200 text-center">
            <div className="text-[10px] uppercase font-bold text-green-800">Disponibles</div>
            <div className="text-base font-extrabold text-green-700">{zoneStats.available}</div>
          </div>
          <div className="px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
            <div className="text-[10px] uppercase font-bold text-yellow-800">Reservados</div>
            <div className="text-base font-extrabold text-yellow-700">{zoneStats.reserved}</div>
          </div>
          <div className="px-3 py-1 bg-red-50 rounded-lg border border-red-200 text-center">
            <div className="text-[10px] uppercase font-bold text-red-800">Vendidos</div>
            <div className="text-base font-extrabold text-red-700">{zoneStats.sold}</div>
          </div>
        </div>
      </div>

      {/* 1. Selector Principal de Zonas */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleZoneChange("zone-1")}
          className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all ${
            activeZone === "zone-1"
              ? "bg-white border-brand-orange ring-2 ring-brand-orange/20 shadow-md"
              : "bg-white/70 hover:bg-white border-base-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeZone === "zone-1" ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900 text-base font-primary">Zona 1 · Lotes</div>
              <div className="text-xs text-gray-500 font-secondary">Manzanas O, P, Q, R (69 Lotes)</div>
            </div>
          </div>
          <span className="badge bg-base-200 text-gray-700 font-bold border-0">69 lotes</span>
        </button>

        <button
          onClick={() => handleZoneChange("zone-2")}
          className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all ${
            activeZone === "zone-2"
              ? "bg-white border-brand-orange ring-2 ring-brand-orange/20 shadow-md"
              : "bg-white/70 hover:bg-white border-base-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeZone === "zone-2" ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900 text-base font-primary">Zona 2 · Lotes</div>
              <div className="text-xs text-gray-500 font-secondary">Manzanas K, L, M, N (64 Lotes)</div>
            </div>
          </div>
          <span className="badge bg-base-200 text-gray-700 font-bold border-0">64 lotes</span>
        </button>

        <button
          onClick={() => handleZoneChange("zone-3")}
          className={`flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all ${
            activeZone === "zone-3"
              ? "bg-white border-brand-orange ring-2 ring-brand-orange/20 shadow-md"
              : "bg-white/70 hover:bg-white border-base-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                activeZone === "zone-3" ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900 text-base font-primary">Zona 3 · Torres</div>
              <div className="text-xs text-gray-500 font-secondary">Torres A, B, C (60 Departamentos)</div>
            </div>
          </div>
          <span className="badge bg-base-200 text-gray-700 font-bold border-0">60 depas</span>
        </button>
      </div>

      {/* 2. Filtros Contextuales y Barra de Control */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-base-200 flex flex-col gap-4">
        {/* Filtros específicos según Zona */}
        {(activeZone === "zone-1" || activeZone === "zone-2") && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mr-2">
                <Layers className="w-4 h-4 text-brand-orange" /> Manzanas (Plantas):
              </span>
              <button
                onClick={() => setSelectedBlock("ALL")}
                className={`btn btn-sm rounded-xl font-medium ${
                  selectedBlock === "ALL"
                    ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                    : "btn-ghost text-gray-600 hover:bg-gray-100"
                }`}
              >
                Todas las Manzanas
              </button>
              {availableBlocks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBlock(b.id)}
                  className={`btn btn-sm rounded-xl font-medium ${
                    selectedBlock === b.id
                      ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                      : "btn-ghost text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {b.letter} ({b.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                className="select select-sm select-bordered rounded-xl text-xs"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                <option value="ALL">Todas las Posiciones</option>
                <option value="Esquinera">Esquineras</option>
                <option value="Medianera">Medianeras</option>
              </select>
            </div>
          </div>
        )}

        {/* Filtros específicos para Torres (Zona 3) */}
        {activeZone === "zone-3" && (
          <div className="flex flex-col gap-4 pb-4 border-b border-gray-100">
            {/* Paso 1: Selector de Torre */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mr-2">
                <Building2 className="w-4 h-4 text-brand-orange" /> 1. Torre:
              </span>
              <button
                onClick={() => setSelectedTower("ALL")}
                className={`btn btn-sm rounded-xl font-medium ${
                  selectedTower === "ALL"
                    ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                    : "btn-ghost text-gray-600 hover:bg-gray-100"
                }`}
              >
                Todas las Torres (60)
              </button>
              <button
                onClick={() => setSelectedTower("tower-a")}
                className={`btn btn-sm rounded-xl font-medium ${
                  selectedTower === "tower-a"
                    ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                    : "btn-ghost text-gray-600 hover:bg-gray-100"
                }`}
              >
                Torre A (20)
              </button>
              <button
                onClick={() => setSelectedTower("tower-b")}
                className={`btn btn-sm rounded-xl font-medium ${
                  selectedTower === "tower-b"
                    ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                    : "btn-ghost text-gray-600 hover:bg-gray-100"
                }`}
              >
                Torre B (20)
              </button>
              <button
                onClick={() => setSelectedTower("tower-c")}
                className={`btn btn-sm rounded-xl font-medium ${
                  selectedTower === "tower-c"
                    ? "bg-brand-orange text-white hover:bg-brand-dark-orange border-none shadow-xs"
                    : "btn-ghost text-gray-600 hover:bg-gray-100"
                }`}
              >
                Torre C (20)
              </button>
            </div>

            {/* Paso 2: Selector de Piso / Planta y Tipología */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-dashed border-gray-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5 mr-2">
                  <Layers className="w-4 h-4 text-brand-orange" /> 2. Planta / Piso:
                </span>
                <button
                  onClick={() => setSelectedFloorLevel("ALL")}
                  className={`btn btn-xs rounded-lg ${
                    selectedFloorLevel === "ALL" ? "btn-neutral text-white" : "btn-ghost text-gray-600"
                  }`}
                >
                  Todos
                </button>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedFloorLevel(String(lvl))}
                    className={`btn btn-xs rounded-lg ${
                      selectedFloorLevel === String(lvl)
                        ? "btn-neutral text-white"
                        : "btn-ghost text-gray-600"
                    }`}
                  >
                    Piso {lvl}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="select select-sm select-bordered rounded-xl text-xs"
                  value={selectedApartmentType}
                  onChange={(e) => setSelectedApartmentType(e.target.value)}
                >
                  <option value="ALL">Todas las Tipologías</option>
                  <option value="depa-1">Tipología 01 (Frente Izq)</option>
                  <option value="depa-2">Tipología 02 (Frente Der)</option>
                  <option value="depa-3">Tipología 03 (Fondo Der)</option>
                  <option value="depa-4">Tipología 04 (Fondo Izq)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Filtros Generales, Búsqueda y Switcher de Vista */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código, manzana, comprador o identificador..."
                className="input input-bordered input-sm rounded-xl pl-9.5 w-full text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="select select-sm select-bordered rounded-xl text-xs w-44 shrink-0"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Todos los Estados</option>
              <option value="AVAILABLE">🟢 Disponibles</option>
              <option value="RESERVED">🟡 Reservados</option>
              <option value="SOLD">🔴 Vendidos</option>
            </select>
          </div>

          {/* Switcher de Vistas: Grilla, Tabla, Kanban */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setActiveView("grid")}
              className={`btn btn-xs rounded-lg gap-1 border-none ${
                activeView === "grid" ? "bg-white text-gray-900 shadow-xs" : "btn-ghost text-gray-500"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grilla
            </button>
            <button
              onClick={() => setActiveView("table")}
              className={`btn btn-xs rounded-lg gap-1 border-none ${
                activeView === "table" ? "bg-white text-gray-900 shadow-xs" : "btn-ghost text-gray-500"
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" /> Tabla
            </button>
            <button
              onClick={() => setActiveView("kanban")}
              className={`btn btn-xs rounded-lg gap-1 border-none ${
                activeView === "kanban" ? "bg-white text-gray-900 shadow-xs" : "btn-ghost text-gray-500"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
        </div>
      </div>

      {/* 3. Renderizado de Unidades */}
      {filteredUnits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-base-200 shadow-sm flex flex-col items-center justify-center">
          <Building2 className="w-16 h-16 text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No se encontraron unidades</h3>
          <p className="text-sm text-gray-500 max-w-md mt-1">
            No hay unidades que coincidan con los filtros seleccionados o el término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedBlock("ALL");
              setSelectedTower("ALL");
              setSelectedFloorLevel("ALL");
              setSelectedStatus("ALL");
              setSearchQuery("");
            }}
            className="btn btn-sm btn-outline rounded-xl mt-4"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : activeView === "grid" ? (
        /* VISTA GRILLA */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredUnits.map((unit) => {
            const previewImg =
              unit.kind === "lot"
                ? unit.planImageMeasured || unit.planImage
                : unit.gallery?.[0] || unit.planImage;

            return (
              <div
                key={unit.id}
                className="group bg-white rounded-2xl border border-base-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Imagen Preview */}
                <div className="aspect-[4/3] bg-base-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {previewImg ? (
                    <img
                      src={previewImg}
                      alt={unit.code}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-gray-300" />
                  )}

                  {/* Badge de Estado Comercial */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`badge badge-sm font-bold uppercase text-[9px] px-2.5 py-2 rounded-full shadow-xs ${
                        unit.state === "AVAILABLE"
                          ? "bg-green-500 text-white"
                          : unit.state === "RESERVED"
                          ? "bg-amber-400 text-gray-900"
                          : unit.state === "SOLD"
                          ? "bg-red-500 text-white"
                          : "bg-gray-400 text-white"
                      }`}
                    >
                      {unit.state === "AVAILABLE"
                        ? "Disponible"
                        : unit.state === "RESERVED"
                        ? "Reservado"
                        : unit.state === "SOLD"
                        ? "Vendido"
                        : "Área Común"}
                    </span>
                  </div>

                  {/* Tag de Posición o Tipología */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/65 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs">
                      {unit.kind === "lot"
                        ? unit.lotPosition || "Lote"
                        : unit.floorName}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => openDetailModal(unit)}
                      className="btn btn-sm bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold border-0 shadow-lg flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-brand-orange" /> Ver Ficha
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 font-primary text-base truncate">
                        {unit.code}
                      </h3>
                      <span className="text-xs font-bold text-brand-orange">
                        {unit.areaSqm} m²
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {unit.kind === "lot"
                        ? `Manzana ${unit.blockLetter} · ${unit.identifier}`
                        : `${unit.towerName} · Flat 3 Dorm.`}
                    </p>
                  </div>

                  {/* Comprador Asignado */}
                  {unit.buyerName ? (
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {unit.buyerName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic">
                      Sin comprador asignado
                    </div>
                  )}

                  {/* Selector Rápido de Estado */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Estado:</span>
                    <select
                      className="select select-xs rounded-lg font-medium text-[11px] border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-brand-orange hover:border-gray-300 transition-colors shadow-2xs"
                      value={unit.state}
                      disabled={isPending}
                      onChange={(e) =>
                        handleQuickStatusChange(unit, e.target.value as any)
                      }
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="RESERVED">Reservado</option>
                      <option value="SOLD">Vendido</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeView === "table" ? (
        /* VISTA TABLA */
        <div className="bg-white rounded-2xl shadow-sm border border-base-200 overflow-x-auto">
          <table className="table table-zebra w-full text-xs">
            <thead>
              <tr className="bg-base-100 text-gray-600 font-bold uppercase text-[10px]">
                <th>Código</th>
                <th>Zona</th>
                <th>Ubicación (Manzana / Torre)</th>
                <th>Tipo</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Comprador</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-orange-50/40">
                  <td className="font-bold text-gray-900 font-primary text-sm">
                    {unit.code}
                  </td>
                  <td>{unit.zoneName}</td>
                  <td>
                    {unit.kind === "lot"
                      ? `Manzana ${unit.blockLetter}`
                      : `${unit.towerName} · ${unit.floorName}`}
                  </td>
                  <td>
                    <span className="badge badge-sm badge-ghost text-[10px]">
                      {unit.type}
                    </span>
                  </td>
                  <td className="font-semibold">{unit.areaSqm} m²</td>
                  <td>
                    <select
                      className="select select-xs rounded-lg font-medium text-[10px] border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-brand-orange hover:border-gray-300 transition-colors shadow-2xs"
                      value={unit.state}
                      disabled={isPending}
                      onChange={(e) =>
                        handleQuickStatusChange(unit, e.target.value as any)
                      }
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="RESERVED">Reservado</option>
                      <option value="SOLD">Vendido</option>
                    </select>
                  </td>
                  <td>
                    {unit.buyerName ? (
                      <span className="font-medium text-gray-800 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-gray-400" /> {unit.buyerName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openDetailModal(unit)}
                      className="btn btn-ghost btn-xs text-brand-orange hover:bg-orange-100 rounded-lg gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* VISTA KANBAN */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Columna Disponibles */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-base-200 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-green-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Disponibles
              </h3>
              <span className="badge bg-green-100 text-green-800 border-none font-bold text-xs">
                {filteredUnits.filter((u) => u.state === "AVAILABLE").length}
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredUnits
                .filter((u) => u.state === "AVAILABLE")
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-white p-3.5 rounded-xl border border-base-200 shadow-xs hover:shadow-md transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm font-primary">
                        {unit.code}
                      </span>
                      <span className="text-xs font-bold text-brand-orange">
                        {unit.areaSqm} m²
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{unit.kind === "lot" ? `Mz. ${unit.blockLetter}` : unit.towerName}</span>
                      <button
                        onClick={() => openDetailModal(unit)}
                        className="text-brand-orange hover:underline text-[11px] font-bold"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Columna Reservados */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-base-200 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-yellow-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                Reservados
              </h3>
              <span className="badge bg-yellow-100 text-yellow-800 border-none font-bold text-xs">
                {filteredUnits.filter((u) => u.state === "RESERVED").length}
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredUnits
                .filter((u) => u.state === "RESERVED")
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-white p-3.5 rounded-xl border border-base-200 shadow-xs hover:shadow-md transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm font-primary">
                        {unit.code}
                      </span>
                      <span className="text-xs font-bold text-brand-orange">
                        {unit.areaSqm} m²
                      </span>
                    </div>
                    {unit.buyerName && (
                      <div className="text-[11px] text-gray-700 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                        👤 {unit.buyerName}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{unit.kind === "lot" ? `Mz. ${unit.blockLetter}` : unit.towerName}</span>
                      <button
                        onClick={() => openDetailModal(unit)}
                        className="text-brand-orange hover:underline text-[11px] font-bold"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Columna Vendidos */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-base-200 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-red-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Vendidos
              </h3>
              <span className="badge bg-red-100 text-red-800 border-none font-bold text-xs">
                {filteredUnits.filter((u) => u.state === "SOLD").length}
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredUnits
                .filter((u) => u.state === "SOLD")
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-white p-3.5 rounded-xl border border-base-200 shadow-xs hover:shadow-md transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm font-primary">
                        {unit.code}
                      </span>
                      <span className="text-xs font-bold text-brand-orange">
                        {unit.areaSqm} m²
                      </span>
                    </div>
                    {unit.buyerName && (
                      <div className="text-[11px] text-gray-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                        👤 {unit.buyerName}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{unit.kind === "lot" ? `Mz. ${unit.blockLetter}` : unit.towerName}</span>
                      <button
                        onClick={() => openDetailModal(unit)}
                        className="text-brand-orange hover:underline text-[11px] font-bold"
                      >
                        Ver Ficha
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE Y EDICIÓN DE UNIDAD */}
      {selectedUnit && (
        <dialog open className="modal modal-open">
          <div className="modal-box p-6 bg-white rounded-3xl max-w-2xl w-full font-secondary shadow-2xl border border-gray-100">
            <button
              onClick={closeDetailModal}
              className="btn btn-sm btn-circle btn-ghost absolute right-5 top-5"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange shrink-0">
                {selectedUnit.kind === "lot" ? <MapPin className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-xl font-primary text-gray-900">
                  {selectedUnit.code}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedUnit.zoneName} · {selectedUnit.type}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="flex flex-col gap-5 mt-5">
              {/* Imagen y Planos */}
              <div className="aspect-video bg-base-100 rounded-2xl overflow-hidden relative border border-gray-200">
                <img
                  src={
                    selectedUnit.kind === "lot"
                      ? selectedUnit.planImageMeasured || selectedUnit.planImage || ""
                      : selectedUnit.gallery?.[0] || ""
                  }
                  alt={selectedUnit.code}
                  className="w-full h-full object-cover"
                />
                {selectedUnit.tourUrl && (
                  <a
                    href={selectedUnit.tourUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-3 right-3 btn btn-xs bg-white/90 hover:bg-white text-gray-900 rounded-xl shadow-md border-0 gap-1 backdrop-blur-xs font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-orange" /> Tour 360°
                  </a>
                )}
              </div>

              {/* Especificaciones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Área</span>
                  <div className="font-bold text-gray-800 text-sm">{selectedUnit.areaSqm} m²</div>
                </div>
                {selectedUnit.kind === "lot" ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Posición</span>
                    <div className="font-bold text-gray-800 text-sm">
                      {selectedUnit.lotPosition || "Medianera"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Dormitorios</span>
                      <div className="font-bold text-gray-800 text-sm">3 Dormitorios</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Baños</span>
                      <div className="font-bold text-gray-800 text-sm">1 Baño</div>
                    </div>
                  </>
                )}
              </div>

              {/* Formulario de Estado y Comprador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-gray-700">Estado Comercial</span>
                  </label>
                  <select
                    className="select select-bordered w-full text-sm bg-base-50 rounded-xl font-medium"
                    value={modalState}
                    onChange={(e) => setModalState(e.target.value as any)}
                  >
                    <option value="AVAILABLE">🟢 Disponible</option>
                    <option value="RESERVED">🟡 Reservado</option>
                    <option value="SOLD">🔴 Vendido</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-gray-700">
                      Nombre del Comprador / Propietario
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    className="input input-bordered w-full text-sm bg-base-50 rounded-xl"
                    value={modalBuyerName}
                    onChange={(e) => setModalBuyerName(e.target.value)}
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="modal-action mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="btn btn-ghost rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 rounded-xl px-6 font-bold shadow-md"
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={closeDetailModal}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
