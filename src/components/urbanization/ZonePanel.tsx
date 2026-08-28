"use client";

// ============================================================================
// PANEL DE LA ZONA — "Vistas" y "Filtros"
// ----------------------------------------------------------------------------
// Un solo cajón a la derecha de la toma, con dos pestañas:
//
//   VISTAS  → la foto de lo que se ve desde el punto marcado en el mapa. Los
//             marcadores del mapa y los números del panel son lo mismo visto
//             desde los dos lados: pulsar un marcador cambia la foto, y elegir
//             una foto resalta su marcador.
//   FILTROS → área, posición y disponibilidad de los terrenos. Los que encajan
//             se resaltan sobre la toma. Solo aparece donde hay terrenos que
//             filtrar (Zonas 1 y 2); en la Zona 3, que es la de las torres, la
//             pestaña ni se pinta.
//
// El panel no decide nada: recibe la selección y la devuelve. Quién resalta qué
// sobre la imagen es cosa de la zona, que es la que tiene los polígonos.
// ============================================================================

import { useMemo, useState } from 'react';
import { Camera, ImageOff, ListFilter, RotateCcw, SunMoon } from 'lucide-react';

import { getAssetUrl } from '@/utils/assets';
import { LotPosition, LotPositionLabel, UnitStatus, UnitStatusLabel } from '@/data/urbanization/enums';
import type { LotBlock, LotFilter } from '@/data/urbanization/lots';
import type { Unit, Viewpoint } from '@/data/urbanization/types';

export type ZonePanelTab = 'views' | 'filters';

const TAB_LABEL: Record<ZonePanelTab, string> = {
  views: 'Vistas',
  filters: 'Filtros',
};

const POSITION_ORDER = [LotPosition.CORNER, LotPosition.MIDDLE];
const STATUS_ORDER = [UnitStatus.AVAILABLE, UnitStatus.RESERVED, UnitStatus.SOLD];

/** Punto de color de cada estado, para que la lista se lea de un vistazo. */
const STATUS_DOT: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: 'bg-emerald-400',
  [UnitStatus.RESERVED]: 'bg-amber-400',
  [UnitStatus.SOLD]: 'bg-rose-400',
};

// ---------------------------------------------------------------------------
// Piezas sueltas
// ---------------------------------------------------------------------------

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
      active
        ? 'bg-brand-orange border-brand-orange text-white shadow-md'
        : 'bg-white/5 border-white/15 text-white/75 hover:text-white hover:bg-white/10'
    }`}
  >
    {children}
  </button>
);

const FacetTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold mb-2.5">
    {children}
  </h4>
);

const PendingNote = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] leading-relaxed text-white/45 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
    {children}
  </p>
);

// ---------------------------------------------------------------------------
// Pestaña "Vistas"
// ---------------------------------------------------------------------------
// Las cuatro vistas se enseñan a la vez, una debajo de otra. La elegida se ve
// nítida y las otras tres quedan apagadas y desenfocadas.
//
// Se ven las cuatro y no solo la elegida a propósito: con una sola foto y una
// fila de números, el visitante no sabe qué le espera detrás de cada número y
// tiene que ir probando. Con las cuatro delante, elegir es mirar.
//
// El desenfoque no oculta nada —la foto apagada sigue siendo reconocible— así
// que sirve de índice y de resalte al mismo tiempo.

const ViewCard = ({
  point,
  isActive,
  onSelect,
  onOpenCompare,
}: {
  point: Viewpoint;
  isActive: boolean;
  onSelect: () => void;
  onOpenCompare: () => void;
}) => {
  // La foto puede no estar todavía en el bucket. En vez de dejar el icono de
  // imagen rota del navegador, el hueco se rotula: se ve que el punto existe y
  // que lo que falta es el archivo.
  const [failed, setFailed] = useState(false);

  // La toma de noche solo existe si el cliente la entregó. Sin ella no hay nada
  // que comparar y la tarjeta se queda como estaba: solo selecciona.
  const canCompare = Boolean(point.image && point.imageNight) && !failed;

  /**
   * La primera pulsación ELIGE el punto; la segunda, ya estando elegido, abre
   * la comparación. Así se puede recorrer las cuatro vistas del panel sin que
   * cada clic plante un comparador a pantalla completa por delante, y a la vez
   * "pulsar la imagen" acaba llevando a las dos tomas, que es lo que se pide.
   * La pastilla de la esquina lo cuenta, que si no no habría manera de saberlo.
   */
  const handleClick = () => {
    if (isActive && canCompare) {
      onOpenCompare();
      return;
    }
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isActive}
      className={`relative flex-1 min-h-20 short:min-h-9 w-full rounded-xl overflow-hidden border text-left transition-all duration-300 cursor-pointer ${
        isActive
          ? 'border-brand-orange ring-2 ring-brand-orange/45 shadow-lg'
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      {point.image && !failed ? (
        <img
          src={getAssetUrl(point.image)}
          alt={point.caption ?? point.label ?? 'Vista'}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
            isActive ? '' : 'blur-[2px] brightness-[0.45] scale-105'
          }`}
        />
      ) : (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 transition-all duration-300 ${
            isActive ? 'text-white/40' : 'text-white/20 blur-[2px] brightness-[0.55]'
          }`}
        >
          <ImageOff size={18} strokeWidth={1.5} />
          <p className="text-[9px] uppercase tracking-[0.18em] font-semibold">Vista pendiente</p>
        </div>
      )}

      {/* Velo extra sobre las apagadas: el desenfoque solo no basta con una foto clara. */}
      {!isActive && <span className="absolute inset-0 bg-neutral-950/35" />}

      <span
        className={`absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-[10px] font-bold tracking-wide transition-colors duration-300 ${
          isActive
            ? 'bg-brand-orange border-white/40 text-white'
            : 'bg-black/55 border-white/15 text-white/70'
        }`}
      >
        <Camera size={11} strokeWidth={2.5} />
        {point.label}
      </span>

      {isActive && canCompare && (
        <span className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[9px] uppercase tracking-[0.16em] font-bold">
          <SunMoon size={11} strokeWidth={2.5} />
          Día / Noche
        </span>
      )}
    </button>
  );
};

