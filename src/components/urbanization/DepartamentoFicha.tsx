"use client";

// ============================================================================
// FICHA DEL DEPARTAMENTO — el mismo plano, de tres maneras
// ----------------------------------------------------------------------------
// Se abre encima de la planta del piso, tapándola, y al cerrarla el visitante
// sigue en el mismo piso de la misma torre. Es una capa, no un paso del
// recorrido: por eso no toca `NavigationStep` (igual que la ficha del terreno).
//
// EL DISEÑO NO ES NUEVO. Es el de la ficha de unidad que ya existe en el
// proyecto (`src/app/unidad/[id]/page.tsx`, heredada de Océano): panel blanco
// a la izquierda con los datos, plano a la derecha, y el cambio de vista en dos
// pastillas laterales sobre el propio plano. Se copia a propósito, hasta el
// reparto izquierda/derecha, para que quien vende no tenga que aprender dos
// fichas distintas según el producto que esté enseñando.
//
// LAS DOS PASTILLAS. Cada vista ofrece las OTRAS DOS, colocadas en el orden en
// que están declaradas (`apartmentViewOrder`): la primera que sobra va a la
// izquierda y la segunda a la derecha. Estando en Amoblado —por donde se
// entra— eso deja Medidas a la izquierda y Sin amoblar a la derecha, que es
// como lo pidió el cliente. Y como hay video para los seis pares ordenados,
// cualquiera de los dos saltos anima: no hace falta pasar por el del medio.
//
// POR QUÉ EL CORTE NO SE VE. El primer fotograma de cada video es exactamente
// la vista de origen y el último la de destino, así que basta con cambiar la
// imagen cuando el video termina. Para que eso funcione hacen falta tres
// cosas, y las tres están aquí:
//
//   1. Imagen y video comparten caja, encaje y relleno (`object-contain` con
//      el mismo `p-4 md:p-8`). Tienen además la MISMA proporción —las tomas se
//      subieron a 3840×2160 justo para eso—, así que ocupan el mismo
//      rectángulo exacto en cualquier ventana.
//
//      `contain` y no `cover`, que es lo que usa el resto del recorrido: en una
//      toma aérea recortar los bordes se perdona, porque lo que se enseña es un
//      sitio y sigue estando ahí. Un plano no: recortarlo se lleva por delante
//      ambientes enteros —en vertical, `cover` dejaba a la vista una esquina
//      del departamento y nada más— y las medidas rotuladas se van con ellos.
//   2. La imagen de destino se PRECARGA al abrir la ficha, no al pulsar. Si se
//      pidiera al final del video, el navegador enseñaría un hueco mientras la
//      descarga — el corte se vería precisamente en el peor momento.
//   3. El video no se desmonta al terminar: se queda en su ÚLTIMO FOTOGRAMA
//      —que es la vista de destino— hasta que la imagen de debajo avisa de que
//      ya cargó (`onLoad`).
//
// SI FALTA UN ARCHIVO. Ni el video ni la imagen son obligatorios: sin video se
// cambia de vista de golpe, y una clave que no esté en el bucket deja el hueco
// en blanco con los controles puestos. Vale más una ficha coja que una
// pantalla rota.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { appBoxWidth } from '@/utils/layout';
import {
  ArrowLeft,
  Bath,
  Bed,
  ChevronLeft,
  ChevronRight,
  Images,
  Info,
  Mail,
  Rotate3d,
  Ruler,
  Share2,
  X,
} from 'lucide-react';

import GalleryViewer from '@/components/gallery/GalleryViewer';
import RequestInfoModal from '@/components/modals/RequestInfoModal';
import TourHeader from '@/components/UI/TourHeader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import TransitionVideo from '@/components/urbanization/TransitionVideo';
import {
  APARTMENT_TOUR_URL,
  apartmentTransition,
  apartmentTypeOfUnit,
  apartmentViewOrder,
  defaultApartmentView,
} from '@/data/urbanization/apartments';
import {
  ApartmentView,
  ApartmentViewLabel,
  UnitKindLabel,
  UnitStatus,
  UnitStatusLabel,
} from '@/data/urbanization/enums';
import type { Unit } from '@/data/urbanization/types';
import { getAssetUrl } from '@/utils/assets';
import { preloadImages } from '@/utils/preload';

