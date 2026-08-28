"use client";

// ============================================================================
// URBANIZACIÓN — la pantalla que en Océano era "El edificio"
// ----------------------------------------------------------------------------
// Misma ruta de siempre (/showroom), y todo el recorrido dentro de ella: son
// pasos de UNA pantalla, no rutas distintas. El paso activo se guarda como un
// `NavigationStep`, el mismo enum con el que se etiquetan las analíticas.
//
//   INTRO      → portada con el video en bucle.
//   SIDES      → los 4 lados, giro cíclico. "Ingresar al proyecto" ↓
//   PHASES     → Master Plan: la urbanización entera. Se elige fase. ↓
//   ZONES      → la toma de la fase entera. Se elige zona. ↓
//   ZONE_VIEW  → la toma de la zona, con chevrons a las contiguas. ↓
//   TOWER      → la toma ABC: se elige torre (+ video de acercamiento). ↓
//   FLOOR      → la planta, con sus departamentos.
//
// LA REGLA DE LA VUELTA ATRÁS: cada paso vuelve al ANTERIOR de esa lista, sin
// atajos. Antes la toma de fases era un modo escondido dentro de SIDES, así
// que volver desde una fase aterrizaba en el giro 360 y se saltaba el Master
// Plan entero; por eso ahora es su propio paso.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowLeft,
  ArrowRight,
  Lock,
  Compass,
  Layers,
  Map,
  Building2,
  Ruler,
  Bed,
  Bath,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import Loader from '@/components/UI/Loader';
import FitStage, { StageProvider } from '@/components/urbanization/FitStage';
import ViewpointMarker from '@/components/urbanization/ViewpointMarker';
import ZonePanel, { type ZonePanelTab } from '@/components/urbanization/ZonePanel';
import ViewpointCompare from '@/components/urbanization/ViewpointCompare';
import ModuloFicha from '@/components/urbanization/ModuloFicha';
import DepartamentoFicha from '@/components/urbanization/DepartamentoFicha';
import RequestInfoModal from '@/components/modals/RequestInfoModal';
import { getAssetUrl } from '@/utils/assets';
import { preloadImages } from '@/utils/preload';
import {
  LateralDirection,
  LotModuleId,
  LotModuleLabel,
  LotPositionLabel,
  NavigationStep,
  NavigationStepLabel,
  PanDirection,
  PhaseId,
  PhaseLabel,
  PhaseStatus,
  ProductKind,
  SideId,
  SideLabel,
  TowerId,
  TowerLabel,
  UnitStatus,
  UnitStatusLabel,
  ZoneLabel,
} from '@/data/urbanization/enums';
import { phases } from '@/data/urbanization/phases';
import { sides, side0, entrySideId } from '@/data/urbanization/sides';
import {
  findFloorByLevel,
  getAvailableDirections,
  getAvailableTowerDirections,
  getEntryZone,
  getNeighborSide,
  getNeighborZone,
  getSideTransitionVideo,
  resolveTowerEntry,
  resolveTowerSwitch,
  sortFloorsDescending,
  sortPhases,
  sortTowers,
} from '@/data/urbanization/navigation';
import {
  lotModuleImage,
  masterPlanImage,
  phaseEntryVideo,
  towersEntryTransitionVideo,
  towersOverviewImage,
  zoneEntryVideo,
  zoneExitVideo,
  zoneTransitionVideo,
} from '@/data/urbanization/assets';
import { floorTitle, towers } from '@/data/urbanization/towers';
import {
  blockLabel,
  blocksOfZone,
  clickableLotsOfZone,
  EMPTY_LOT_FILTER,
  hasLotPositionInventory,
  isLotFilterActive,
  lotAreaOptions,
  lotsOfZone,
  matchesLotFilter,
  type LotFilter,
} from '@/data/urbanization/lots';
import { viewpointHeading, viewpointsOfZone } from '@/data/urbanization/viewpoints';
import type { Phase, Side, Tower, Unit, Zone, ZoneCoords } from '@/data/urbanization/types';
import config from "@/config/config";

/**
 * Proporción de las tomas de zona (3840 × 2160). Solo se usa para enderezar el
 * ángulo del abanico de los puntos de vista: las coordenadas viven en un
 * espacio 0–100 que NO es cuadrado, así que un vector medido ahí apunta a un
 * ángulo distinto del que se ve en pantalla si no se corrige.
 */
const ZONE_IMAGE_RATIO = 16 / 9;

/**
 * Lo que ocupa el panel de la zona: cerca de un tercio de la pantalla, que es
 * el sitio que pidió el cliente y el que necesitan las cuatro fotos para leerse.
 *
 * El panel va ENCIMA de la toma, no al lado. La toma tapa la ventana entera y
 * el panel se posa sobre su franja derecha, que en los tres renders es el
 * relleno del terreno: nada de lo medido sobre las tomas —lotes, manzanas,
 * puntos de vista— pasa del 64 % de ancho, así que debajo del panel no queda
 * nada que se pueda pulsar.
 *
 * Antes la toma se encogía hasta este ancho, y al ser un recorte que cubre, lo
 * que perdía no era el trozo tapado sino un 15 % por CADA lado: el cerro y la
 * cancha de la izquierda se iban de cuadro para dejar sitio a un panel que no
 * los tapaba.
 *
 * La medida se sigue declarando aquí y pasándose al panel en vez de repetirla
 * en su hoja de estilos, porque los mandos —los chevrons— sí se recogen hasta
 * este borde: en cuanto los dos números dejan de coincidir el panel se come el
 * chevron de la derecha (que es justo lo que llegó a pasar).
 *
 * Los topes son de legibilidad, no de estética: por debajo de 300 px las fotos
 * no se distinguen y por encima de 560 el panel le quita sitio al plano.
 */
const ZONE_PANEL_WIDTH = 'clamp(300px, 30%, 560px)';

const CHEVRON = {
  [PanDirection.UP]: { Icon: ChevronUp, label: 'Desplazar hacia arriba', pos: 'top-6 left-1/2 -translate-x-1/2' },
  [PanDirection.DOWN]: { Icon: ChevronDown, label: 'Desplazar hacia abajo', pos: 'bottom-24 left-1/2 -translate-x-1/2' },
  [PanDirection.LEFT]: { Icon: ChevronLeft, label: 'Desplazar hacia la izquierda', pos: 'left-6 top-1/2 -translate-y-1/2' },
  [PanDirection.RIGHT]: { Icon: ChevronRight, label: 'Desplazar hacia la derecha', pos: 'right-6 top-1/2 -translate-y-1/2' },
} as const;

const KEY_TO_DIRECTION: Record<string, PanDirection> = {
  ArrowUp: PanDirection.UP,
  ArrowDown: PanDirection.DOWN,
  ArrowLeft: PanDirection.LEFT,
  ArrowRight: PanDirection.RIGHT,
};

// ---------------------------------------------------------------------------
// Paso 0 — Portada del Showroom (Cara 0)
// ---------------------------------------------------------------------------
// Tres piezas encadenadas, cada una releva a la siguiente en el fotograma en
// el que son idénticas, así que no se ve ni un corte:
//
//   0.3.jpg (respaldo)  →  0.1.mp4 (entrada, una vez)  →  0.2.mp4 (bucle)
//                                                             ↓ "Ingresar"
//                                                        0-1.mp4 → Lado 1
//
// La imagen se queda debajo de todo: si los videos no cargan, la portada
// sigue siendo la misma toma y el botón funciona igual.

