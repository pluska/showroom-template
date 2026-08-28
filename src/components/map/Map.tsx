"use client";
import { useRef, useMemo, useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, Source, Layer, Popup } from 'react-map-gl/mapbox';
// import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { locationsData } from '@/data/locations';
import { getAssetUrl, getCanvasImageUrl } from '@/utils/assets';
import config from '@/config/config';
import LandmarkMarker from './LandmarkMarker';
import type { Landmark } from '@/data/landmarks';
import { projectOutlineCoordinates } from '@/data/project-outline';

/**
 * El plano del proyecto, dibujado sobre el terreno (archivo entregado:
 * `MAPA OLIMPO PNG.png`). Sustituye a la foto aérea `location/mapa_hd.webp`,
 * que sigue en el bucket sin usarse.
 *
 * Es un PNG con transparencia: el dibujo va en diagonal dentro del lienzo y
 * el resto es alfa, así que fuera del terreno no tapa el mapa.
 */
const PROJECT_MAP_IMAGE = 'location/mapa_olimpo.webp';

/**
 * Dónde cae el DIBUJO dentro del lienzo del PNG, en fracción 0–1 de la imagen.
 * Medido sobre el canal alfa del archivo entregado (opaco entre los píxeles
 * x 55–923 e y 0–777 de 1010×867).
 *
 * Hace falta porque el dibujo no llena su lienzo: si se estirara la imagen
 * entera sobre el terreno, el plano saldría encogido y desplazado hacia dentro
 * la anchura de sus márgenes transparentes.
 */
const IMAGE_CONTENT_BOUNDS = {
  left: 55 / 1010,
  right: 924 / 1010,
  top: 0 / 867,
  bottom: 778 / 867,
};

/**
 * Corrección fina de la posición del plano sobre el terreno, en metros.
 * Positivo = hacia el norte / hacia el este. Es el único sitio que hay que
 * tocar para recolocarlo.
 *
 * POR QUÉ HACE FALTA: el encaje se deduce de `projectOutlineCoordinates`, el
 * perímetro que mandó el cliente en su geojson. Es un trazo a mano alzada, no
 * un levantamiento: sirve para dar tamaño y orientación al plano, pero su
 * posición arrastra un error de más de cien metros. Sin corregir, el dibujo
 * caía en campo abierto al este del pueblo: sus calles morían sin llegar a las
 * de Santa Elena y Los Ficus, su acceso del noroeste no empalmaba con la
 * trocha, y la esquina sureste se montaba sobre Calle del Canal.
 *
 * DE DÓNDE SALEN ESTOS NÚMEROS: de cuadrar el dibujo contra el mapa base con
 * tres referencias a la vez —el acceso del noroeste sobre su trocha, el borde
 * oeste pegado al pueblo, y la esquina sureste despejada de Calle del Canal—.
 * Las tres se satisfacen moviendo el plano al noroeste; si una se ajusta sola,
 * las otras dos se rompen.
 */
const IMAGE_NUDGE_METERS = { north: 60, east: -110 };

/**
 * Las 4 esquinas del LIENZO del PNG, calculadas una sola vez.
 * Mapbox `image` source las necesita en orden:
 *   [top-left, top-right, bottom-right, bottom-left]
 * (cada una [lng, lat]).
 *
 * Se calculan al revés de lo que parece: lo que se cuadra con el terreno es el
 * dibujo, no el lienzo. Se hace coincidir el recuadro del dibujo con el
 * bounding box de `projectOutlineCoordinates`, se extrapolan las esquinas del
 * lienzo desde ahí y se aplica `IMAGE_NUDGE_METERS`. El recuadro del dibujo y
 * el del perímetro tienen la misma proporción (1,117 contra 1,123), así que el
 * plano cae sobre el terreno sin deformarse.
 */