/** Colores del distintivo de disponibilidad, los mismos de la ficha de unidad. */
const STATUS_BADGE: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: 'bg-green-50 text-green-600 border-green-100',
  [UnitStatus.RESERVED]: 'bg-amber-50 text-amber-600 border-amber-100',
  [UnitStatus.SOLD]: 'bg-red-50 text-red-600 border-red-100',
};

/**
 * Una línea de "Instalaciones".
 */
const Instalacion = ({
  Icon,
  value,
}: {
  Icon: typeof Ruler;
  value: string;
}) => (
  /* En fila (icono encima del texto) mientras el panel es una hoja a pantalla
     completa, y en lista de una columna cuando cabe al lado del plano. */
  <li className="flex flex-col items-center gap-2 text-center xl:flex-row xl:items-center xl:gap-4 xl:text-left">
    <Icon strokeWidth={1.5} size={22} className="shrink-0 text-brand-orange" />
    <span className="text-sm font-medium text-neutral-700">{value}</span>
  </li>
);

export interface DepartamentoFichaProps {
  unit: Unit;
  /** Cabecera: "Torre A · Piso 5". La arma quien abre la ficha. */
  context?: string;
  /** Piso en limpio ("5") para el asunto del formulario de contacto. */
  floorLabel?: string;
  onClose: () => void;
}

