"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import MapComponent from '@/components/map/Map';
import Sidebar from '@/components/layout/Sidebar';
import { Search, MapPin, Menu, ChevronDown, ChevronUp, Car, Footprints, Bike, Navigation, X } from 'lucide-react';
import { locationsData, type LocationFeature } from '@/data/locations'; 

const DirectionsPage = () => {
  const [filter, setFilter] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize panel open on desktop
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.innerWidth >= 768;
    }
    return false;
  });
  
  const [searchMode, setSearchMode] = useState<'explore' | 'directions'>('explore');
  const [originLocation, setOriginLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [routeStats, setRouteStats] = useState<{ driving: {duration:number}; walking: {duration:number}; cycling: {duration:number} } | null>(null);

  const categories = Array.from(new Set(locationsData.features.map((f: LocationFeature) => f.properties.categoria))).filter(Boolean) as string[];

  const filteredLocations = locationsData.features.filter((feature: LocationFeature) => {
    if (feature.properties.nombre === 'Santa Fe') return false;

    const matchesSearch = feature.properties.nombre.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = selectedCategory ? feature.properties.categoria === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (searchMode === 'directions' && filter.length > 2) {
        const timer = setTimeout(async () => {
            try {
                if (!MAPBOX_TOKEN) return;
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(filter)}.json?access_token=${MAPBOX_TOKEN}&country=pe&limit=5&proximity=-77.067632,-12.07592`
                );
                const data = await response.json();
                setSearchResults(data.features || []);
            } catch (error) {
                console.error("Error searching places:", error);
            }
        }, 500);
        return () => clearTimeout(timer);
    } else if (searchMode === 'directions') {
        setSearchResults([]);
    }
  }, [filter, searchMode]);

  const handleLocationSelect = (coords: [number, number], name?: string) => {
    if (name) setSelectedName(name);
    
    if (searchMode === 'explore') {
        setDestination(coords);
        setOriginLocation(null); 
    } else {
        setOriginLocation(coords);
        setDestination(null); 
    }
    
    if (window.innerWidth < 768) setIsPanelOpen(false);
  };

  const handleRouteCalculated = useCallback((stats: any | null) => {
    setRouteStats(prev => {
        if (JSON.stringify(prev) === JSON.stringify(stats)) return prev;
        return stats;
    });
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-200">
        <div className="absolute inset-0 z-0">
             <MapComponent 
                destination={destination}
                origin={originLocation}
                onMarkerClick={(coords, name) => {
                    // Only handle marker clicks in explore mode primarily, or to set destination
                    if (searchMode === 'explore') handleLocationSelect(coords, name);
                }}
                transportMode={transportMode}
                onRouteCalculated={handleRouteCalculated}
                locations={filteredLocations}
                padding={useMemo(() => {
                    // Only push map on desktop where panel is sidebar
                    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768; 
                    return { 
                        top: 0, 
                        bottom: 0, 
                        left: (isPanelOpen && isDesktop) ? 480 : 0, 
                        right: 0 
                    };
                }, [isPanelOpen])}
             />
        </div>

        {/* Top Left Controls Container */}
        <div 
            className="fixed top-6 left-6 z-30 flex items-center gap-4 pointer-events-none"
            style={{ top: 'calc(1.5rem + env(safe-area-inset-top))', left: 'calc(1.5rem + env(safe-area-inset-left))' }}
        >
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-white bg-brand-primary rounded-full hover:bg-brand-dark-orange transition-colors cursor-pointer shadow-lg pointer-events-auto"
            >
                <Menu size={24} />
            </button>
            
            {/* Page Title - Outside Panel */}
            <h1 className="text-2xl font-secondary font-bold text-gray-900 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-md pointer-events-auto">
                Direcciones
            </h1>
        </div>

        {/* Top Right Controls - Travel Modes & Info */}
        <div 
            className="fixed top-6 right-16 z-30 flex flex-col gap-4 items-end pointer-events-none"
            style={{ top: 'calc(1.5rem + env(safe-area-inset-top))', right: 'calc(4rem + env(safe-area-inset-right))' }}
        >
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => setTransportMode('driving')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all pointer-events-auto ${transportMode === 'driving' ? 'bg-brand-orange text-white scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Auto"
                >
                    <Car size={20} />
                    {routeStats && <span className="text-xs font-bold">{formatDuration(routeStats.driving.duration)}</span>}
                </button>
                <button 
                    onClick={() => setTransportMode('walking')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all pointer-events-auto ${transportMode === 'walking' ? 'bg-brand-orange text-white scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Caminar"
                >
                    <Footprints size={20} />
                    {routeStats && <span className="text-xs font-bold">{formatDuration(routeStats.walking.duration)}</span>}
                </button>
                <button 
                    onClick={() => setTransportMode('cycling')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all pointer-events-auto ${transportMode === 'cycling' ? 'bg-brand-orange text-white scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    title="Bicicleta"
                >
                    <Bike size={20} />
                    {routeStats && <span className="text-xs font-bold">{formatDuration(routeStats.cycling.duration)}</span>}
                </button>
            </div>
        </div>
        
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Floating Toggle Button - Mobile Only (Visible when panel closed) */}
        {!isPanelOpen && (
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 md:hidden pointer-events-auto">
                <button
                    onClick={() => setIsPanelOpen(true)}
                    className="flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-full shadow-lg hover:bg-brand-dark-orange transition-colors"
                >
                    <ChevronUp size={20} />
                    <span className="font-bold text-sm">Ver Panel</span>
                </button>
             </div>
        )}

        {/* Floating Bottom Panel (Console) */}
        <div 
            className={`fixed bottom-0 md:bottom-6 left-0 md:left-6 w-full md:w-[450px] bg-white md:rounded-2xl shadow-2xl z-20 flex flex-col transition-all duration-500 ease-in-out h-full md:h-auto md:max-h-[70%] ${isPanelOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full md:translate-y-[calc(100%-180px)] opacity-100 pointer-events-none'}`}
        >
             
             {/* Handler / Header Area */}
             <div 
                className="p-4 border-b border-gray-100 flex flex-col gap-4 cursor-pointer bg-white md:rounded-t-2xl"
                onClick={(e) => {
                    // Prevent toggling when clicking inputs or buttons
                    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).closest('button')) return;
                    setIsPanelOpen(!isPanelOpen); 
                }}
             >
                {/* Header Content */}
                <div className="flex flex-col gap-2 w-full">
                    
                    {/* Close Handle / Arrow - Top Center (User Request) */}
                    <div className="w-full flex justify-center pb-1">
                        <button 
                            className="text-gray-400 hover:text-brand-orange p-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPanelOpen(!isPanelOpen);
                            }}
                        >
                            {isPanelOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                        </button>
                    </div>

                    {/* Active Selection Capsule OR Clear Button */}
                    {(selectedName || filter || originLocation || destination) && (
                        <div className="flex justify-end">
                            {selectedName ? (
                                <button
                                    onClick={() => {
                                        setFilter('');
                                        setOriginLocation(null);
                                        if (searchMode === 'directions') setDestination(null);
                                        if (searchMode === 'explore') setDestination(null);
                                        else setOriginLocation(null);
                                        setSearchResults([]);
                                        setRouteStats(null);
                                        setSelectedName(null);
                                    }}
                                    className="flex items-center gap-2 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-dark-orange transition-colors px-3 py-1.5 rounded-full shadow-md"
                                >
                                    <MapPin size={12} className="fill-current" />
                                    {selectedName}
                                    <div className="bg-white/20 rounded-full p-0.5 ml-1 hover:bg-white/30">
                                        <X size={12} />
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setFilter('');
                                        setOriginLocation(null);
                                        if (searchMode === 'directions') setDestination(null);
                                        if (searchMode === 'explore') setDestination(null);
                                        else setOriginLocation(null);
                                        setSearchResults([]);
                                        setRouteStats(null);
                                        setSelectedName(null);
                                    }}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-orange transition-colors px-2 py-1 rounded-full hover:bg-gray-100"
                                >
                                    <X size={14} />
                                    Limpiar selección
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        {/* Mode Tabs */}
                        <div className="flex bg-gray-100 rounded-lg p-1 shrink-0 self-start md:self-center">
                            <button
                                onClick={() => { setSearchMode('explore'); setFilter(''); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchMode === 'explore' ? 'bg-white text-brand-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Explorar
                            </button>
                            <button
                                onClick={() => { setSearchMode('directions'); setFilter(''); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${searchMode === 'directions' ? 'bg-white text-brand-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Cómo llegar
                            </button>
                        </div>

                        
                        {/* Search - Inline with subtitle */}
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange" size={16} />
                            <input 
                                type="text" 
                                placeholder={searchMode === 'explore' ? "Buscar lugares cercanos..." : "Ingresa tu ubicación..."}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                            />
                        </div>
                    </div>
                </div>
             </div>

             {/* Content (Scrollable) */}
             <div className="flex-1 flex flex-col overflow-hidden bg-white md:rounded-b-2xl">
                {searchMode === 'explore' && (
                    <div className="p-4 pb-2 space-y-3 shrink-0 bg-white border-b border-gray-100">
                        {/* Categories - Horizontal Scroll */}
                        <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin">
                            <button 
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium text-center transition-colors whitespace-nowrap shrink-0 ${!selectedCategory ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todos
                            </button>
                            {categories.map((cat) => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium text-center transition-colors whitespace-nowrap shrink-0 ${selectedCategory === cat ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    title={cat}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 pt-4 space-y-2">
                    {searchMode === 'explore' ? (
                        filteredLocations.length > 0 ? (
                            filteredLocations.map((feature: any) => (
                                <div 
                                    key={feature.id || feature.properties.nombre} 
                                    onClick={() => handleLocationSelect(feature.geometry.coordinates, feature.properties.nombre)}
                                    className="p-3 rounded-lg border border-gray-100 hover:border-brand-orange/30 hover:bg-orange-50/30 transition-all cursor-pointer group flex items-start gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white p-1.5 shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        {feature.properties.imagen ? (
                                            <img 
                                                src={`/${feature.properties.imagen}`} 
                                                alt={feature.properties.nombre}
                                                className="w-full h-full object-contain"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                        ) : (
                                            <MapPin size={20} className="text-gray-400 group-hover:text-brand-orange" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">{feature.properties.nombre}</h3>
                                        <p className="text-xs text-brand-orange font-medium">{feature.properties.categoria}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No se encontraron resultados
                            </div>
                        )
                    ) : (
                        // Search Results for Directions
                        searchResults.length > 0 ? (
                            searchResults.map((feature: any) => (
                                <div 
                                    key={feature.id} 
                                    onClick={() => handleLocationSelect(feature.center, feature.text)}
                                    className="p-3 rounded-lg border border-gray-100 hover:border-brand-orange/30 hover:bg-orange-50/30 transition-all cursor-pointer group flex items-start gap-3"
                                >
                                    <div className="p-2 rounded bg-orange-50 text-brand-orange transition-colors">
                                        <Navigation size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800">{feature.text}</h3>
                                        <p className="text-xs text-brand-orange font-medium truncate max-w-[250px]">{feature.place_name}</p>
                                    </div>
                                </div>
                            ))
                        ) : filter.length > 2 ? (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                Buscando...
                            </div>
                        ) : (
                             <div className="text-center py-10 text-gray-400 text-sm">
                                Ingresa una dirección para ver la ruta
                            </div>
                        )
                    )}
                </div>
             </div>
        </div>

    </div>
  );
};
export default DirectionsPage;