const computeImageCoords = (): [[number, number], [number, number], [number, number], [number, number]] => {
  const lngs = projectOutlineCoordinates.map(c => c[0]);
  const lats = projectOutlineCoordinates.map(c => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Cuánto terreno abarca el lienzo ENTERO, deducido de la parte que ocupa el
  // dibujo dentro de él.
  const lngSpan = (maxLng - minLng) / (IMAGE_CONTENT_BOUNDS.right - IMAGE_CONTENT_BOUNDS.left);
  const latSpan = (maxLat - minLat) / (IMAGE_CONTENT_BOUNDS.bottom - IMAGE_CONTENT_BOUNDS.top);

  // Metros → grados, a la latitud del proyecto.
  const midLat = (minLat + maxLat) / 2;
  const dLat = IMAGE_NUDGE_METERS.north / 110574;
  const dLng = IMAGE_NUDGE_METERS.east / (111320 * Math.cos((midLat * Math.PI) / 180));

  const canvasMinLng = minLng - IMAGE_CONTENT_BOUNDS.left * lngSpan + dLng;
  const canvasMaxLng = canvasMinLng + lngSpan;
  // En la imagen, y = 0 es arriba: le corresponde la latitud MAYOR.
  const canvasMaxLat = maxLat + IMAGE_CONTENT_BOUNDS.top * latSpan + dLat;
  const canvasMinLat = canvasMaxLat - latSpan;

  return [
    [canvasMinLng, canvasMaxLat], // top-left
    [canvasMaxLng, canvasMaxLat], // top-right
    [canvasMaxLng, canvasMinLat], // bottom-right
    [canvasMinLng, canvasMinLat], // bottom-left
  ];
};
const IMAGE_COORDS = computeImageCoords();

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/light-v11';

/**
 * El punto del proyecto. Es a la vez dónde se pincha el marcador principal y
 * el extremo de toda ruta que se calcula contra "el proyecto".
 *
 * Va aparte del encuadre inicial a propósito: antes el marcador y las rutas
 * leían `INITIAL_VIEW_STATE`, así que mover la cámara de arranque movía TAMBIÉN
 * el proyecto por el mapa. Son dos cosas distintas: dónde está el proyecto y
 * desde dónde se mira.
 */
const PROJECT_COORDS: [number, number] = config.company.buildingCoordinates;

/**
 * Encuadre de arranque: Tumbes entera con el proyecto a la derecha, tal y como
 * lo pidió el cliente. No se centra en el proyecto —se centra al oeste de él—
 * para que el visitante vea de un vistazo el proyecto Y la ciudad a la que
 * pertenece; centrado en el marcador, a la ciudad no le quedaba sitio.
 *
 * El zoom está medido para una ventana de escritorio ancha. En una pantalla
 * más estrecha se ve menos ciudad a los lados, no otra cosa: el centro manda.
 */
const INITIAL_VIEW_STATE = {
  latitude: -3.5654,
  longitude: -80.4218,
  zoom: 15.2,
  bearing: 0,
  pitch: 0
};

interface RouteStats {
    duration: number; // seconds
    distance: number; // meters
}

interface MapProps {
    destination?: [number, number] | null; // [lng, lat]
    origin?: [number, number] | null; // [lng, lat]
    padding?: { top: number; bottom: number; left: number; right: number };
    onMarkerClick?: (coordinates: [number, number], name?: string) => void;
    transportMode?: 'driving' | 'walking' | 'cycling';
    onRouteCalculated?: (stats: { driving: RouteStats; walking: RouteStats; cycling: RouteStats } | null) => void;
    locations?: any[]; // Feature[]
    landmarks?: Landmark[];
    /** Travel time from the project to each landmark, in seconds, keyed by slug. */
    landmarkDurations?: Record<string, number>;
    /** Slug of the clip currently playing, if any. */
    openLandmarkSlug?: string | null;
    onLandmarkOpen?: (slug: string) => void;
}

export default function MapComponent({ destination, origin, padding, onMarkerClick, transportMode = 'driving', onRouteCalculated, locations, landmarks, landmarkDurations, openLandmarkSlug, onLandmarkOpen }: MapProps) {
  const mapRef = useRef<any>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  // Only one hito card shows at a time, and it is lifted above the project pin.
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);

  // Use passed locations or default to all if not provided (fallback)
  const displayLocations = locations || locationsData.features;

  // Fetch Route when destination changes
  useEffect(() => {
    const fetchRoute = async () => {
        try {
            if (!MAPBOX_TOKEN) return;

            // Determine start and end points
            let start: [number, number];
            let end: [number, number];

            if (destination && !origin) {
                // Explore Mode: From el proyecto TO Destination
                start = PROJECT_COORDS;
                end = destination;
            } else if (origin) {
                // Search Mode: From Origin TO el proyecto
                start = origin;
                end = PROJECT_COORDS;
            } else {
                // No route to calculate
                setRouteGeoJSON(null);
                setRouteStats(null);
                if (onRouteCalculated) onRouteCalculated(null);
                return;
            }

            // Fetch estimates for all modes
            const modes = ['driving', 'walking', 'cycling'] as const;
            const requests = modes.map(mode => 
                fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`)
                .then(res => res.json() as Promise<any>)
            );

            const results = await Promise.all(requests);
            const stats: any = {};
            let currentModeData: any = null;

            results.forEach((json, index) => {
                const mode = modes[index];
                if (json.routes && json.routes.length > 0) {
                    const data = json.routes[0];
                    stats[mode] = {
                        duration: data.duration,
                        distance: data.distance
                    };
                    if (mode === transportMode) {
                        currentModeData = data;
                    }
                } else {
                    stats[mode] = { duration: 0, distance: 0 };
                }
            });

            // Pass all stats to parent
            if (onRouteCalculated) {
                onRouteCalculated(stats);
            }

            // Render current mode route
            if (currentModeData) {
                const route = currentModeData.geometry.coordinates;
                const geojson = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route
                    }
                };
                
                // Only update if changed prevents some internal re-renders but mainly we rely on parent fix
                setRouteGeoJSON(geojson);
                setRouteStats({
                    duration: currentModeData.duration,
                    distance: currentModeData.distance
                });
            }

            // Fit bounds to show route
            // We want to fit bounds when route changes OR padding changes
            if (mapRef.current) {
                const minLng = Math.min(start[0], end[0]);
                const maxLng = Math.max(start[0], end[0]);
                const minLat = Math.min(start[1], end[1]);
                const maxLat = Math.max(start[1], end[1]);
                
                mapRef.current.fitBounds(
                    [[minLng, minLat], [maxLng, maxLat]],
                    { 
                        padding: padding || { top: 50, bottom: 50, left: 50, right: 50 },
                        maxZoom: 16,
                        duration: 1000 // Smooth animation
                    }
                );
            }

        } catch (error) {
            console.error("Error fetching directions:", error);
        }
    };

    fetchRoute();
  }, [destination, origin, padding, transportMode]);

  const markers = useMemo(() => {
    const list = displayLocations.map((feature: any) => (
      <Marker
        key={feature.id || feature.properties.nombre}
        longitude={feature.geometry.coordinates[0]}
        latitude={feature.geometry.coordinates[1]}
        anchor="bottom"
        onClick={(e: any) => {
            e.originalEvent.stopPropagation();
            if (onMarkerClick) onMarkerClick(feature.geometry.coordinates, feature.properties.nombre);
        }}
      >
        <div className="relative group cursor-pointer hover:z-50">
            {feature.properties.imagen ? (
                <div className="w-12 h-12 bg-white rounded-full p-2 shadow-md flex items-center justify-center hover:scale-125 transition-transform border border-brand-orange/20">
                    <img 
                        src={feature.properties.imagen.startsWith('http') || feature.properties.imagen.startsWith('/') ? feature.properties.imagen : `/${feature.properties.imagen}`}
                        alt={feature.properties.nombre}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
            ) : (
                <MapPin size={32} className="text-brand-orange drop-shadow-md hover:scale-125 transition-transform" />
            )}
        </div>
      </Marker>
    ));

      // Add Origin Marker if exists
      if (origin) {
          list.push(
              <Marker
                  key="origin-marker"
                  longitude={origin[0]}
                  latitude={origin[1]}
                  anchor="bottom"
              >
                  <div className="flex flex-col items-center z-50">
                      <div className="bg-brand-orange text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg mb-1 whitespace-nowrap">
                          Tu Ubicación
                      </div>
                      <MapPin size={28} className="text-brand-orange drop-shadow-md fill-current" />
                  </div>
              </Marker>
          );
      }

      return list;
  }, [onMarkerClick, origin, displayLocations]);

    const isForcedLandscape = useStore(state => state.isForcedLandscape);

    // Force Resize on Mount and Window Resize (Fix for gray areas)
    useEffect(() => {
        const handleResize = () => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        };

        // Initial resize after mount (with small delay to ensure container is ready)
        const timer = setTimeout(() => {
            handleResize();
        }, 100);

        // Listen for window resize events (includes orientation change)
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Force resize when forced landscape CSS transform is applied/removed.
    // CSS rotate(90deg) doesn't fire a window resize event, so Mapbox
    // would otherwise render at the wrong dimensions.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        }, 300); // wait for CSS transform to settle
        return () => clearTimeout(timer);
    }, [isForcedLandscape]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        onLoad={() => setStyleLoaded(true)}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        padding={padding}
        scrollZoom={true}
        dragPan={true}
        dragRotate={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
        touchPitch={true}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />

        {/* Foto aérea del terreno, alineada al bounding box del polígono.
            Espera a `onLoad`: añadir una Source antes de que el estilo
            termine de cargar revienta con "Style is not done loading". */}
        {styleLoaded && (
        <>
          {/*
            Por el proxy `/api/r2`, no por el dominio público del bucket:
            Mapbox descarga los `image` source con CORS y r2.dev no manda
            `Access-Control-Allow-Origin`, así que servido en directo la capa
            fallaba con "Failed to fetch" y no llegaba a pintarse nunca.
          */}
          <Source
            id="project-aerial"
            type="image"
            url={getCanvasImageUrl(PROJECT_MAP_IMAGE)}
            coordinates={IMAGE_COORDS}
          >
            <Layer
              id="project-aerial-layer"
              type="raster"
              source="project-aerial"
              paint={{ 'raster-opacity': 1 }}
            />
          </Source>

          {/*
            El perímetro NO se pinta. Era una línea azul alrededor del terreno,
            de cuando la capa era una foto aérea y hacía falta algo que dijera
            "hasta aquí llega el proyecto". Ahora la capa es el propio plano,
            que ya se delimita solo con su franja verde, y el trazo del cliente
            —hecho a mano alzada— no coincide con él: dibujarlo solo señalaba el
            desajuste. `projectOutlineCoordinates` se sigue usando, pero para
            calcular dónde va el plano (ver `computeImageCoords`), no para
            pintar nada.
          */}
        </>
        )}

        {/* Route Layer */}
        {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
                <Layer
                    id="route"
                    type="line"
                    source="route"
                    layout={{
                        'line-join': 'round',
                        'line-cap': 'round'
                    }}
                    paint={{
                        'line-color': config.colors.main, // Color de marca del proyecto
                        'line-width': 4,
                        'line-opacity': 0.8
                    }}
                />
            </Source>
        )}

        {markers}

        {/* Hitos — the surroundings that carry their own clip */}
        {(landmarks || []).map(landmark => (
            <Marker
                key={landmark.slug}
                longitude={landmark.coordinates[0]}
                latitude={landmark.coordinates[1]}
                anchor="bottom"
                style={{ zIndex: activeLandmark === landmark.slug ? 10000 : 100 }}
            >
                <LandmarkMarker
                    landmark={landmark}
                    duration={landmarkDurations?.[landmark.slug]}
                    active={activeLandmark === landmark.slug && !openLandmarkSlug}
                    onActiveChange={(slug, active) => setActiveLandmark(prev => active ? slug : (prev === slug ? null : prev))}
                    onSelect={(l) => onMarkerClick?.(l.coordinates, l.name)}
                    onOpen={(slug) => onLandmarkOpen?.(slug)}
                />
            </Marker>
        ))}

        {/* Marcador principal del proyecto */}
        <Marker longitude={PROJECT_COORDS[0]} latitude={PROJECT_COORDS[1]} anchor="bottom" style={{ zIndex: 9999 }}>
            <div className="relative flex flex-col items-center group cursor-pointer" style={{ zIndex: 9999 }}>
                 {/* Popup Card - Hover Only */}
                 <div className="absolute bottom-full mb-4 w-48 bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                    <div className="h-24 w-full relative">
                        <img 
                            src={getAssetUrl('building/photos/face_0_daylight.png')}
                            className="w-full h-full object-cover"
                            alt={config.company.buildingName}
                            // Mientras R2 no tenga la toma del proyecto, ocultarla
                            // en vez de dejar el ícono de imagen rota en la tarjeta.
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900/80 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-wider">
                            Urbanización
                        </div>
                    </div>
                    <div className="p-2">
                        <h3 className="text-xs font-bold text-gray-900 leading-tight mb-0.5">{config.company?.buildingName || config.appName}</h3>
                    </div>
                 </div>

                 {/* Pin/Logo */}
                 <div className="relative z-50 group-hover:scale-110 transition-transform duration-300">
                     <div className="w-20 h-20 bg-white rounded-full p-2 shadow-xl border-2 border-brand-orange relative z-10 flex items-center justify-center">
                        <img
                            src="/icons/olimpo/logo_olimpodetumbes.png"
                            className="w-full h-full object-contain" // Use contain to fit logo
                            alt={config.appName}
                        />
                     </div>
                     {/* Triangle pointer */}
                     <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-3 w-9 h-9 bg-brand-orange rotate-45 border-r border-b border-brand-orange/50 shadow-sm z-0"></div>
                 </div>
            </div>
        </Marker>

        {/* Route Info Popup */}
        {destination && routeStats && (
            <Popup
                longitude={destination[0]}
                latitude={destination[1]}
                anchor="bottom"
                offset={50} // Move it up above the pin
                closeButton={false}
                closeOnClick={false}
                className="z-10"
            >
                <div className="p-2 text-center bg-white rounded-lg shadow-sm">
                    <p className="text-lg font-bold text-gray-900 leading-none">
                        {Math.round(routeStats.duration / 60)} <span className="text-xs font-normal text-gray-500">min</span>
                    </p>
                    <p className="text-xs font-medium text-brand-orange">
                        {(routeStats.distance / 1000).toFixed(1)} km
                    </p>
                </div>
            </Popup>
        )}
      </Map>
    </div>
  );
}