const ViewsTab = ({
  viewpoints,
  activeId,
  onSelect,
  onOpenCompare,
}: {
  viewpoints: Viewpoint[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onOpenCompare: (point: Viewpoint) => void;
}) => {
  const active = useMemo(
    () => viewpoints.find((point) => point.id === activeId) ?? viewpoints[0] ?? null,
    [viewpoints, activeId],
  );

  if (viewpoints.length === 0) {
    return <PendingNote>Esta zona todavía no tiene puntos de vista marcados.</PendingNote>;
  }

  return (
    <div className="min-h-full flex flex-col gap-2 short:gap-1.5">
      {viewpoints.map((point) => (
        <ViewCard
          key={point.id}
          point={point}
          isActive={point.id === active?.id}
          onSelect={() => onSelect(point.id)}
          onOpenCompare={() => onOpenCompare(point)}
        />
      ))}

      <p className="shrink-0 text-[10px] short:text-[9px] leading-relaxed text-white/35 text-center">
        Pulsa un punto del mapa —el círculo con el abanico— o una foto de aquí.{' '}
        <span className="short:hidden">
          Vuelve a pulsar la elegida para verla de día y de noche.
        </span>
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pestaña "Filtros"
// ---------------------------------------------------------------------------

const FiltersTab = ({
  blocks = [],
  lots,
  matches,
  filter,
  areaOptions,
  hasPositionInventory,
  unmappedCount,
  onChange,
  onReset,
  onHoverLot,
  onSelectLot,
}: {
  blocks?: LotBlock[];
  lots: Unit[];
  matches: Unit[];
  filter: LotFilter;
  areaOptions: number[];
  hasPositionInventory: boolean;
  /** Cuántos de los que encajan no tienen recorte y no se pueden resaltar. */
  unmappedCount: number;
  onChange: (next: LotFilter) => void;
  onReset: () => void;
  onHoverLot: (id: string | null) => void;
  onSelectLot: (lot: Unit) => void;
}) => {
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const isActive =
    filter.blockIds.length > 0 ||
    filter.areas.length > 0 ||
    filter.positions.length > 0 ||
    filter.statuses.length > 0;

  return (
    <div className="space-y-4 lg:space-y-5">
      {blocks.length > 0 && (
        <div>
          <FacetTitle>Manzana</FacetTitle>
          <div className="flex flex-wrap gap-1.5">
            {blocks.map((block) => (
              <Chip
                key={block.id}
                active={filter.blockIds.includes(block.id)}
                onClick={() =>
                  onChange({ ...filter, blockIds: toggle(filter.blockIds, block.id) })
                }
              >
                Mz {block.letter}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <FacetTitle>Área</FacetTitle>
        {areaOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {areaOptions.map((area) => (
              <Chip
                key={area}
                active={filter.areas.includes(area)}
                onClick={() => onChange({ ...filter, areas: toggle(filter.areas, area) })}
              >
                {area.toLocaleString('es-PE')} m²
              </Chip>
            ))}
          </div>
        ) : (
          <PendingNote>
            Sin áreas en el inventario todavía. En cuanto lleguen las medidas del plano de
            manzaneo, cada valor aparece aquí como una opción.
          </PendingNote>
        )}
      </div>

      <div>
        <FacetTitle>Posición</FacetTitle>
        <div className="flex flex-wrap gap-1.5">
          {POSITION_ORDER.map((position) => (
            <Chip
              key={position}
              active={filter.positions.includes(position)}
              onClick={() =>
                onChange({ ...filter, positions: toggle(filter.positions, position) })
              }
            >
              {LotPositionLabel[position]}
            </Chip>
          ))}
        </div>
        {!hasPositionInventory && (
          <p className="mt-2 text-[10px] leading-relaxed text-white/35">
            Ningún terreno tiene la posición declarada, así que estos dos filtros no devuelven
            nada todavía.
          </p>
        )}
      </div>

      <div>
        <FacetTitle>Disponibilidad</FacetTitle>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((status) => (
            <Chip
              key={status}
              active={filter.statuses.includes(status)}
              onClick={() => onChange({ ...filter, statuses: toggle(filter.statuses, status) })}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                {UnitStatusLabel[status]}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
        <p className="text-[11px] text-white/60">
          <strong className="text-brand-orange font-bold">{matches.length}</strong> de {lots.length}{' '}
          {lots.length === 1 ? 'terreno' : 'terrenos'}
        </p>
        <button
          type="button"
          onClick={onReset}
          disabled={!isActive}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 text-[10px] uppercase tracking-[0.14em] font-semibold text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <RotateCcw size={11} /> Limpiar
        </button>
      </div>

      {isActive && unmappedCount > 0 && (
        <PendingNote>
          {unmappedCount} {unmappedCount === 1 ? 'coincide' : 'coinciden'} pero{' '}
          {unmappedCount === 1 ? 'no tiene' : 'no tienen'} recorte medido sobre esta toma, así que
          solo {unmappedCount === 1 ? 'aparece' : 'aparecen'} en la lista.
        </PendingNote>
      )}

      {isActive && (
        <div className="max-h-64 lg:max-h-72 overflow-y-auto -mx-1 px-1 space-y-1.5">
          {matches.map((lot) => (
            <button
              key={lot.id}
              type="button"
              onMouseEnter={() => onHoverLot(lot.id)}
              onMouseLeave={() => onHoverLot(null)}
              onClick={() => onSelectLot(lot)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-white/85">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[lot.status]}`} />
                {lot.identifier}
              </span>
              <span className="text-[11px] text-white/40">
                {lot.areaSqm !== undefined ? `${lot.areaSqm} m²` : '—'}
              </span>
            </button>
          ))}
          {matches.length === 0 && (
            <PendingNote>Ningún terreno encaja con esta selección.</PendingNote>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// El cajón
// ---------------------------------------------------------------------------

export interface ZonePanelProps {
  zoneLabel: string;
  viewpoints: Viewpoint[];
  activeViewpointId: string | null;
  onSelectViewpoint: (id: string) => void;
  onOpenViewpointCompare: (point: Viewpoint) => void;
  /** Si es `false`, la pestaña de filtros no existe (zonas sin terrenos). */
  showFilters: boolean;
  blocks?: LotBlock[];
  lots: Unit[];
  matches: Unit[];
  filter: LotFilter;
  areaOptions: number[];
  hasPositionInventory: boolean;
  unmappedCount: number;
  onFilterChange: (next: LotFilter) => void;
  onFilterReset: () => void;
  onHoverLot: (id: string | null) => void;
  onSelectLot: (lot: Unit) => void;
  activeTab: ZonePanelTab;
  onTabChange: (tab: ZonePanelTab) => void;
  /**
   * Ancho del cajón, como valor CSS. Lo manda la zona y no se decide aquí: es
   * el mismo hueco que la toma deja libre, y dos sitios distintos declarando la
   * misma medida acaban descuadrados.
   */
  width: string;
}

const ZonePanel = ({
  zoneLabel,
  viewpoints,
  activeViewpointId,
  onSelectViewpoint,
  onOpenViewpointCompare,
  showFilters,
  blocks,
  lots,
  matches,
  filter,
  areaOptions,
  hasPositionInventory,
  unmappedCount,
  onFilterChange,
  onFilterReset,
  onHoverLot,
  onSelectLot,
  activeTab,
  onTabChange,
  width,
}: ZonePanelProps) => {
  const tabs: ZonePanelTab[] = showFilters ? ['views', 'filters'] : ['views'];
  const tab = tabs.includes(activeTab) ? activeTab : 'views';

  return (
    <aside
      style={{ width }}
      className="absolute right-0 top-0 z-30 h-full flex flex-col bg-neutral-950/85 backdrop-blur-2xl border-l border-white/10 shadow-2xl"
    >
      {/*
        Sin botón de cerrar: el panel es parte de la pantalla de la zona, no un
        cajón que se asoma. Que esté siempre puesto es lo que hace que la toma
        tenga un encuadre fijo —y por tanto que una coordenada medida sobre ella
        valga siempre—; si se pudiera plegar, el encuadre cambiaría con él y los
        recortes bailarían al abrirlo y cerrarlo.
      */}
      <header className="shrink-0 px-5 pt-4 pb-3 short:pt-2.5 short:pb-2 border-b border-white/10">
        <p className="text-[9px] uppercase tracking-[0.22em] text-white/40 font-bold">
          {zoneLabel}
        </p>
        <h3 className="text-white font-primary text-sm uppercase tracking-[0.14em] font-bold">
          {TAB_LABEL[tab]}
        </h3>
      </header>

      {tabs.length > 1 && (
        <div className="shrink-0 grid grid-cols-2 gap-1 m-3.5 short:m-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {tabs.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`py-2 short:py-1.5 rounded-lg text-xs font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                tab === id
                  ? 'bg-brand-primary text-white shadow'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {id === 'views' ? <Camera size={13} /> : <ListFilter size={13} />}
              {TAB_LABEL[id]}
            </button>
          ))}
        </div>
      )}

      {/*
        `min-h-0` es lo que permite que las cuatro fotos se repartan el alto
        sobrante: sin él, un hijo flexible no baja de su tamaño de contenido y
        la columna se desborda en lugar de encogerse.

        Y se desplaza en las dos pestañas, no solo en Filtros. Con
        `overflow-hidden` lo que no cabía no se recortaba a medias: desaparecía
        sin dejar rastro —en el marco girado la cuarta vista quedaba 158px por
        debajo del corte, invisible e inalcanzable—. Que las cuatro quepan lo
        arreglan los `short:` de arriba; esto es el seguro para la pantalla que
        se quede aún más corta.
      */}
      <div className={`flex-1 min-h-0 overflow-y-auto px-4 pb-4 ${tabs.length > 1 ? '' : 'pt-3'}`}>
        {tab === 'views' ? (
          <ViewsTab
            viewpoints={viewpoints}
            activeId={activeViewpointId}
            onSelect={onSelectViewpoint}
            onOpenCompare={onOpenViewpointCompare}
          />
        ) : (
          <FiltersTab
            blocks={blocks}
            lots={lots}
            matches={matches}
            filter={filter}
            areaOptions={areaOptions}
            hasPositionInventory={hasPositionInventory}
            unmappedCount={unmappedCount}
            onChange={onFilterChange}
            onReset={onFilterReset}
            onHoverLot={onHoverLot}
            onSelectLot={onSelectLot}
          />
        )}
      </div>
    </aside>
  );
};

export default ZonePanel;