const Cara0Step = ({ onEnterSides }: { onEnterSides: () => void }) => {
  const [hasIntroEnded, setHasIntroEnded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loopVideoRef = useRef<HTMLVideoElement | null>(null);

  const posterUrl = useMemo(() => getAssetUrl(side0.day.background ?? ''), []);
  const introVideoUrl = useMemo(() => getAssetUrl(side0.day.introVideo ?? ''), []);
  const loopVideoUrl = useMemo(() => getAssetUrl(side0.day.backgroundVideo ?? ''), []);
  const transitionVideoUrl = useMemo(
    () => getAssetUrl(side0.day.transitions.toRight ?? ''),
    [],
  );

  // El relevo lo manda ÚNICAMENTE el final de la entrada, no que el bucle
  // avise de que ya puede pintar. Esperar a su `canplay` parecía más prolijo
  // pero es una trampa: cuando el bucle ya está en la caché del navegador ese
  // evento se dispara antes de que React enganche el manejador, no llega
  // nunca, y la portada se queda clavada en el último fotograma de la entrada.
  // Si al relevo el bucle aún no tuviera imagen, asoma el respaldo —que es la
  // misma toma congelada— y se resuelve solo al acabar de cargar.
  const isLoopVisible = !introVideoUrl || hasIntroEnded;
  const isIntroVisible = Boolean(introVideoUrl) && !hasIntroEnded;

  const handleStartEnter = useCallback(() => {
    if (isTransitioning) return;
    if (transitionVideoUrl) {
      setIsTransitioning(true);
    } else {
      onEnterSides();
    }
  }, [isTransitioning, transitionVideoUrl, onEnterSides]);

  // El bucle se queda quieto en su primer fotograma mientras corre la entrada
  // y arranca justo al relevo. Si se dejara en `autoPlay` iría por libre: la
  // entrada dura más que el bucle, así que al terminar lo encontraría a mitad
  // de vuelta y el empalme —que es el mismo fotograma— se perdería.
  useEffect(() => {
    if (!isLoopVisible) return;
    loopVideoRef.current?.play().catch(() => {});
  }, [isLoopVisible]);

  // Precargar assets de Cara 1
  useEffect(() => {
    const side1 = sides.find((s) => s.id === SideId.SIDE_1);
    if (side1) {
      preloadImages([getAssetUrl(side1.day.background)]).catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950">
      {/* 1. Respaldo fijo (0.3.jpg): se ve mientras cargan los videos */}
      <img
        src={posterUrl}
        alt="Portada El Olimpo de Tumbes"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.visibility = 'hidden';
        }}
      />

      {/* 2. Video de entrada (0.1.mp4): se reproduce UNA vez al llegar */}
      {!isTransitioning && introVideoUrl && (
        <video
          src={introVideoUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={() => setHasIntroEnded(true)}
          // Si la entrada no carga, se pasa directo al bucle en vez de
          // dejar la portada congelada en el respaldo.
          onError={() => setHasIntroEnded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isIntroVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Video en bucle (0.2.mp4): arranca donde termina la entrada.
          Se monta desde el principio para que llegue cargado al relevo. */}
      {!isTransitioning && loopVideoUrl && (
        <video
          ref={loopVideoRef}
          src={loopVideoUrl}
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isLoopVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Video Transición 0 -> 1 (0-1.mp4) al hacer clic en Ingresar */}
      {isTransitioning && transitionVideoUrl && (
        <video
          src={transitionVideoUrl}
          autoPlay
          playsInline
          muted
          preload="auto"
          onCanPlay={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          onEnded={onEnterSides}
          onError={onEnterSides}
          className="absolute inset-0 w-full h-full object-cover z-30"
        />
      )}

      {/* Interfaz de usuario de la Portada (Bloque de Marca a la Derecha) */}
      {!isTransitioning && (
        <div className="absolute right-[6%] sm:right-[10%] lg:right-[14%] top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-6 lg:gap-8 max-w-xs sm:max-w-md lg:max-w-xl animate-in fade-in slide-in-from-right duration-700">
          <img
            src={config.logos.project}
            alt={config.appName}
            className="w-72 sm:w-[416px] lg:w-[500px] object-contain drop-shadow-2xl opacity-95"
          />

          <button
            onClick={handleStartEnter}
            className="group flex items-center justify-center gap-4 w-full max-w-[260px] sm:max-w-[320px] px-8 py-3.5 sm:py-4 bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/30 text-brand-orange text-xs sm:text-sm lg:text-base font-primary uppercase tracking-[0.25em] font-semibold transition-all duration-300 hover:scale-105 cursor-pointer shadow-2xl"
          >
            <ArrowLeft size={18} className="text-brand-orange transition-transform duration-300 group-hover:-translate-x-1.5" />
            <span>INGRESAR</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rótulos clicables sobre una toma amplia
// ---------------------------------------------------------------------------
// El mismo gesto se repite dos veces en el recorrido: sobre el Master Plan se
// elige fase, y sobre la toma de la fase se elige zona. Cambia el dato, no la
// pieza, así que las dos listas de rótulos comparten este componente.

const Hotspot = ({
  x,
  y,
  label,
  caption,
  Icon,
  disabled = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  caption: string;
  Icon?: typeof Building2;
  disabled?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onClick()}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{ left: `${x}%`, top: `${y}%` }}
    className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 group ${
      disabled ? 'cursor-not-allowed' : 'cursor-pointer'
    }`}
  >
    <span
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md border text-[10px] lg:text-xs uppercase tracking-[0.18em] font-bold transition-all duration-300 ${
        disabled
          ? 'bg-black/55 border-white/15 text-white/60'
          : isHovered
          ? 'bg-brand-primary border-white/40 text-white shadow-2xl scale-110'
          : 'bg-brand-primary/85 border-white/30 text-white shadow-2xl group-hover:scale-110 group-hover:bg-brand-primary'
      }`}
    >
      {disabled ? <Lock size={12} strokeWidth={2} /> : Icon && <Icon size={13} strokeWidth={2} />}
      {label}
    </span>

    {/*
      Pulso que delata que el rótulo es clicable. Va a 3 s en vez del 1 s que
      trae `animate-ping` de fábrica: sobre una toma cenital quieta, y con
      varios rótulos latiendo a la vez, el ritmo original parpadea y compite
      con la imagen en lugar de acompañarla.
    */}
    {!disabled && (
      <span className="absolute inset-0 -z-10 rounded-full bg-brand-primary/40 animate-ping [animation-duration:3s]" />
    )}

    <span
      className={`mt-1.5 block text-[9px] uppercase tracking-[0.2em] font-semibold ${
        disabled ? 'text-white/50' : 'text-white/85 drop-shadow'
      }`}
    >
      {caption}
    </span>
  </button>
);

// ---------------------------------------------------------------------------
// Paso 1 — Lados: tomas aéreas con giro cíclico
// ---------------------------------------------------------------------------
// Solo el giro. La toma con todas las fases vive en su propio paso (el Master
// Plan) y no como un modo escondido dentro de este: era lo que hacía que al
// volver desde una fase se aterrizara en el giro 360 en lugar de en el Master
// Plan, saltándose un nivel entero del recorrido.

const CarasStep = ({
  onEnterProject,
  onBackToCara0,
}: {
  onEnterProject: () => void;
  onBackToCara0?: () => void;
}) => {
  const [currentSideId, setCurrentSideId] = useState<SideId>(entrySideId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionVideoUrl, setTransitionVideoUrl] = useState<string | null>(null);
  const [targetSideId, setTargetSideId] = useState<SideId | null>(null);
  // El mismo <video> sirve para el giro y para la subida al Master Plan; esto
  // distingue qué hacer cuando termine.
  const [isEnteringProject, setIsEnteringProject] = useState(false);

  const currentSide = useMemo(
    () => sides.find((s) => s.id === currentSideId) ?? sides[0],
    [currentSideId],
  );

  // Al subir al Master Plan la interfaz se aparta: la toma se abre hasta la
  // urbanización entera y los chevrons de giro ya no vienen a cuento. En el
  // giro entre lados sí se queda, que es un movimiento corto y se vuelve.
  const chromeClass = isEnteringProject
    ? 'opacity-0 pointer-events-none transition-opacity duration-500'
    : 'opacity-100 transition-opacity duration-500';

  const rotate = useCallback(
    (direction: LateralDirection) => {
      if (isTransitioning) return;

      const neighbor = getNeighborSide(sides, currentSideId, direction);
      if (!neighbor) return;

      const transitionRelPath = getSideTransitionVideo(currentSide, direction, 'day');
      const transitionUrl = transitionRelPath ? getAssetUrl(transitionRelPath) : '';

      if (transitionUrl) {
        setTargetSideId(neighbor.id);
        setTransitionVideoUrl(transitionUrl);
        setIsTransitioning(true);
      } else {
        setCurrentSideId(neighbor.id);
      }
    },
    [currentSide, currentSideId, isTransitioning],
  );

  const finishTransition = useCallback(() => {
    // La subida al Master Plan no vuelve aquí: se cede el paso y ya. No se
    // limpia el estado para que el último fotograma —que es el Master Plan—
    // siga en pantalla mientras monta el paso siguiente.
    if (isEnteringProject) {
      onEnterProject();
      return;
    }
    if (targetSideId) {
      setCurrentSideId(targetSideId);
    }
    setIsTransitioning(false);
    setTransitionVideoUrl(null);
    setTargetSideId(null);
  }, [isEnteringProject, onEnterProject, targetSideId]);

  /**
   * "Ingresar al proyecto": sube desde el lado que se está mirando hasta el
   * Master Plan (`O1-MP.mp4` … `O4-MP.mp4`). Hay un video por lado, así que se
   * entra desde donde uno esté sin tener que volver antes al Lado 1.
   */
  const enterProject = useCallback(() => {
    if (isTransitioning) return;

    const enterRelPath = currentSide.day.enterVideo;
    const enterUrl = enterRelPath ? getAssetUrl(enterRelPath) : '';

    if (enterUrl) {
      setIsEnteringProject(true);
      setTransitionVideoUrl(enterUrl);
      setIsTransitioning(true);
    } else {
      onEnterProject();
    }
  }, [currentSide, isTransitioning, onEnterProject]);

  // Precargar las imágenes de los lados vecinos y el Master Plan
  useEffect(() => {
    const leftNeighbor = getNeighborSide(sides, currentSideId, LateralDirection.LEFT);
    const rightNeighbor = getNeighborSide(sides, currentSideId, LateralDirection.RIGHT);
    const urls = [
      getAssetUrl(masterPlanImage),
      leftNeighbor ? getAssetUrl(leftNeighbor.day.background) : null,
      rightNeighbor ? getAssetUrl(rightNeighbor.day.background) : null,
    ].filter((u): u is string => Boolean(u));

    preloadImages(urls).catch(() => {});
  }, [currentSideId]);

  // Teclado para el giro entre lados (flecha izquierda / derecha)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        rotate(LateralDirection.LEFT);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        rotate(LateralDirection.RIGHT);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rotate]);

  return (
    <>
      {/* Imagen de fondo del lado activo */}
      <img
        key={currentSide.id}
        src={getAssetUrl(currentSide.day.background)}
        alt={SideLabel[currentSide.id] ?? currentSide.id}
        className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-700"
        onError={(e) => {
          e.currentTarget.src = getAssetUrl(masterPlanImage);
        }}
      />
      {/* Video de transición durante el giro entre lados */}
      {isTransitioning && transitionVideoUrl && (
        <video
          key={transitionVideoUrl}
          src={transitionVideoUrl}
          autoPlay
          playsInline
          muted
          preload="auto"
          onCanPlay={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          onEnded={finishTransition}
          onError={(e) => {
            console.error('Error al reproducir video de transición:', transitionVideoUrl, e);
            finishTransition();
          }}
          className="absolute inset-0 w-full h-full object-cover z-30 animate-in fade-in duration-300"
        />
      )}

      {/* Chevrons flotantes de giro cíclico (Izquierda / Derecha) */}
      <button
        type="button"
        onClick={() => rotate(LateralDirection.LEFT)}
        aria-label="Girar hacia la izquierda"
        disabled={isTransitioning}
        className={`absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:bg-black/60 hover:scale-110 cursor-pointer disabled:opacity-50 ${chromeClass}`}
      >
        <ChevronLeft size={24} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => rotate(LateralDirection.RIGHT)}
        aria-label="Girar hacia la derecha"
        disabled={isTransitioning}
        className={`absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:bg-black/60 hover:scale-110 cursor-pointer disabled:opacity-50 ${chromeClass}`}
      >
        <ChevronRight size={24} strokeWidth={1.75} />
      </button>

      {onBackToCara0 && (
        <button
          onClick={onBackToCara0}
          className={`absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer ${chromeClass}`}
        >
          <ArrowLeft size={13} /> {NavigationStepLabel[NavigationStep.INTRO]}
        </button>
      )}

      {/* Barra inferior con identificador del lado y CTA de ingreso */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 ${chromeClass}`}>
        <div className="px-5 py-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-center flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse [animation-duration:3s]" />
          <p className="text-white font-primary text-[11px] lg:text-xs uppercase tracking-[0.22em] font-bold">
            {SideLabel[currentSide.id] ?? currentSide.id}
          </p>
        </div>

        <button
          onClick={enterProject}
          disabled={isTransitioning}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-primary/90 hover:bg-brand-primary border border-white/30 text-white text-[11px] lg:text-xs uppercase tracking-[0.18em] font-bold shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
        >
          Ingresar al proyecto
        </button>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Paso 2 — Master Plan: la urbanización entera, se elige fase
// ---------------------------------------------------------------------------
// Es el centro del recorrido: de aquí se baja a una fase y de aquí se sale al
// giro 360. Todo lo que hay por debajo (fase, zona, torres) vuelve hasta aquí
// escalón a escalón.

const MasterPlanStep = ({
  onEnterPhase,
  onBackToSides,
}: {
  onEnterPhase: (phase: Phase) => void;
  onBackToSides: () => void;
}) => {
  const [hoveredPhaseId, setHoveredPhaseId] = useState<string | null>(null);

  // La fase navegable es la siguiente parada probable: su toma se precarga
  // para que el rótulo abra sin espera.
  useEffect(() => {
    const entryPhase = sortPhases(phases).find((p) => p.status === PhaseStatus.AVAILABLE);
    if (entryPhase) preloadImages([getAssetUrl(entryPhase.image)]).catch(() => {});
  }, []);

  return (
    <>
      <FitStage
        src={getAssetUrl(masterPlanImage)}
        alt={NavigationStepLabel[NavigationStep.PHASES]}
        imageClassName="animate-in fade-in duration-500"
      >
        {/* Recortes de cada fase sobre el Master Plan */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full z-10"
        >
          {sortPhases(phases).map((phase) => {
            if (!phase.hotspot?.path) return null;
            const isAvailable = phase.status === PhaseStatus.AVAILABLE;
            const isHovered = isAvailable && hoveredPhaseId === phase.id;

            return (
              <path
                key={phase.id}
                d={phase.hotspot.path}
                onClick={() => isAvailable && onEnterPhase(phase)}
                onMouseEnter={() => isAvailable && setHoveredPhaseId(phase.id)}
                onMouseLeave={() =>
                  isAvailable && setHoveredPhaseId((current) => (current === phase.id ? null : current))
                }
                className={`transition-colors duration-300 ${
                  isAvailable
                    ? isHovered
                      ? 'fill-brand-primary/30 stroke-white [stroke-width:0.08] cursor-pointer'
                      : 'fill-transparent stroke-transparent hover:fill-brand-primary/30 hover:stroke-white [stroke-width:0.08] cursor-pointer'
                    : 'fill-transparent stroke-transparent [stroke-width:0.06] cursor-not-allowed'
                }`}
              />
            );
          })}
        </svg>

        {sortPhases(phases).map((phase) => {
          if (!phase.hotspot) return null;
          const isAvailable = phase.status === PhaseStatus.AVAILABLE;

          return (
            <Hotspot
              key={phase.id}
              x={phase.hotspot.x}
              y={phase.hotspot.y}
              label={phase.label ?? PhaseLabel[phase.id]}
              caption={isAvailable ? 'Ingresar' : phase.comingSoonNote ?? 'Próximamente'}
              Icon={Layers}
              disabled={!isAvailable}
              isHovered={hoveredPhaseId === phase.id}
              onMouseEnter={() => isAvailable && setHoveredPhaseId(phase.id)}
              onMouseLeave={() =>
                isAvailable && setHoveredPhaseId((current) => (current === phase.id ? null : current))
              }
              onClick={() => onEnterPhase(phase)}
            />
          );
        })}
      </FitStage>

      <button
        onClick={onBackToSides}
        className="absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
      >
        <Compass size={13} /> {NavigationStepLabel[NavigationStep.SIDES]}
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-center">
        <p className="text-white/85 font-secondary text-[10px] lg:text-[11px] uppercase tracking-[0.2em]">
          Elige una fase para ingresar
        </p>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Paso 3 — Fase: la toma de la fase entera, se elige zona
// ---------------------------------------------------------------------------
// El escalón que faltaba. Antes se saltaba del Master Plan directo a la toma
// de una zona, así que el visitante nunca veía la fase completa ni entendía
// dónde caía la zona en la que aterrizaba.

const FaseStep = ({
  phase,
  onBack,
  onOpenZone,
}: {
  phase: Phase;
  onBack: () => void;
  onOpenZone: (zone: Zone) => void;
}) => {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Las tomas de las zonas son de pantalla completa: se precargan todas para
  // que el rótulo abra seco, que son tres.
  useEffect(() => {
    const urls = phase.zones.map((zone) => getAssetUrl(zone.image));
    if (urls.length > 0) preloadImages(urls).catch(() => {});
  }, [phase]);

  return (
    <>
      <FitStage
        imageKey={phase.id}
        src={getAssetUrl(phase.image)}
        alt={phase.label ?? PhaseLabel[phase.id]}
        imageClassName="animate-in fade-in duration-500"
      >
        {/* Recortes de cada zona sobre la toma de la fase */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full z-10"
        >
          {phase.zones.map((zone) => {
            if (!zone.hotspot?.path) return null;
            const isHovered = hoveredZoneId === zone.id;
            const highlightPaths =
              zone.hotspot.paths && zone.hotspot.paths.length > 0
                ? zone.hotspot.paths
                : [zone.hotspot.path];

            return (
              <g
                key={zone.id}
                onClick={() => onOpenZone(zone)}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() =>
                  setHoveredZoneId((current) => (current === zone.id ? null : current))
                }
                className="cursor-pointer"
              >
                {/* Área de interacción exterior */}
                <path d={zone.hotspot.path} className="fill-transparent stroke-transparent" />

                {/* Manzanas que se iluminan al pasar sobre la zona */}
                {highlightPaths.map((d, index) => (
                  <path
                    key={index}
                    d={d}
                    className={`transition-colors duration-300 pointer-events-none ${
                      isHovered
                        ? 'fill-brand-primary/30 stroke-white [stroke-width:0.08]'
                        : 'fill-transparent stroke-transparent [stroke-width:0.08]'
                    }`}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/*
          Un rótulo por zona con marcador declarado. Una zona sin marcador sigue
          siendo alcanzable con los chevrons desde una vecina: no se pierde, solo
          no tiene puerta propia desde aquí.
        */}
        {phase.zones.map((zone) =>
          zone.hotspot ? (
            <Hotspot
              key={zone.id}
              x={zone.hotspot.x}
              y={zone.hotspot.y}
              label={zone.label ?? ZoneLabel[zone.id]}
              caption="Ver zona"
              Icon={Map}
              isHovered={hoveredZoneId === zone.id}
              onMouseEnter={() => setHoveredZoneId(zone.id)}
              onMouseLeave={() =>
                setHoveredZoneId((current) => (current === zone.id ? null : current))
              }
              onClick={() => onOpenZone(zone)}
            />
          ) : null,
        )}
      </FitStage>

      <button
        onClick={onBack}
        className="absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
      >
        <ArrowLeft size={13} /> {NavigationStepLabel[NavigationStep.PHASES]}
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-center">
        <p className="text-white font-primary text-[11px] lg:text-sm uppercase tracking-[0.2em] font-bold">
          {phase.label ?? PhaseLabel[phase.id]}
        </p>
        <p className="text-white/70 font-secondary text-[9px] lg:text-[10px] uppercase tracking-[0.2em] mt-0.5">
          Elige una zona
        </p>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Paso 4 — Zona: la toma a pantalla completa, con chevrons a las contiguas
// ---------------------------------------------------------------------------
// La celda en la que está el visitante vive en la página, no aquí: así ir a
// las torres y volver devuelve a LA MISMA zona, y no a la de entrada.

// ---------------------------------------------------------------------------
// Ficha del terreno
// ---------------------------------------------------------------------------
// El render del lote a pantalla completa, con el panel de datos a la izquierda
// y los dos módulos a la derecha. Va como capa SOBRE la zona, no como paso
// aparte, para que al cerrarla el visitante siga en la misma zona y no lo
// devuelva al principio.
//
// La toma que se enseña es la ACOTADA —el render con las medidas rotuladas—,
// con el render limpio de respaldo mientras la acotada no esté subida. En un
// terreno las medidas son el dato: enseñar primero la versión sin ellas obliga
// a un clic para ver lo único que se ha venido a mirar.
//
// PENDIENTE: precio. Y las imágenes de los dos módulos (ver `LOT_MODULES`).

/**
 * Los dos módulos que se pueden colocar sobre el terreno.
 *
 * `overlays` no devuelve tomas sino CAPAS: PNG transparentes con la casa ya
 * dibujada donde le toca, que se apilan sobre el render limpio del lote. Cuál
 * de las cuatro versiones se apila lo decide `lot.lotFacing` —por dónde sale
 * el terreno a la calle—, porque la fachada tiene que dar a la calle y no al
 * vecino.
 *
 * MÓDULO 2 LLEVA LOS DOS. No es otra casa: es la AMPLIACIÓN de la primera, y
 * su recorte encaja exactamente en el hueco que deja el módulo 1. Enseñarla
 * sola dejaría media casa dibujada, así que la lista es acumulativa —el 1 va
 * debajo y el 2 encima— y por eso `overlays` devuelve una lista y no una clave.
 *
 * Sin orientación declarada no hay capa que apilar, así que el botón del
 * módulo se apaga en vez de plantar una casa mirando a cualquier parte.
 */
const LOT_MODULES: {
  id: LotModuleId;
  label: string;
  subtitle: string;
  areaSqm: number;
  overlays: (lot: Unit) => string[];
}[] = [
  {
    id: LotModuleId.ONE,
    label: 'Módulo 1',
    subtitle: 'Dos pisos · 50.16 m²',
    areaSqm: 50.16,
    overlays: (lot) =>
      lot.lotFacing ? [lotModuleImage(LotModuleId.ONE, lot.lotFacing)] : [],
  },
  {
    id: LotModuleId.TWO,
    label: 'Módulo 2',
    subtitle: 'Ampliación · 35.26 m²',
    areaSqm: 35.26,
    overlays: (lot) =>
      lot.lotFacing ? [lotModuleImage(LotModuleId.TWO, lot.lotFacing)] : [],
  },
];

/** Una fila del panel: etiqueta a la izquierda, dato a la derecha. */
const FichaRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-2.5 border-b border-white/10 last:border-b-0">
    <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-bold">{label}</span>
    <span
      className={`text-[12px] font-semibold text-right ${value ? 'text-white' : 'text-white/25'}`}
    >
      {value ?? '—'}
    </span>
  </div>
);

const LoteFicha = ({ lot, onClose }: { lot: Unit; onClose: () => void }) => {
  const [activeModule, setActiveModule] = useState<LotModuleId | null>(null);
  const [detailModuleId, setDetailModuleId] = useState<LotModuleId | null>(null);

  const activeModuleData = LOT_MODULES.find((item) => item.id === activeModule) ?? null;

  /**
   * El respaldo de imágenes: se anota QUÉ clave falló, y no un simple "falló",
   * para no volver a pedir al servidor una imagen que ya se sabe que no está
   * —y para que volver a la acotada después de un módulo no repita el intento.
   */
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(() => new Set());

  /**
   * La toma del fondo. Al abrir el terreno es la ACOTADA —las medidas son el
   * dato que se viene a mirar—; al elegir un módulo pasa a la limpia, que es el
   * terreno despejado sobre el que se planta. El respaldo existe porque un lote
   * puede tener una de las dos tandas y no la otra.
   */
  const baseImage = useMemo(() => {
    const candidates = activeModuleData
      ? [lot.planImage, lot.planImageMeasured]
      : [lot.planImageMeasured, lot.planImage];

    return (
      candidates
        .filter((key): key is string => Boolean(key))
        .find((key) => !failedImages.has(key)) ?? null
    );
  }, [activeModuleData, lot, failedImages]);

  /**
   * La casa, encima. Van como imágenes aparte y no sustituyendo a la de abajo
   * porque son medias capas: PNG transparentes que solo traen el módulo, y lo
   * que se ve alrededor —el césped, la vereda, el lote del vecino— sigue
   * siendo el render del fondo.
   *
   * Son varias porque el módulo 2 es la ampliación del 1 y se dibujan los dos;
   * el orden de la lista es el orden en que se apilan. Todas miden 2560×1440
   * igual que el fondo, así que el mismo `object-cover` las recorta igual y
   * nada se despega del terreno en ninguna pantalla.
   */
  const overlayImages = useMemo(
    () => (activeModuleData?.overlays(lot) ?? []).filter((key) => !failedImages.has(key)),
    [activeModuleData, lot, failedImages],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (detailModuleId) {
          setDetailModuleId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, detailModuleId]);

  return (
    <div className="absolute inset-0 z-40 bg-neutral-950 animate-in fade-in duration-300">
      {baseImage && (
        <img
          key={baseImage}
          src={getAssetUrl(baseImage)}
          alt={lot.identifier}
          onError={() => setFailedImages((current) => new Set(current).add(baseImage))}
          className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-300"
        />
      )}

      {/*
        Las capas van sin texto alternativo a propósito: son dos trozos de una
        misma casa, y repetir "Mz K Lt 1 · Módulo 2" en cada una solo lo diría
        dos veces. Qué módulo está puesto ya se lee abajo, en la pastilla.
      */}
      {overlayImages.map((key) => (
        <img
          key={key}
          src={getAssetUrl(key)}
          alt=""
          onError={() => setFailedImages((current) => new Set(current).add(key))}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-in fade-in duration-300"
        />
      ))}

      {/*
        Panel del terreno: tamaño optimizado y recortado a la mitad para evitar
        espacio negro innecesario.
      */}
      <aside className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-[clamp(260px,23%,380px)] flex flex-col rounded-2xl bg-neutral-950/85 backdrop-blur-2xl border border-white/15 shadow-2xl overflow-hidden">
        <header className="px-5 pt-5 pb-3 border-b border-white/10">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/40 font-bold">Terreno</p>
          <h3 className="mt-0.5 text-white font-primary text-lg uppercase tracking-[0.12em] font-bold">
            {lot.identifier}
          </h3>
        </header>

        <div className="px-5 py-2">
          <FichaRow
            label="Área Terreno"
            value={lot.areaSqm !== undefined ? `${lot.areaSqm.toLocaleString('es-PE')} m²` : undefined}
          />
          {activeModuleData && (
            <FichaRow
              label="Área Construida"
              value={`${activeModuleData.areaSqm} m²`}
            />
          )}
          <FichaRow
            label="Posición"
            value={lot.lotPosition ? LotPositionLabel[lot.lotPosition] : undefined}
          />
          <FichaRow label="Disponibilidad" value={UnitStatusLabel[lot.status]} />
        </div>

        <p className="px-5 pb-4 pt-1 text-[9px] leading-relaxed text-white/30 border-t border-white/5">
          Área y posición llegan con el inventario del plano de manzaneo.
        </p>
      </aside>

      {/*
        Los dos módulos. Al seleccionar uno se activa el botón 'Ver detalles'.
      */}
      <div className="absolute right-[6%] top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3.5 w-[clamp(200px,19%,320px)]">
        {LOT_MODULES.map((item) => {
          const isActive = activeModule === item.id;
          // Sin capas que plantar el botón no hace nada, así que no se ofrece.
          const isAvailable = item.overlays(lot).length > 0;

          return (
            <div key={item.id} className="flex flex-col gap-2">
              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => setActiveModule((current) => (current === item.id ? null : item.id))}
                aria-pressed={isActive}
                className={`w-full py-3.5 px-5 rounded-xl backdrop-blur-md border text-left shadow-2xl transition-all duration-300 ${
                  !isAvailable
                    ? 'bg-neutral-950/40 border-white/10 text-white/30 cursor-not-allowed'
                    : isActive
                      ? 'bg-brand-orange border-white/40 text-white scale-[1.02] cursor-pointer'
                      : 'bg-neutral-950/65 border-white/20 text-white/85 hover:bg-brand-primary hover:border-white/35 hover:text-white cursor-pointer'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] lg:text-xs uppercase tracking-[0.18em] font-bold">
                    {item.label}
                  </span>
                  <span className={`text-[10px] tracking-normal font-medium ${isActive ? 'text-white/90' : 'text-white/60'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </button>

              {/* Botón 'Ver detalles' cuando este módulo está seleccionado */}
              {isActive && (
                <button
                  type="button"
                  onClick={() => setDetailModuleId(item.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-neutral-900 hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <span>Ver detalles</span>
                  <ArrowRight size={14} className="text-brand-orange" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="absolute top-5 right-[4.5rem] z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
      >
        <ArrowLeft size={13} /> Volver a la zona
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-center">
        <p className="text-white font-primary text-[11px] lg:text-sm uppercase tracking-[0.2em] font-bold">
          {lot.identifier}
          {activeModuleData && (
            <>
              <span className="mx-2 opacity-40">·</span>
              {activeModuleData.label}
            </>
          )}
        </p>
      </div>

      {/* Modal de Detalle de Módulo */}
      {detailModuleId && (
        <ModuloFicha
          moduleId={detailModuleId}
          lot={lot}
          onClose={() => setDetailModuleId(null)}
        />
      )}
    </div>
  );
};

const ZonaStep = ({
  phase,
  coords,
  onMove,
  onBack,
  onOpenTowers,
}: {
  phase: Phase;
  coords: ZoneCoords;
  onMove: (coords: ZoneCoords) => void;
  onBack: () => void;
  onOpenTowers: () => void;
}) => {
  const zone: Zone | null = useMemo(
    () => phase.zones.find((z) => z.row === coords.row && z.col === coords.col) ?? null,
    [phase, coords],
  );

  const directions = useMemo(() => getAvailableDirections(phase, coords), [phase, coords]);

  const towerElements = useMemo(
    () => zone?.elements.filter((element) => element.contents.includes(ProductKind.TOWER)) ?? [],
    [zone],
  );

  // Los terrenos de esta zona que ya tienen recorte medido.
  const lots = useMemo(() => (zone ? clickableLotsOfZone(zone.id) : []), [zone]);

  /**
   * Las manzanas con contorno medido. El rótulo "Mz K" sobre la toma es lo que
   * hace legible un mapa de decenas de franjas iguales: sin él hay que pulsar
   * un lote para averiguar en qué manzana se está.
   */
  const blocks = useMemo(
    () => (zone ? blocksOfZone(zone.id).filter((block) => block.hotspot?.path) : []),
    [zone],
  );
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  /**
   * El lote que se tocó, en pantallas sin ratón. Va SEPARADO de `hoveredLotId`
   * a propósito: en táctil, el toque dispara un `mouseenter` seguido casi al
   * instante de un `mouseleave` sintético (el navegador simula un hover que no
   * existe), y si el clic guardara el lote en `hoveredLotId` ese `mouseleave`
   * lo borraba justo después de mostrarlo —la etiqueta parpadeaba y
   * desaparecía sola—. Aquí el toque no lo toca ningún `mouseleave`, así que
   * la etiqueta se queda puesta hasta que se toca otro lote o se abre la ficha.
   */
  const [tappedLotId, setTappedLotId] = useState<string | null>(null);
  const [hoveredTowerElementId, setHoveredTowerElementId] = useState<string | null>(null);
  const [openLot, setOpenLot] = useState<Unit | null>(null);

  /** El lote a resaltar y a rotular: el tocado gana sobre el simplemente hovereado. */
  const activeLotId = tappedLotId ?? hoveredLotId;
  const hoveredLot = useMemo(
    () => lots.find((lot) => lot.id === activeLotId) ?? null,
    [lots, activeLotId],
  );

  // -------------------------------------------------------------------------
  // Puntos de vista
  // -------------------------------------------------------------------------
  // El marcador del mapa y el número del panel son la misma cosa mirada desde
  // los dos lados, así que la selección vive AQUÍ y no dentro del panel: si la
  // guardase el panel, pulsar un marcador no podría cambiar la foto.

  const zoneViewpoints = useMemo(() => (zone ? viewpointsOfZone(zone.id) : []), [zone]);
  const [activeViewpointId, setActiveViewpointId] = useState<string | null>(null);
  const [hoveredViewpointId, setHoveredViewpointId] = useState<string | null>(null);

  /**
   * El punto que está abierto en el comparador de día y noche, o `null` si no
   * hay ninguno. Se guarda el ID y no el objeto para que al cambiar de zona el
   * comparador se cierre solo: los IDs llevan la zona dentro, así que el de la
   * anterior deja de encontrar pareja aquí.
   */
  const [compareViewpointId, setCompareViewpointId] = useState<string | null>(null);
  const compareViewpoint = useMemo(
    () => zoneViewpoints.find((point) => point.id === compareViewpointId) ?? null,
    [zoneViewpoints, compareViewpointId],
  );

  /**
   * El punto que está enseñando el panel. Se DEDUCE en lugar de reponerse al
   * cambiar de zona: los ids llevan la zona dentro (`zone-2:vp-1`), así que uno
   * de la zona anterior no encuentra pareja aquí y cae solo en el primero de la
   * nueva. Reponerlo con un efecto encadenaría un render de más en cada
   * desplazamiento, y no haría nada que esto no haga.
   */
  const activeViewpoint = useMemo(
    () => zoneViewpoints.find((point) => point.id === activeViewpointId) ?? zoneViewpoints[0] ?? null,
    [zoneViewpoints, activeViewpointId],
  );

  /**
   * En cuanto se elige un punto, su toma de NOCHE empieza a bajarse por detrás.
   *
   * La de día ya está en pantalla —es la miniatura del panel—, pero la de noche
   * no se pedía hasta abrir el comparador, y como pesa un par de megas la mitad
   * derecha se quedaba en blanco unos segundos justo cuando el visitante acaba
   * de pedir verla. Elegir el punto es siempre el paso previo a comparar, así
   * que ese hueco de tiempo es gratis: cuando llega la segunda pulsación, la
   * imagen ya está en la caché del navegador y la cortina abre entera.
   *
   * Solo la del punto elegido, no las cuatro de la zona: son ~2 MB cada una y
   * bajarlas todas por si acaso costaría más de lo que ahorra.
   */
  useEffect(() => {
    const night = activeViewpoint?.imageNight;
    if (!night) return;
    preloadImages([getAssetUrl(night)]).catch(() => {});
  }, [activeViewpoint]);

  // -------------------------------------------------------------------------
  // Panel y filtro de terrenos
  // -------------------------------------------------------------------------
  // Filtrar solo tiene sentido donde hay terrenos: la manzana de las torres no
  // se filtra por metros cuadrados. La pestaña se ofrece o no según eso, no
  // según un listado de zonas escrito a mano.

  // El panel NO se pliega: es parte de la pantalla de la zona. Eso es lo que
  // fija el encuadre de la toma —el hueco del mapa mide siempre lo mismo— y por
  // tanto lo que hace que una coordenada medida sobre ella valga siempre. Con un
  // panel plegable, abrirlo y cerrarlo reencuadraba la toma y los recortes
  // bailaban con él.
  //
  // El filtro tampoco se reinicia al pasar a la zona vecina: "enséñame los
  // vendidos" es una pregunta sobre el catálogo, no sobre la toma, y perderla en
  // cada chevron obligaría a rehacerla para recorrer la fase. La pestaña sí es
  // de la zona —la de filtros ni existe donde no hay terrenos— y de eso se
  // encarga el propio panel, que cae en "Vistas" si la otra no está.
  const [panelTab, setPanelTab] = useState<ZonePanelTab>('views');
  const [filter, setFilter] = useState<LotFilter>(EMPTY_LOT_FILTER);

  /** Todos los terrenos de la zona, con recorte o sin él. */
  const zoneLots = useMemo(() => (zone ? lotsOfZone(zone.id) : []), [zone]);
  const zoneBlocks = useMemo(() => (zone ? blocksOfZone(zone.id) : []), [zone]);
  const areaOptions = useMemo(() => (zone ? lotAreaOptions(zone.id) : []), [zone]);
  const hasPositionInventory = useMemo(
    () => (zone ? hasLotPositionInventory(zone.id) : false),
    [zone],
  );

  // Al cambiar de zona, se limpian las manzanas que no pertenezcan a la nueva.
  useEffect(() => {
    if (!zone) return;
    const validBlockIds = new Set(blocksOfZone(zone.id).map((b) => b.id));
    setFilter((prev) => {
      const filteredBlocks = prev.blockIds.filter((id) => validBlockIds.has(id));
      if (filteredBlocks.length === prev.blockIds.length) return prev;
      return { ...prev, blockIds: filteredBlocks };
    });
  }, [zone?.id]);

  const filterActive = isLotFilterActive(filter);
  const matches = useMemo(
    () => zoneLots.filter((lot) => matchesLotFilter(lot, filter)),
    [zoneLots, filter],
  );

  /** Cuáles de los que encajan se pueden resaltar sobre esta toma. */
  const matchedIds = useMemo(() => new Set(matches.map((lot) => lot.id)), [matches]);
  const unmappedCount = useMemo(
    () => matches.filter((lot) => !lot.path).length,
    [matches],
  );

  const move = useCallback(
    (direction: PanDirection) => {
      const next = getNeighborZone(phase, coords, direction);
      if (next) onMove({ row: next.row, col: next.col });
    },
    [phase, coords, onMove],
  );

  // Las tomas pesan varios MB: se precargan las vecinas para que el salto sea seco.
  useEffect(() => {
    const neighbours = directions
      .map((direction) => getNeighborZone(phase, coords, direction))
      .filter((z): z is Zone => z !== null)
      .map((z) => getAssetUrl(z.image));

    if (neighbours.length > 0) preloadImages(neighbours).catch(() => {});
  }, [phase, coords, directions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  const openViewpoint = useCallback((id: string) => {
    setActiveViewpointId(id);
    setPanelTab('views');
  }, []);

  const stageOverlays = (
    <>
      {/*
        Elementos clicables de la zona. Solo se pintan los que YA tienen destino
        construido —hoy, la manzana de las torres, en la Zona 3—; los de casas y
        amenidades esperan a que el cliente confirme sus polígonos y su ficha, y
        pintarlos antes solo daría clicks que no llevan a ninguna parte.

        El recorte de la manzana va en un SVG aparte del rótulo: así se resalta
        el polígono entero al pasar por encima, igual que las torres sobre la
        toma `ABC`, y el visitante ve QUÉ manzana va a abrir antes de pulsar.
      */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full z-10"
      >
        {towerElements.map((element) => {
          if (!element.hotspot.path) return null;
          const isHovered = hoveredTowerElementId === element.id;
          const highlightPaths =
            element.hotspot.paths && element.hotspot.paths.length > 0
              ? element.hotspot.paths
              : [element.hotspot.path];

          return (
            <g
              key={element.id}
              onClick={onOpenTowers}
              onMouseEnter={() => setHoveredTowerElementId(element.id)}
              onMouseLeave={() =>
                setHoveredTowerElementId((current) => (current === element.id ? null : current))
              }
              className="cursor-pointer"
            >
              {/* Área interactiva exterior */}
              <path d={element.hotspot.path} className="fill-transparent stroke-transparent" />

              {/* Polígonos de las torres que se iluminan al hacer hover */}
              {highlightPaths.map((d, index) => (
                <path
                  key={index}
                  d={d}
                  className={`transition-colors duration-300 pointer-events-none ${
                    isHovered
                      ? 'fill-brand-primary/30 stroke-white [stroke-width:0.08]'
                      : 'fill-transparent stroke-transparent [stroke-width:0.08]'
                  }`}
                />
              ))}
            </g>
          );
        })}

        {/*
          Contorno de la manzana. Va el primero para quedar DEBAJO de los lotes,
          y no intercepta el ratón: lo que se pulsa es el lote, y un contorno
          por encima se comería justamente los clics de las franjas que envuelve.
        */}
        {blocks.map((block) => (
          <path
            key={block.id}
            d={block.hotspot!.path}
            className="pointer-events-none fill-white/0 stroke-white/30 [stroke-width:0.08]"
          />
        ))}

        {/*
          Un recorte por terreno. Son franjas estrechas y hay decenas por zona,
          así que no llevan rótulo fijo: se resalta el que está debajo del
          cursor y su código sale en una etiqueta flotante. Pintarlos todos
          rotulados taparía la toma.

          Con el filtro puesto la lectura se invierte: los que encajan se pintan
          y los demás se apagan. Que el resaltado gane al hover es a propósito
          —el visitante está mirando el conjunto que encaja, no un lote suelto—
          y por eso el que encaja se sigue viendo aunque el cursor esté lejos.
        */}
        {lots.map((lot) => {
          const isHovered = activeLotId === lot.id;
          const isMatch = filterActive && matchedIds.has(lot.id);
          const isDimmed = filterActive && !isMatch;

          return (
            <path
              key={lot.id}
              d={lot.path}
              // El clic YA NO abre la ficha directamente: en pantallas
              // táctiles no hay hover, así que era el único aviso de qué lote
              // se iba a abrir. Ahora el primer toque solo saca la etiqueta
              // (el mismo rótulo que en escritorio aparece al pasar el
              // ratón); es la propia etiqueta la que abre la ficha al
              // tocarla, y para entonces el visitante ya sabe qué lote es.
              //
              // Va a `tappedLotId`, NUNCA a `hoveredLotId`: ese lo limpia el
              // `mouseleave` sintético que sigue a cada toque, y si el clic
              // escribiera ahí la etiqueta aparecía y se borraba sola.
              onClick={() => setTappedLotId(lot.id)}
              onMouseEnter={() => setHoveredLotId(lot.id)}
              onMouseLeave={() =>
                setHoveredLotId((current) => (current === lot.id ? null : current))
              }
              className={`cursor-pointer transition-colors duration-200 ${
                isMatch
                  ? 'fill-brand-orange/55 stroke-white [stroke-width:0.08]'
                  : isDimmed
                  ? 'fill-black/45 stroke-white/15 [stroke-width:0.05]'
                  : isHovered
                  ? 'fill-brand-primary/35 stroke-white [stroke-width:0.08]'
                  : 'fill-transparent stroke-transparent hover:fill-brand-primary/35 hover:stroke-white [stroke-width:0.08]'
              }`}
            />
          );
        })}
      </svg>

      {towerElements.map((element) => (
        <Hotspot
          key={element.id}
          x={element.hotspot.x}
          y={element.hotspot.y}
          label={element.label}
          caption="Ver torres"
          Icon={Building2}
          isHovered={hoveredTowerElementId === element.id}
          onMouseEnter={() => setHoveredTowerElementId(element.id)}
          onMouseLeave={() =>
            setHoveredTowerElementId((current) => (current === element.id ? null : current))
          }
          onClick={onOpenTowers}
        />
      ))}

      {/*
        Los puntos de vista. Van fuera del SVG de recortes porque ese lienzo
        estira el espacio en X y en Y por separado para calcar la toma, y eso
        convertiría el círculo en un óvalo y torcería el abanico (ver
        `ViewpointMarker`).
      */}
      {zoneViewpoints.map((point) => (
        <ViewpointMarker
          key={point.id}
          x={point.anchor.x}
          y={point.anchor.y}
          heading={viewpointHeading(point, ZONE_IMAGE_RATIO)}
          order={point.order}
          label={point.label ?? `Vista ${point.order}`}
          isActive={activeViewpoint?.id === point.id && panelTab === 'views'}
          isHovered={hoveredViewpointId === point.id}
          onMouseEnter={() => setHoveredViewpointId(point.id)}
          onMouseLeave={() =>
            setHoveredViewpointId((current) => (current === point.id ? null : current))
          }
          onClick={() => openViewpoint(point.id)}
        />
      ))}

      {/*
        Rótulo de la manzana. Discreto a propósito: compite con el código del
        lote que sale al pasar por encima, y el que importa en ese momento es el
        del lote. Tampoco es pulsable — no lleva a ninguna parte que el lote no
        lleve ya.
      */}
      {blocks.map((block) => (
        <span
          key={block.id}
          style={{ left: `${block.hotspot!.x}%`, top: `${block.hotspot!.y}%` }}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white/80 text-[9px] lg:text-[10px] uppercase tracking-[0.18em] font-bold whitespace-nowrap"
        >
          {blockLabel(block)}
        </span>
      ))}

      {hoveredLot && (
        <div
          style={{ left: `${hoveredLot.x}%`, top: `${hoveredLot.y}%` }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        >
          {/*
            El segundo toque: esta etiqueta es ahora el único sitio que abre la
            ficha. El primer toque sobre el lote (más arriba) solo la saca a
            pantalla; con ella visible el visitante ya sabe qué lote es antes
            de decidir entrar.
          */}
          <button
            type="button"
            onClick={() => {
              setOpenLot(hoveredLot);
              setTappedLotId(null);
            }}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] lg:text-xs tracking-[0.14em] font-bold shadow-2xl whitespace-nowrap border border-white/20 transition-transform hover:scale-105"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hoveredLot.status === UnitStatus.AVAILABLE
                  ? 'bg-emerald-400'
                  : hoveredLot.status === UnitStatus.RESERVED
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            {hoveredLot.identifier}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/*
        La toma va a la VENTANA ENTERA y pasa por debajo del panel, que flota
        encima traslúcido. No se recoge hasta el borde del panel, aunque tenerlo
        translúcido invite a ello: si se recogiera, la toma quedaría centrada en
        un hueco más estrecho que el de los demás pasos y aterrizar aquí desde
        un vuelo daría un salto lateral —mismo tamaño, distinto encuadre—,
        porque el video sí ocupa la ventana. Todos los pasos comparten hueco y
        los vuelos encajan sin más.

        Esto no descoloca ningún recorte: `FitStage` mide en el espacio 0–100 de
        LA IMAGEN, no de la ventana, así que los polígonos de los lotes y los
        puntos de vista siguen pegados a la toma.
      */}
      {zone ? (
        <FitStage
          imageKey={zone.id}
          src={getAssetUrl(zone.image)}
          alt={`${PhaseLabel[phase.id]} · ${ZoneLabel[zone.id]}`}
          ratio={ZONE_IMAGE_RATIO}
          imageClassName="animate-in fade-in duration-500"
        >
          {stageOverlays}
        </FitStage>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm font-secondary">
          Esta zona todavía no tiene toma.
        </div>
      )}

      {/*
        Los mandos van en un marco que se recoge hasta el borde del panel. La
        toma sí pasa por debajo del panel, pero los mandos no pueden: estaban
        clavados al borde de la ventana y el panel se comía el chevron de la
        derecha —se podía bajar y subir, pero no ir a la zona de al lado—.

        El marco no intercepta el ratón (`pointer-events-none`) — si lo hiciera
        taparía los recortes de la toma, que es todo lo que hay debajo. Cada
        mando lo vuelve a activar para sí mismo.
      */}
      <div
        style={{ right: ZONE_PANEL_WIDTH }}
        className="absolute inset-y-0 left-0 z-20 pointer-events-none"
      >
        <button
          onClick={onBack}
          className="pointer-events-auto absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} /> {phase.label ?? PhaseLabel[phase.id]}
        </button>

        {/* Un chevron por dirección con zona vecina. Al borde, desaparece. */}
        {directions.map((direction) => {
          const { Icon, label, pos } = CHEVRON[direction];
          return (
            <button
              key={direction}
              onClick={() => move(direction)}
              aria-label={label}
              className={`pointer-events-auto absolute z-20 ${pos} w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:bg-black/60 hover:scale-110 cursor-pointer`}
            >
              <Icon size={24} strokeWidth={1.75} />
            </button>
          );
        })}

        <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-center">
          <p className="text-white font-primary text-[11px] lg:text-sm uppercase tracking-[0.2em] font-bold">
            {phase.label ?? PhaseLabel[phase.id]}
            {zone && (
              <>
                <span className="mx-2 opacity-40">·</span>
                {zone.label ?? ZoneLabel[zone.id]}
              </>
            )}
          </p>
        </div>
      </div>

      {/*
        El comparador ocupa el hueco de la toma —de ahí el mismo `right` que el
        marco de los mandos— y no la ventana entera: el panel se queda a la
        vista, así que se ve de qué punto se está mirando el día y la noche y se
        puede saltar al siguiente sin cerrar nada.
      */}
      {compareViewpoint && (
        <div style={{ right: ZONE_PANEL_WIDTH }} className="absolute inset-y-0 left-0 z-30">
          <ViewpointCompare
            key={compareViewpoint.id}
            point={compareViewpoint}
            onClose={() => setCompareViewpointId(null)}
          />
        </div>
      )}

      {openLot && <LoteFicha lot={openLot} onClose={() => setOpenLot(null)} />}

      {zone && (
        <ZonePanel
          zoneLabel={zone.label ?? ZoneLabel[zone.id]}
          viewpoints={zoneViewpoints}
          activeViewpointId={activeViewpoint?.id ?? null}
          onSelectViewpoint={setActiveViewpointId}
          onOpenViewpointCompare={(point) => setCompareViewpointId(point.id)}
          showFilters={zoneLots.length > 0}
          blocks={zoneBlocks}
          lots={zoneLots}
          matches={matches}
          filter={filter}
          areaOptions={areaOptions}
          hasPositionInventory={hasPositionInventory}
          unmappedCount={unmappedCount}
          onFilterChange={setFilter}
          onFilterReset={() => setFilter(EMPTY_LOT_FILTER)}
          onHoverLot={setHoveredLotId}
          onSelectLot={setOpenLot}
          activeTab={panelTab}
          onTabChange={setPanelTab}
          width={ZONE_PANEL_WIDTH}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Paso 3 — Torres: la toma de las tres (ABC) y el acercamiento a una de ellas
// ---------------------------------------------------------------------------
// Cada torre tiene su área clicable sobre la toma y su video de acercamiento.
// El último fotograma del video ES la planta en la que se aterriza (hoy el
// piso 5), así que al terminar se muestra esa planta y el corte no se nota:
// por eso se precargan las tres antes de que el visitante elija.

const TorresStep = ({
  onEnterTower,
  onBack,
}: {
  onEnterTower: (tower: Tower, level: number) => void;
  onBack: () => void;
}) => {
  const [entering, setEntering] = useState<{ tower: Tower; level: number; video: string } | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const ordered = useMemo(() => sortTowers(towers), []);

  const enter = useCallback(
    (tower: Tower) => {
      if (entering) return;

      const { floor, video } = resolveTowerEntry(tower);
      if (!floor) return;

      const videoUrl = video ? getAssetUrl(video) : '';
      if (videoUrl) {
        setEntering({ tower, level: floor.level, video: videoUrl });
      } else {
        // Sin animación se entra igual: la vista no depende del video.
        onEnterTower(tower, floor.level);
      }
    },
    [entering, onEnterTower],
  );

  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);

  // Red de seguridad del acercamiento. Chrome suspende los videos "para
  // ahorrar energía" y a veces los deja parados a un pelo del final: `ended`
  // no llega nunca y el visitante se queda mirando un fotograma congelado.
  // Si el video está parado cerca del final se entra igual — y no se nota,
  // porque ese fotograma final ES la planta que se va a mostrar.
  useEffect(() => {
    if (!entering) return;

    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video?.duration) return;
      if (video.paused && video.duration - video.currentTime <= 0.5) {
        onEnterTower(entering.tower, entering.level);
      }
    }, 400);

    return () => window.clearInterval(id);
  }, [entering, onEnterTower]);

  // Las plantas de aterrizaje, precargadas: son el fotograma final del video.
  useEffect(() => {
    const landings = ordered
      .map((tower) => resolveTowerEntry(tower).floor)
      .filter((floor): floor is NonNullable<typeof floor> => floor !== null)
      .map((floor) => getAssetUrl(floor.planImage));

    preloadImages(landings).catch(() => {});
  }, [ordered]);

  return (
    <>
      <FitStage
        src={getAssetUrl(towersOverviewImage)}
        alt="Torres El Olimpo de Tumbes"
        imageClassName="animate-in fade-in duration-500"
      >
        {/* Recortes de cada torre: el polígono resalta al pasar por encima. */}
        {!entering && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full z-10"
          >
            {ordered.map((tower) => {
              if (!tower.hotspot?.path) return null;
              const isHovered = hoveredTowerId === tower.id;

              return (
                <path
                  key={tower.id}
                  d={tower.hotspot.path}
                  onClick={() => enter(tower)}
                  onMouseEnter={() => setHoveredTowerId(tower.id)}
                  onMouseLeave={() =>
                    setHoveredTowerId((current) => (current === tower.id ? null : current))
                  }
                  className={`cursor-pointer transition-colors duration-300 ${
                    isHovered
                      ? 'fill-brand-primary/25 stroke-white [stroke-width:0.08]'
                      : 'fill-transparent stroke-transparent hover:fill-brand-primary/25 hover:stroke-white [stroke-width:0.08]'
                  }`}
                />
              );
            })}
          </svg>
        )}

        {/* Rótulo de cada torre, centrado en su recorte. */}
        {!entering &&
          ordered.map((tower) => {
            if (!tower.hotspot) return null;
            const isHovered = hoveredTowerId === tower.id;

            return (
              <button
                key={tower.id}
                type="button"
                onClick={() => enter(tower)}
                onMouseEnter={() => setHoveredTowerId(tower.id)}
                onMouseLeave={() =>
                  setHoveredTowerId((current) => (current === tower.id ? null : current))
                }
                style={{ left: `${tower.hotspot.x}%`, top: `${tower.hotspot.y}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              >
                <span
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md border text-[11px] lg:text-sm uppercase tracking-[0.22em] font-bold shadow-2xl transition-all duration-300 ${
                    isHovered
                      ? 'bg-brand-primary border-white/40 text-white scale-110'
                      : 'bg-black/55 group-hover:bg-brand-primary border-white/30 text-white group-hover:scale-110'
                  }`}
                >
                  {tower.label ?? TowerLabel[tower.id]}
                </span>
              </button>
            );
          })}
      </FitStage>

      {/* Acercamiento hasta la torre elegida. */}
      {entering && (
        <video
          key={entering.video}
          ref={videoRef}
          src={entering.video}
          autoPlay
          playsInline
          muted
          preload="auto"
          onCanPlay={(e) => {
            e.currentTarget.play().catch(() => {});
          }}
          onEnded={() => onEnterTower(entering.tower, entering.level)}
          onError={() => onEnterTower(entering.tower, entering.level)}
          className="absolute inset-0 w-full h-full object-cover z-30"
        />
      )}

      {!entering && (
        <>
          <button
            onClick={onBack}
            className="absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Volver a la zona
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-center">
            <p className="text-white/85 font-secondary text-[10px] lg:text-[11px] uppercase tracking-[0.2em]">
              Elige una torre para entrar
            </p>
          </div>
        </>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Paso 4 — Torre: las plantas, con salto lateral que conserva el piso
// ---------------------------------------------------------------------------
// Dos maneras de moverse, y son distintas a propósito:
//   · Arriba / abajo → cambia de piso dentro de la misma torre.
//   · Izquierda / derecha → cambia de torre CONSERVANDO el piso. Si el
//     visitante está en el piso 3 de la A y pasa a la B, entra al piso 3 de la
//     B, no al piso de entrada del video. Y no hay video: el salto es un
//     fundido (`resolveTowerSwitch`).

const TorreStep = ({
  tower,
  level,
  onSelectLevel,
  onSwitchTower,
  onBack,
}: {
  tower: Tower;
  level: number;
  onSelectLevel: (level: number) => void;
  onSwitchTower: (tower: Tower, level: number) => void;
  onBack: () => void;
}) => {
  // Departamento seleccionado. Pulsar uno abre su ficha, y el resaltado se
  // queda puesto: al volver de la ficha se ve de cuál se venía.
  //
  // No hace falta limpiarlo al cambiar de piso o de torre: el id lleva dentro
  // la torre y el piso (`tower-a:unit-501`), así que en otra planta
  // sencillamente no coincide con ninguna unidad y el resaltado se apaga solo.
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  /** La unidad cuya ficha está abierta encima de la planta. */
  const [openUnit, setOpenUnit] = useState<Unit | null>(null);
  /** Unidad para consulta modal */
  const [consultationUnit, setConsultationUnit] = useState<Unit | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUnitEnter = useCallback((unit: Unit) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredUnitId(unit.id);
  }, []);

  const handleUnitLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredUnitId(null);
    }, 180);
  }, []);

  const floors = useMemo(() => sortFloorsDescending(tower), [tower]);
  const floor = useMemo(() => findFloorByLevel(tower, level) ?? floors[0] ?? null, [tower, level, floors]);
  const directions = useMemo(() => getAvailableTowerDirections(towers, tower.id), [tower.id]);

  const selectedUnit = useMemo(
    () => floor?.units.find((unit) => unit.id === selectedUnitId) ?? null,
    [floor, selectedUnitId],
  );

  const switchTower = useCallback(
    (direction: LateralDirection) => {
      const next = resolveTowerSwitch(towers, tower.id, level, direction);
      if (!next?.floor) return;
      onSwitchTower(next.tower, next.floor.level);
    },
    [tower.id, level, onSwitchTower],
  );

  const step = useCallback(
    (delta: number) => {
      const target = findFloorByLevel(tower, level + delta);
      if (target) onSelectLevel(target.level);
    },
    [tower, level, onSelectLevel],
  );

  const openUnitFicha = useCallback((unit: Unit) => {
    setSelectedUnitId(unit.id);
    setOpenUnit(unit);
  }, []);

  // Se precargan el piso de arriba, el de abajo y el mismo piso en las torres
  // vecinas: son los cuatro destinos posibles desde aquí.
  useEffect(() => {
    const neighbours = [
      findFloorByLevel(tower, level + 1),
      findFloorByLevel(tower, level - 1),
      ...directions.map(
        (direction) => resolveTowerSwitch(towers, tower.id, level, direction)?.floor ?? null,
      ),
    ]
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .map((f) => getAssetUrl(f.planImage));

    if (neighbours.length > 0) preloadImages(neighbours).catch(() => {});
  }, [tower, level, directions]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Con la ficha abierta las flechas son suyas (y su Escape la cierra):
      // moverían de piso o de torre por detrás de una pantalla que las tapa.
      if (openUnit) return;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        switchTower(LateralDirection.LEFT);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        switchTower(LateralDirection.RIGHT);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, switchTower, openUnit]);

  return (
    <>
      {floor ? (
        <FitStage
          imageKey={floor.id}
          src={getAssetUrl(floor.planImage)}
          alt={`${tower.label ?? TowerLabel[tower.id]} · ${floorTitle(floor)}`}
          imageClassName="animate-in fade-in duration-500"
        >

        {/*
          Los cuatro departamentos de la planta. El recorte y el rótulo salen de
          `units`, no del componente: si mañana una planta tiene seis, se declaran
          en `towers.ts` y aquí no se toca nada.
        */}
        {floor && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full z-10"
          >
            {floor.units.map((unit) => {
              if (!unit.path) return null;
              const isSelected = unit.id === selectedUnitId;
              const isHovered = unit.id === hoveredUnitId;

              return (
                <path
                  key={unit.id}
                  d={unit.path}
                  onClick={() => openUnitFicha(unit)}
                  onMouseEnter={() => handleUnitEnter(unit)}
                  onMouseLeave={handleUnitLeave}
                  className={`[stroke-width:0.08] cursor-pointer transition-colors duration-300 ${
                    isSelected
                      ? 'fill-brand-primary/45 stroke-white'
                      : isHovered
                      ? 'fill-brand-primary/30 stroke-white'
                      : 'fill-transparent stroke-transparent hover:fill-brand-primary/30 hover:stroke-white'
                  }`}
                />
              );
            })}
          </svg>
        )}

        {floor?.units.map((unit) => {
          const isSelected = unit.id === selectedUnitId;
          const isHovered = unit.id === hoveredUnitId;

          const statusDotColor =
            unit.status === UnitStatus.AVAILABLE
              ? 'bg-emerald-500'
              : unit.status === UnitStatus.RESERVED
              ? 'bg-amber-400'
              : 'bg-rose-500';

          return (
            <div
              key={unit.id}
              style={{ left: `${unit.x}%`, top: `${unit.y}%` }}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              onMouseEnter={() => handleUnitEnter(unit)}
              onMouseLeave={handleUnitLeave}
            >
              {/* Tag del Departamento (Píldora blanca con punto de disponibilidad) */}
              <button
                type="button"
                onClick={() => openUnitFicha(unit)}
                className={`cursor-pointer flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-xl transition-all duration-300 ${
                  isHovered || isSelected
                    ? 'ring-2 ring-slate-900 border-slate-900 scale-110 z-30'
                    : 'border border-gray-200 hover:border-slate-400 hover:scale-105'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
                <span className="text-xs font-bold text-gray-900 tracking-wide">{unit.identifier}</span>
              </button>

              {/* Tarjeta Flotante al Hover (Únicamente para Departamentos) */}
              {isHovered && !openUnit && (
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100/90 z-50 animate-in fade-in zoom-in-95 duration-200 cursor-default ${
                    (unit.y ?? 50) < 42
                      ? 'top-full mt-3 origin-top'
                      : 'bottom-full mb-3 origin-bottom'
                  }`}
                  onMouseEnter={() => handleUnitEnter(unit)}
                  onMouseLeave={handleUnitLeave}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Caret / Flecha indicadora */}
                  <div
                    className={`absolute w-3.5 h-3.5 bg-white rotate-45 z-0 left-1/2 -translate-x-1/2 ${
                      (unit.y ?? 50) < 42
                        ? '-top-1.5 border-l border-t border-gray-100/90'
                        : '-bottom-1.5 border-r border-b border-gray-100/90'
                    }`}
                  />

                  {/* Contenido de la Tarjeta */}
                  <div className="relative z-10 space-y-3">
                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        {UnitStatusLabel[unit.status]}
                      </span>
                    </div>

                    {/* Título y Subtítulo */}
                    <div>
                      <h3 className="text-3xl font-light text-gray-900 leading-tight">
                        {unit.identifier}
                      </h3>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                        {unit.subtitle || 'Flat'}
                      </p>
                    </div>

                    {/* Especificaciones */}
                    <div className="flex items-center justify-between py-3 border-y border-gray-100 text-gray-700">
                      <div className="flex items-center gap-1.5" title="Área total">
                        <Ruler size={14} className="text-gray-400" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-gray-700">
                          {unit.areaSqm ? `${unit.areaSqm} m²` : '50 m²'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Dormitorios">
                        <Bed size={14} className="text-gray-400" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-gray-700">
                          {unit.bedrooms ?? 3}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Baños">
                        <Bath size={14} className="text-gray-400" strokeWidth={1.75} />
                        <span className="text-xs font-medium text-gray-700">
                          {unit.bathrooms ?? 1}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConsultationUnit(unit);
                          setIsConsultationOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider transition-colors text-center cursor-pointer"
                      >
                        Consultar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUnitFicha(unit);
                        }}
                        className="py-2.5 px-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm text-center cursor-pointer"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </FitStage>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm font-secondary">
          Este piso todavía no tiene planta.
        </div>
      )}

      <button
        onClick={onBack}
        className="absolute top-5 right-[4.5rem] z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors cursor-pointer"
      >
        <ArrowLeft size={13} /> Ver las tres torres
      </button>

      {/* Salto lateral: solo existe la flecha si hay torre en ese sentido. */}
      {directions.includes(LateralDirection.LEFT) && (
        <button
          type="button"
          onClick={() => switchTower(LateralDirection.LEFT)}
          aria-label="Ir a la torre de la izquierda"
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:bg-black/60 hover:scale-110 cursor-pointer"
        >
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
      )}

      {directions.includes(LateralDirection.RIGHT) && (
        <button
          type="button"
          onClick={() => switchTower(LateralDirection.RIGHT)}
          aria-label="Ir a la torre de la derecha"
          className="absolute right-24 top-1/2 -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-xl transition-all duration-300 hover:bg-black/60 hover:scale-110 cursor-pointer"
        >
          <ChevronRight size={24} strokeWidth={1.75} />
        </button>
      )}

      {/* Selector de pisos: de arriba hacia abajo, como en Océano. */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 px-2 py-3 rounded-full bg-black/45 backdrop-blur-md border border-white/15">
        {floors.map((item) => {
          const isActive = item.level === level;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectLevel(item.level)}
              aria-label={floorTitle(item)}
              aria-current={isActive}
              className={`w-9 h-9 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-brand-primary text-white scale-110 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-center">
        <p className="text-white font-primary text-[11px] lg:text-sm uppercase tracking-[0.2em] font-bold">
          {tower.label ?? TowerLabel[tower.id]}
          {floor && (
            <>
              <span className="mx-2 opacity-40">·</span>
              {floorTitle(floor)}
            </>
          )}
          {selectedUnit && (
            <>
              <span className="mx-2 opacity-40">·</span>
              Depto. {selectedUnit.identifier}
            </>
          )}
        </p>
      </div>

      {/*
        La ficha del departamento. Va aparte del paso, como la del terreno: al
        cerrarla el visitante sigue en el mismo piso de la misma torre y no lo
        devuelve a la vista de las tres.

        La `key` fuerza un montaje nuevo por unidad, así que cada departamento
        se abre por su vista de entrada —el amoblado— y no por la que quedara
        elegida en el anterior.
      */}
      {openUnit && (
        <DepartamentoFicha
          key={openUnit.id}
          unit={openUnit}
          context={`${tower.label ?? TowerLabel[tower.id]}${floor ? ` · ${floorTitle(floor)}` : ''}`}
          floorLabel={floor?.label}
          onClose={() => setOpenUnit(null)}
        />
      )}

      {/* Modal de Consulta */}
      {consultationUnit && (
        <RequestInfoModal
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
          unitId={consultationUnit.id}
          unitIdentifier={consultationUnit.identifier}
          floorId={floor ? `${tower.label ?? TowerLabel[tower.id]} · ${floorTitle(floor)}` : ''}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Transición entre pasos del recorrido
// ---------------------------------------------------------------------------
// El vuelo de cámara que enlaza dos pantallas: Master Plan → Fase, Fase → Zona,
// Zona → Fase y Zona → Zona vecina. Vive AQUÍ arriba y no dentro de cada paso
// porque casi todos cruzan la frontera de un paso a otro: si lo montara el paso
// de origen, se desmontaría a mitad de video.
//
// Al acabar hace dos cosas EN ESTE ORDEN: cambia de paso —el destino se monta
// debajo— y solo después se desvanece encima de él. Ese medio segundo de
// solape tapa dos cosas a la vez: lo que tarde en pintar la toma nueva, y el
// salto de color entre el video y el render fijo, que en estas animaciones se
// nota (los videos vienen más lavados que las tomas; ver `docs/02-ASSETS.md`).

const STEP_TRANSITION_FADE_MS = 500;


const StepTransition = ({
  url,
  onCommit,
  onDone,
}: {
  url: string;
  onCommit: () => void;
  onDone: () => void;
}) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleEnded = useCallback(() => {
    if (timerRef.current !== null) return;
    onCommit();
    setIsLeaving(true);
    // Por temporizador y no por `transitionend`: en una pestaña en segundo
    // plano el navegador congela las transiciones CSS y el evento no llega
    // nunca, dejando el video colgado encima del paso nuevo.
    timerRef.current = window.setTimeout(onDone, STEP_TRANSITION_FADE_MS);
  }, [onCommit, onDone]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <video
      src={url}
      autoPlay
      muted
      playsInline
      preload="auto"
      onCanPlay={(e) => {
        e.currentTarget.play().catch(() => {});
      }}
      onEnded={handleEnded}
      // Si el video no carga, el recorrido no se puede quedar atascado: se
      // salta al destino igual, sin animación.
      onError={handleEnded}
      className={`absolute inset-0 w-full h-full object-cover z-[50] bg-neutral-950 animate-in fade-in duration-300 transition-opacity duration-500 ${
        isLeaving ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
};

/** Lo que hay que reproducir y qué hacer cuando termine. */
type PendingTransition = { url: string; commit: () => void };

// ---------------------------------------------------------------------------

function UrbanizacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<NavigationStep>(() => {
    const step = searchParams?.get('step');
    if (step === 'phases' || step === 'masterplan') return NavigationStep.PHASES;
    if (step === 'sides') return NavigationStep.SIDES;
    return NavigationStep.INTRO;
  });

  /**
   * El paso que pide la URL, releído en cada navegación.
   *
   * Los pasos del showroom son todos LA MISMA ruta, así que saltar entre dos
   * entradas del menú —"Urbanización" y "Master Plan"— no cambia de página:
   * solo cambia este parámetro. Sin releerlo, la URL se actualizaba y la
   * pantalla se quedaba en el paso anterior.
   *
   * Antes solo se atendían `phases` y `sides`; al no contemplar la portada,
   * volver a ella desde el menú no hacía nada. Ahora cualquier otro valor
   * —incluida su ausencia— cae en la portada, que es donde arranca el
   * recorrido.
   *
   * Se aplica solo cuando el parámetro CAMBIA de verdad. Si se aplicara en
   * cada pasada del efecto, un re-render que renovase `searchParams`
   * devolvería al visitante al paso escrito en la URL y le desharía lo que
   * llevara recorrido a mano.
   */
  const lastStepParam = useRef<string | null>(null);

  useEffect(() => {
    const step = searchParams?.get('step') ?? '';
    if (lastStepParam.current === step) return;
    lastStepParam.current = step;

    if (step === 'phases' || step === 'masterplan') {
      setActiveStep(NavigationStep.PHASES);
    } else if (step === 'sides') {
      setActiveStep(NavigationStep.SIDES);
    } else {
      setActiveStep(NavigationStep.INTRO);
    }
  }, [searchParams]);

  /**
   * Cambia de paso y deja constancia en la URL.
   *
   * Hace falta porque el menú separa "Urbanización" de "Master Plan" por este
   * parámetro —los dos son la misma ruta—, así que un paso cambiado solo por
   * estado deja la URL mintiendo: se entraba al proyecto desde el botón y el
   * menú seguía resaltando "Urbanización".
   *
   * El parámetro nombra la SECCIÓN, no el paso exacto: `intro` cubre la
   * portada y el giro de caras —que para el visitante son lo mismo, la
   * urbanización vista desde fuera— y `phases`, el Master Plan y todo lo que
   * cuelga de él. Por eso moverse entre portada y caras no lo toca.
   *
   * Se usa `replace` y no `push` para no llenar el historial de pasos: el
   * recorrido ya trae sus propios botones de volver.
   */
  const goToStep = useCallback(
    (step: NavigationStep, param: 'intro' | 'phases') => {
      setActiveStep(step);
      // Se adelanta al efecto de arriba para que no vuelva a aplicar lo mismo.
      lastStepParam.current = param;
      router.replace(`/showroom?step=${param}`, { scroll: false });
    },
    [router],
  );

  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  // La zona, la torre y el piso viven AQUÍ, no dentro de su paso: es lo que
  // permite que al pasar de una torre a otra se conserve el piso, que volver a
  // la vista de las tres y entrar de nuevo sí reproduzca el video, y que subir
  // a las torres y bajar devuelva a la MISMA zona y no a la de entrada.
  const [activeCoords, setActiveCoords] = useState<ZoneCoords | null>(null);
  const [activeTower, setActiveTower] = useState<Tower | null>(null);
  const [activeLevel, setActiveLevel] = useState(0);
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);

  const [transition, setTransition] = useState<PendingTransition | null>(null);

  /**
   * Reproduce el vuelo de cámara y, al acabar, aplica el cambio de paso.
   *
   * `relPath` puede venir vacío: no todos los tramos tienen video —volver de la
   * fase al Master Plan, por ejemplo, no lo tiene— y entonces se cambia de paso
   * en seco, como se hacía antes. Mientras hay uno en marcha se ignoran los
   * demás: sin esto, aporrear los chevrons encadena vuelos y se acaba en una
   * zona que no es la que enseña la pantalla.
   */
  const playTransition = useCallback(
    (relPath: string | null, commit: () => void) => {
      if (transition) return;
      const url = relPath ? getAssetUrl(relPath) : '';
      if (!url) {
        commit();
        return;
      }
      setTransition({ url, commit });
    },
    [transition],
  );

  const zoneCoords = useMemo(() => {
    if (activeCoords) return activeCoords;
    if (!activePhase) return null;
    const entry = getEntryZone(activePhase);
    return entry ? { row: entry.row, col: entry.col } : activePhase.entryZone;
  }, [activeCoords, activePhase]);

  /** La zona que se está mirando, que es de donde salen los vuelos de vuelta. */
  const activeZone = useMemo(
    () =>
      activePhase && zoneCoords
        ? activePhase.zones.find((z) => z.row === zoneCoords.row && z.col === zoneCoords.col) ?? null
        : null,
    [activePhase, zoneCoords],
  );

  // Entrar a una fase: si la zona no se eligió por su rótulo, se cae en la de
  // entrada declarada por la fase.
  const openPhase = useCallback(
    (phase: Phase) => {
      playTransition(phaseEntryVideo(phase.id), () => {
        setActivePhase(phase);
        setActiveCoords(null);
        setActiveStep(NavigationStep.ZONES);
      });
    },
    [playTransition],
  );

  const openZone = useCallback(
    (zone: Zone) => {
      playTransition(zoneEntryVideo(zone.phaseId, zone.id), () => {
        setActiveCoords({ row: zone.row, col: zone.col });
        setActiveStep(NavigationStep.ZONE_VIEW);
      });
    },
    [playTransition],
  );

  /** Desplazarse a la zona contigua. El vuelo depende del PAR, no del sentido. */
  const moveZone = useCallback(
    (next: ZoneCoords) => {
      const target = activePhase?.zones.find((z) => z.row === next.row && z.col === next.col);
      const clip =
        activePhase && activeZone && target
          ? zoneTransitionVideo(activePhase.id, activeZone.id, target.id)
          : null;
      playTransition(clip, () => setActiveCoords(next));
    },
    [activePhase, activeZone, playTransition],
  );

  /** Subir de la zona a la toma de su fase. */
  const backToPhase = useCallback(() => {
    const clip = activePhase && activeZone ? zoneExitVideo(activePhase.id, activeZone.id) : null;
    playTransition(clip, () => setActiveStep(NavigationStep.ZONES));
  }, [activePhase, activeZone, playTransition]);

  /** Entrar a las torres desde la zona: reproduce el vuelo Z3-ABC.mp4 */
  const openTowers = useCallback(() => {
    playTransition(towersEntryTransitionVideo, () => {
      setActiveStep(NavigationStep.TOWER);
    });
  }, [playTransition]);

  return (
    <StageProvider value={setStageEl}>
    <div
      className="relative w-full h-app overflow-hidden bg-neutral-950"
    >
      {/*
        Pantalla completa. Siempre en la esquina superior derecha (right-5 top-5).
        Tiene z-30 para no superponerse ni duplicarse con las fichas a pantalla completa (z-40 / z-50).
      */}
      <div className="absolute top-5 right-5 z-30">
        <FullScreenToggle />
      </div>

      {activeStep === NavigationStep.INTRO && (
        <Cara0Step onEnterSides={() => setActiveStep(NavigationStep.SIDES)} />
      )}

      {activeStep === NavigationStep.SIDES && (
        <CarasStep
          onEnterProject={() => goToStep(NavigationStep.PHASES, 'phases')}
          onBackToCara0={() => setActiveStep(NavigationStep.INTRO)}
        />
      )}

      {activeStep === NavigationStep.PHASES && (
        <MasterPlanStep
          onEnterPhase={openPhase}
          onBackToSides={() => goToStep(NavigationStep.SIDES, 'intro')}
        />
      )}

      {activeStep === NavigationStep.ZONES && activePhase && (
        <FaseStep
          phase={activePhase}
          onBack={() => {
            setActivePhase(null);
            setActiveCoords(null);
            setActiveStep(NavigationStep.PHASES);
          }}
          onOpenZone={openZone}
        />
      )}

      {activeStep === NavigationStep.ZONE_VIEW && activePhase && zoneCoords && (
        <ZonaStep
          phase={activePhase}
          coords={zoneCoords}
          onMove={moveZone}
          onBack={backToPhase}
          onOpenTowers={openTowers}
        />
      )}

      {activeStep === NavigationStep.TOWER && (
        <TorresStep
          onBack={() => setActiveStep(NavigationStep.ZONE_VIEW)}
          onEnterTower={(tower, level) => {
            setActiveTower(tower);
            setActiveLevel(level);
            setActiveStep(NavigationStep.FLOOR);
          }}
        />
      )}

      {activeStep === NavigationStep.FLOOR && activeTower && (
        <TorreStep
          tower={activeTower}
          level={activeLevel}
          onSelectLevel={setActiveLevel}
          onSwitchTower={(tower, level) => {
            setActiveTower(tower);
            setActiveLevel(level);
          }}
          onBack={() => setActiveStep(NavigationStep.TOWER)}
        />
      )}

      {/*
        Va después de los pasos para quedar por encima de todos ellos, y antes
        de la herramienta de coordenadas y el Sidebar, que sí deben verse por
        encima del vuelo.
      */}
      {transition && (
        <StepTransition
          key={transition.url}
          url={transition.url}
          onCommit={transition.commit}
          onDone={() => setTransition(null)}
        />
      )}

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-5 left-5 z-50 w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
    </StageProvider>
  );
}

export default function UrbanizacionPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center">
          <Loader />
        </div>
      }
    >
      <UrbanizacionContent />
    </Suspense>
  );
}
