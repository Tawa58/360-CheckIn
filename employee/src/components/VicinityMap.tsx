import {useEffect, useMemo, useRef, useState} from 'react';
import {LocateFixed} from 'lucide-react';
import type {GeofenceReading} from '@shared/geofence';
import type {GeofenceSite} from '@shared/types';

type Props = {
  site: GeofenceSite;
  location: {latitude: number; longitude: number} | null;
  outside: boolean;
  muted?: boolean;
  reading: GeofenceReading | null;
};

type MapTile = {
  key: string;
  cartoUrl: string;
  osmUrl: string;
  left: number;
  top: number;
};

const TILE_SIZE = 256;

function project(latitude: number, longitude: number, zoom: number): {x: number; y: number} {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((longitude + 180) / 360) * scale;
  const sinLat = Math.sin((latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return {x, y};
}

function metersPerPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
}

function zoomForRadius(radiusMeters: number, latitude: number, height: number): number {
  for (let zoom = 18; zoom >= 13; zoom -= 1) {
    const radiusPx = radiusMeters / metersPerPixel(latitude, zoom);
    if (radiusPx * 2.4 < height) {
      return zoom;
    }
  }
  return 13;
}

function wrapTile(value: number, zoom: number): number {
  const count = 2 ** zoom;
  return ((value % count) + count) % count;
}

export function VicinityMap({site, location, outside, muted, reading}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 360, height: 288});

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }
    const updateSize = () => {
      setSize({
        width: Math.max(1, element.clientWidth),
        height: Math.max(1, element.clientHeight),
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const zoom = zoomForRadius(site.radiusMeters, site.latitude, size.height);
    const center = project(site.latitude, site.longitude, zoom);
    const left = center.x - size.width / 2;
    const top = center.y - size.height / 2;
    const startX = Math.floor(left / TILE_SIZE);
    const startY = Math.floor(top / TILE_SIZE);
    const endX = Math.floor((left + size.width) / TILE_SIZE);
    const endY = Math.floor((top + size.height) / TILE_SIZE);
    const tiles: MapTile[] = [];

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const tileX = wrapTile(x, zoom);
        tiles.push({
          key: `${zoom}-${tileX}-${y}`,
          cartoUrl: `https://tile.openstreetmap.org/${zoom}/${tileX}/${y}.png`,
          osmUrl: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${y}.png`,
          left: x * TILE_SIZE - left,
          top: y * TILE_SIZE - top,
        });
      }
    }

    const vertices = (site.vertices ?? []).map(point => {
      const projected = project(point.latitude, point.longitude, zoom);
      return {x: projected.x - left, y: projected.y - top};
    });
    const user = location
      ? (() => {
          const point = project(location.latitude, location.longitude, zoom);
          return {x: point.x - left, y: point.y - top};
        })()
      : null;

    return {
      tiles,
      radiusPx: site.radiusMeters / metersPerPixel(site.latitude, zoom),
      vertices,
      user,
    };
  }, [location, site.latitude, site.longitude, site.radiusMeters, site.vertices, size.height, size.width]);

  const fence = muted ? '#6ee7b7' : '#10b981';
  const fill = muted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.28)';
  const marker = muted ? '#64748b' : outside ? '#e11d48' : '#059669';

  return (
    <div
      ref={containerRef}
      className="vicinity-map relative isolate overflow-hidden rounded-[1.6rem] bg-emerald-50 ring-1 ring-slate-200/80 dark:ring-slate-700">
      <div className="relative h-72 w-full">
        {layout.tiles.map(tile => (
          <img
            key={tile.key}
            alt=""
            src={tile.cartoUrl}
            className="pointer-events-none absolute max-w-none"
            style={{left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE}}
            draggable={false}
            onError={event => {
              const image = event.currentTarget;
              if (image.dataset.fallback === '1') {
                return;
              }
              image.dataset.fallback = '1';
              image.src = tile.osmUrl;
            }}
          />
        ))}
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${size.width} ${size.height}`}>
          <circle
            cx={size.width / 2}
            cy={size.height / 2}
            r={Math.max(8, layout.radiusPx)}
            fill={fill}
            stroke={fence}
            strokeWidth="3"
            strokeDasharray="10 8"
          />
          {layout.vertices.map((point, index) => (
            <circle key={`vertex-${index}`} cx={point.x} cy={point.y} r="4" fill={fence} stroke="#fff" strokeWidth="1.5" />
          ))}
          {layout.user ? (
            <g>
              <circle cx={layout.user.x} cy={layout.user.y} r="16" fill={marker} opacity="0.2" />
              <circle cx={layout.user.x} cy={layout.user.y} r="8" fill={marker} stroke="#fff" strokeWidth="3" />
              <text
                x={layout.user.x + 14}
                y={layout.user.y + 4}
                fontSize="11"
                fontWeight="800"
                fill="#0f172a">
                YOU
              </text>
            </g>
          ) : null}
        </svg>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900/90 dark:text-slate-200 dark:ring-slate-700">
        <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-dashed border-emerald-500 align-middle" />
        Company boundary ({site.radiusMeters} m)
      </div>
      <button
        type="button"
        onClick={() => setSize(current => ({...current}))}
        aria-label="Recenter on company boundary"
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
        <LocateFixed className="h-4 w-4" />
      </button>
      {reading ? (
        <p className="sr-only">
          {outside
            ? `Outside the green boundary. ${Math.round(reading.fromBoundary)} metres from the demarcation, ${Math.round(reading.fromCentre)} metres from the centre.`
            : `Inside the green boundary. ${Math.round(reading.fromCentre)} metres from the centre.`}
        </p>
      ) : null}
    </div>
  );
}
