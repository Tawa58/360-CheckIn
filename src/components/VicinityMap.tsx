import React, {useMemo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, G, Polygon, Text as SvgText} from 'react-native-svg';
import {metersOffset, type GeofenceReading} from '../../shared/geofence';
import type {GeofenceSite} from '../../shared/types';

type Props = {
  site: GeofenceSite;
  location: {latitude: number; longitude: number} | null;
  outside: boolean;
  muted?: boolean;
  reading: GeofenceReading | null;
};

const MAP_W = 640;
const MAP_H = 400;
const MAP_ZOOM = 18;

function metersPerPixel(latitude: number, zoom: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
}

export function VicinityMap({site, location, outside, muted}: Props) {
  const fence = muted ? '#6EE7B7' : '#10B981';
  const fill = muted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.28)';
  const marker = muted ? '#64748B' : outside ? '#E11D48' : '#059669';
  const mpp = metersPerPixel(site.latitude, MAP_ZOOM);
  const radiusPx = site.radiusMeters / mpp;
  const cx = MAP_W / 2;
  const cy = MAP_H / 2;
  const offset = location
    ? metersOffset(site, location.latitude, location.longitude)
    : {east: 0, north: 0};
  const userX = cx + offset.east / mpp;
  const userY = cy - offset.north / mpp;
  const vertices = (site.vertices ?? []).map(point => {
    const vertexOffset = metersOffset(site, point.latitude, point.longitude);
    return `${cx + vertexOffset.east / mpp},${cy - vertexOffset.north / mpp}`;
  });
  const mapUri = useMemo(
    () =>
      `https://staticmap.openstreetmap.de/staticmap.php?center=${site.latitude},${site.longitude}&zoom=${MAP_ZOOM}&size=${MAP_W}x${MAP_H}&maptype=mapnik`,
    [site.latitude, site.longitude],
  );

  return (
    <View className="overflow-hidden rounded-3xl bg-emerald-50">
      <View style={{height: 288}}>
        <Image source={{uri: mapUri}} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
        <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
          {vertices.length >= 3 ? (
            <Polygon
              points={vertices.join(' ')}
              fill="none"
              stroke={fence}
              strokeWidth={2}
              strokeDasharray="6 5"
            />
          ) : null}
          <Circle
            cx={cx}
            cy={cy}
            r={radiusPx}
            fill={fill}
            stroke={fence}
            strokeWidth={4}
            strokeDasharray="10 8"
          />
          {location ? (
            <G>
              <Circle cx={userX} cy={userY} r={16} fill={marker} opacity={0.2} />
              <Circle cx={userX} cy={userY} r={9} fill={marker} stroke="#fff" strokeWidth={3} />
              <SvgText
                x={userX + 16}
                y={userY + 4}
                fontSize="13"
                fontWeight="800"
                fill="#0F172A">
                YOU
              </SvgText>
            </G>
          ) : null}
        </Svg>
        <View className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5">
          <Text className="text-[11px] font-semibold text-ink-700">
            Company boundary ({site.radiusMeters} m)
          </Text>
        </View>
      </View>
    </View>
  );
}