const DepartamentoFicha = ({ unit, context, floorLabel, onClose }: DepartamentoFichaProps) => {
  const type = useMemo(() => apartmentTypeOfUnit(unit), [unit]);

  const [view, setView] = useState<ApartmentView>(defaultApartmentView);
  /** El video en curso y a dónde lleva. `null` = no hay transición. */
  const [transition, setTransition] = useState<{ url: string; to: ApartmentView } | null>(null);
  /**
   * El video ya terminó y se está usando su último fotograma de telón mientras
   * la imagen de destino termina de cargar debajo. Lo baja `revealImage()`.
   */
  const [holdingLastFrame, setHoldingLastFrame] = useState(false);
  /**
   * El panel de datos está a la vista. Se puede plegar con la X para dejarle al
   * plano la pantalla entera.
   */
  /* Arranca con el panel abierto solo si la caja da para tenerlo AL LADO del
     plano. Es el mismo criterio de Océano, Venecia y Altamira —y el de la ficha
     de `unidad/[id]` de este mismo repo—: por debajo de `xl` el panel es una
     hoja a pantalla completa, así que abrirlo de entrada taparía el plano que
     se acaba de pedir. En la ventana girada la caja mide 812, no 1280: se
     entra al plano, y el panel se llama desde el botón de información. */
  const [showDetails, setShowDetails] = useState(() => appBoxWidth() >= 1280);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const galleryImageTitles = [
    'Cocina y Comedor',
    'Sala de Estar y Comedor',
    'Cocina y Desayunador',
    'Baño Principal',
    'Dormitorio Principal',
    'Dormitorio Secundario',
    'Dormitorio / Estudio',
    'Área de Servicio y Cocina',
  ];

  const galleryImages = useMemo(() => {
    if (!unit.gallery || unit.gallery.length === 0) return [];
    return unit.gallery.map((path, idx) => ({
      id: `${unit.id}-gallery-${idx}`,
      src: getAssetUrl(path),
      alt: `${unit.identifier} — ${galleryImageTitles[idx] || `Foto ${idx + 1}`}`,
      title: galleryImageTitles[idx] || `Foto ${idx + 1}`,
      description: context ? `${context} · Dpto. ${unit.identifier}` : `Departamento ${unit.identifier}`,
    }));
  }, [unit.gallery, unit.id, unit.identifier, context]);

  /**
   * Las tres tomas, pedidas de una vez al abrir.
   */
  useEffect(() => {
    if (!type) return;
    preloadImages(apartmentViewOrder.map((v) => getAssetUrl(type.images[v]))).catch(() => {});
  }, [type]);

  const isAnimating = transition !== null && !holdingLastFrame;

  const goTo = useCallback(
    (next: ApartmentView) => {
      if (!type || isAnimating || next === view) return;

      const video = apartmentTransition(type, view, next);
      if (!video) {
        setView(next);
        setTransition(null);
        setHoldingLastFrame(false);
        return;
      }

      setHoldingLastFrame(false);
      setTransition({ url: getAssetUrl(video), to: next });
    },
    [type, isAnimating, view],
  );

  const endTransition = useCallback(() => {
    if (!transition) return;
    setView(transition.to);
    setHoldingLastFrame(true);
  }, [transition]);

  const revealImage = useCallback(() => {
    setTransition(null);
    setHoldingLastFrame(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleShare = async () => {
    const shareData = {
      title: `Dpto. ${unit.identifier} - El Olimpo de Tumbes`,
      text: `Conoce el departamento ${unit.identifier} en El Olimpo de Tumbes`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const [leftTarget, rightTarget] = useMemo(
    () => apartmentViewOrder.filter((item) => item !== view),
    [view],
  );

  const imageKey = type?.images[view] ?? null;
  const posterKey = unit.gallery?.[1] || unit.gallery?.[0] || (type?.images[defaultApartmentView] ?? null);
  const isAvailable = unit.status === UnitStatus.AVAILABLE;

  return (
    <div className="absolute inset-0 z-40 flex bg-gray-50 text-neutral-800 animate-in fade-in duration-300">
      <RequestInfoModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        unitId={unit.id}
        unitIdentifier={unit.identifier}
        floorId={floorLabel ?? ''}
      />

      {/* PANEL DE DATOS LATERAL (Blanco, estilo Océano) */}
      {showDetails && (
        <aside className="relative z-10 flex w-full xl:w-[clamp(320px,30%,420px)] shrink-0 flex-col bg-white shadow-xl border-r border-gray-100">
          <header className="px-6 pt-16 pb-2">
            <button
              type="button"
              onClick={onClose}
              title="Volver a la planta"
              className="p-2 -ml-2 rounded-full text-neutral-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="flex justify-between items-start pt-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 xl:text-3xl">
                  {unit.identifier}
                </h2>
                <p className="text-sm font-medium text-slate-500 xl:text-base">
                  {unit.subtitle || 'Flat'}
                </p>
                {context && (
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{context}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${STATUS_BADGE[unit.status]}`}
                >
                  {UnitStatusLabel[unit.status]}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartir"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Share2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  title="Ocultar los datos y ver el plano a pantalla completa"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 xl:py-8 xl:space-y-8">
            {/* Cartel de disponibilidad */}
            <div
              className="hidden xl:block relative overflow-hidden rounded-xl bg-neutral-200 py-12 text-center shadow-inner"
              style={
                posterKey
                  ? {
                      backgroundImage: `url(${getAssetUrl(posterKey)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-black/40" />
              <p className="relative z-10 font-serif italic text-lg text-white drop-shadow-md">
                {isAvailable ? 'Esta unidad está disponible' : 'Esta unidad no está disponible'}
              </p>
            </div>

            <div className="hidden xl:block border-t border-gray-100" />

            {/* Instalaciones */}
            <div>
              <h3 className="hidden xl:block mb-6 text-xs font-bold uppercase tracking-widest text-neutral-900">
                Instalaciones
              </h3>
              <ul className="flex items-start justify-center gap-10 rounded-2xl bg-gray-50 p-4 xl:block xl:space-y-6 xl:rounded-none xl:bg-transparent xl:p-0">
                <Instalacion
                  Icon={Ruler}
                  value={`Área total ${(unit.areaSqm || 50).toLocaleString('es-PE')} m²`}
                />
                <Instalacion
                  Icon={Bed}
                  value={`${unit.bedrooms !== undefined ? unit.bedrooms : 3} Dormitorios`}
                />
                <Instalacion
                  Icon={Bath}
                  value={`${unit.bathrooms !== undefined ? unit.bathrooms : 1} ${
                    (unit.bathrooms !== undefined ? unit.bathrooms : 1) === 1 ? 'Baño' : 'Baños'
                  }`}
                />
              </ul>

              <p className="hidden xl:block mt-6 text-xs leading-relaxed text-neutral-400">
                Las medidas de cada ambiente están rotuladas en la vista{' '}
                {ApartmentViewLabel[ApartmentView.MEASURED]}.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white p-4 xl:p-6">
            <button
              type="button"
              onClick={() => setIsRequestOpen(true)}
              className="group flex w-full cursor-pointer items-center justify-between py-2"
            >
              <span className="text-sm font-bold text-neutral-900 transition-colors group-hover:text-brand-primary">
                Solicitar información
              </span>
              <Mail
                size={22}
                className="text-gray-300 transition-colors group-hover:text-brand-primary"
              />
            </button>
          </div>
        </aside>
      )}

      {/* LIENZO DEL PLANO */}
      <div
        className={`relative min-w-0 flex-1 overflow-hidden bg-white ${
          showDetails ? 'hidden xl:block' : 'block'
        }`}
      >
        {/* Envoltorio con el padding: TransitionVideo mide su propio contenedor
            para tapar la costura del video justo en su borde real (y no en el
            padding vacío), sea cual sea el tamaño de pantalla. */}
        <div className="absolute inset-0 p-4 md:p-8">
          {imageKey && (
            <img
              key={imageKey}
              src={getAssetUrl(imageKey)}
              alt={`${UnitKindLabel[unit.kind]} ${unit.identifier} · ${ApartmentViewLabel[view]}`}
              onLoad={revealImage}
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
                revealImage();
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}

          {transition && (
            <TransitionVideo
              src={transition.url}
              onEnded={endTransition}
              onError={() => {
                console.error('No se pudo reproducir la transición del departamento:', transition.url);
                setView(transition.to);
                revealImage();
              }}
            />
          )}
        </div>

        {/* Botón para recuperar panel cuando está oculto */}
        {!showDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="absolute left-6 top-20 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-black/40 px-5 py-3 text-white backdrop-blur transition-all hover:bg-black/60 shadow-lg"
          >
            <Info size={20} />
            <span className="text-sm font-medium uppercase tracking-wide">{unit.identifier}</span>
          </button>
        )}

        {/* Botón volver cuando el panel está oculto */}
        {!showDetails && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-[4.5rem] top-5 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-black/40 px-5 py-2.5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-lg"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-medium uppercase tracking-wide">Volver a la planta</span>
          </button>
        )}

        {/* Pastillas laterales para alternar entre vistas */}
        {type && !isAnimating && (
          <>
            {leftTarget && (
              <button
                type="button"
                onClick={() => goTo(leftTarget)}
                className="group absolute left-6 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer items-center gap-3 rounded-full bg-black/40 p-3 pr-5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-xl"
              >
                <ChevronLeft size={28} className="transition-transform group-hover:-translate-x-1" />
                <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">
                  {ApartmentViewLabel[leftTarget]}
                </span>
              </button>
            )}

            {rightTarget && (
              <button
                type="button"
                onClick={() => goTo(rightTarget)}
                className="group absolute right-6 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer items-center gap-3 rounded-full bg-black/40 p-3 pl-5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-xl"
              >
                <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">
                  {ApartmentViewLabel[rightTarget]}
                </span>
                <ChevronRight size={28} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </>
        )}

        {/* Botones en la Esquina Superior Derecha (Galería, Recorrido Kuula, Pantalla Completa) */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
          {galleryImages.length > 0 && (
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2 bg-brand-primary/85 text-white hover:bg-brand-primary hover:scale-105 cursor-pointer font-bold text-xs uppercase tracking-wider"
              title="Ver Galería de Fotos"
            >
              <Images size={18} />
              <span>Galería ({galleryImages.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTourOpen(true)}
            className="px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2 bg-brand-primary/85 text-white hover:bg-brand-primary hover:scale-105 cursor-pointer font-bold text-xs uppercase tracking-wider"
            title="Abrir Recorrido Virtual 360°"
          >
            <Rotate3d size={18} />
            <span>Recorrido</span>
          </button>

          <FullScreenToggle />
        </div>

        {!type && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm uppercase tracking-widest text-neutral-400">
              Sin planos para esta unidad
            </p>
          </div>
        )}
      </div>

      {/* Visor inmersivo de Galería */}
      <GalleryViewer
        images={galleryImages}
        initialIndex={0}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Visor inmersivo de Recorrido Virtual 360° en Kuula */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
          <TourHeader
            title={`Recorrido Virtual 360° · Dpto. ${unit.identifier}`}
            subtitle={context ? `${context} · 50 m²` : `El Olimpo de Tumbes · 50 m²`}
            onBack={() => setIsTourOpen(false)}
          />
          <div className="flex-1 w-full h-full pt-0">
            <iframe
              src={unit.tourUrl || APARTMENT_TOUR_URL}
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking; gyroscope; accelerometer"
              title={`Recorrido 360 Dpto ${unit.identifier}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartamentoFicha;

