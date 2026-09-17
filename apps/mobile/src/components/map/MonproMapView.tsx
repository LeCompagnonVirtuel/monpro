import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors } from '@/theme/colors';

interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  type: 'professional' | 'request';
  title?: string;
  avatarUrl?: string;
  categoryName?: string;
  urgency?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  onPress?: () => void;
}

interface CircleData {
  id: string;
  center: [number, number];
  radius: number;
  color?: string;
  opacity?: number;
}

interface MapContextValue {
  registerMarker: (id: string, data: Omit<MarkerData, 'id'>) => void;
  unregisterMarker: (id: string) => void;
  registerCircle: (id: string, data: Omit<CircleData, 'id'>) => void;
  unregisterCircle: (id: string) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext() {
  return useContext(MapContext);
}

function getLeafletHTML(
  markers: MarkerData[],
  circles: CircleData[],
  center: [number, number],
  zoom: number,
): string {
  const markersJS = markers.map((m) => ({
    id: m.id,
    lat: m.latitude,
    lng: m.longitude,
    type: m.type,
    title: m.title || '',
    avatarUrl: m.avatarUrl || '',
    categoryName: m.categoryName || '',
    urgency: m.urgency || 'NORMAL',
    isAvailable: m.isAvailable || false,
    isVerified: m.isVerified || false,
  }));

  const circlesJS = circles.map((c) => ({
    id: c.id,
    lat: c.center[1],
    lng: c.center[0],
    radius: c.radius,
    color: c.color || '#071F49',
    opacity: c.opacity || 0.12,
  }));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;}
  .pro-marker{
    width:40px;height:40px;border-radius:20px;border:3px solid ${colors.surface};
    background:${colors.primary};display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);position:relative;
  }
  .pro-marker img{width:34px;height:34px;border-radius:17px;}
  .pro-marker .verified{
    position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:8px;
    background:${colors.success};border:2px solid ${colors.surface};
    display:flex;align-items:center;justify-content:center;
  }
  .pro-marker .verified svg{width:10px;height:10px;}
  .req-marker{
    width:36px;height:44px;display:flex;flex-direction:column;align-items:center;
  }
  .req-marker .bubble{
    background:${colors.surface};border-radius:12px;border:2px solid;
    padding:4px 8px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
  }
  .req-marker .arrow{
    width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
    border-top:8px solid;border-top-color:inherit;
  }
  .leaflet-control-attribution{font-size:9px!important;}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{
  center:[${center[1]},${center[0]}],
  zoom:${zoom},
  zoomControl:false,
  attributionControl:true
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'&copy; OpenStreetMap',
  maxZoom:19
}).addTo(map);
L.control.zoom({position:'bottomright'}).addTo(map);

var markersMap = {};
var circleMap = {};

function urgencyColor(u){
  return u==='URGENT'?'#E53935':u==='HIGH'?'#FB8C00':u==='NORMAL'?'#1976D2':'#9E9E9E';
}

function addMarker(m){
  if(markersMap[m.id]) return;
  var icon;
  if(m.type==='professional'){
    var html='<div class="pro-marker">';
    if(m.avatarUrl) html+='<img src="'+m.avatarUrl+'"/>';
    else html+='<svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
    if(m.isVerified) html+='<div class="verified"><svg viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>';
    html+='</div>';
    icon=L.divIcon({html:html,className:'',iconSize:[40,40],iconAnchor:[20,40]});
  }else{
    var c=urgencyColor(m.urgency);
    var html='<div class="req-marker" style="border-top-color:'+c+'">';
    html+='<div class="bubble" style="border-color:'+c+'40">';
    html+='<span style="font-size:14px">'+m.categoryName.charAt(0)+'</span>';
    html+='</div>';
    html+='<div class="arrow" style="border-top-color:'+c+'40"></div>';
    html+='</div>';
    icon=L.divIcon({html:html,className:'',iconSize:[36,44],iconAnchor:[18,44]});
  }
  var lm=L.marker([m.lat,m.lng],{icon:icon}).addTo(map);
  lm.on('click',function(){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerPress',id:m.id}));
  });
  markersMap[m.id]=lm;
}

function removeMarker(id){
  if(markersMap[id]){map.removeLayer(markersMap[id]);delete markersMap[id];}
}

function addCircle(c){
  if(circleMap[c.id]) return;
  var lc=L.circle([c.lat,c.lng],{
    radius:c.radius,
    color:c.color,
    weight:1.5,
    opacity:c.opacity+0.15,
    fillColor:c.color,
    fillOpacity:c.opacity
  }).addTo(map);
  circleMap[c.id]=lc;
}

function removeCircle(id){
  if(circleMap[id]){map.removeLayer(circleMap[id]);delete circleMap[id];}
}

function setCenter(lat,lng,zoom){
  map.setView([lat,lng],zoom||map.getZoom(),{animate:true});
}

map.on('moveend',function(){
  var c=map.getCenter();
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type:'regionChange',
    latitude:c.lat,
    longitude:c.lng,
    zoomLevel:map.getZoom()
  }));
});

var initData=${JSON.stringify({ markers: markersJS, circles: circlesJS, center, zoom })};
initData.markers.forEach(addMarker);
initData.circles.forEach(addCircle);

window.addEventListener('message',function(e){
  try{
    var msg=JSON.parse(e.data);
    if(msg.type==='addMarker') addMarker(msg.marker);
    if(msg.type==='removeMarker') removeMarker(msg.id);
    if(msg.type==='addCircle') addCircle(msg.circle);
    if(msg.type==='removeCircle') removeCircle(msg.id);
    if(msg.type==='setCenter') setCenter(msg.lat,msg.lng,msg.zoom);
  }catch(ex){}
});
</script>
</body>
</html>`;
}

interface MonproMapViewProps {
  centerCoordinate?: [number, number];
  zoomLevel?: number;
  onRegionChange?: (coords: { latitude: number; longitude: number; zoomLevel: number }) => void;
  children?: React.ReactNode;
  style?: object;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
}

export function MonproMapView({
  centerCoordinate,
  zoomLevel,
  onRegionChange,
  children,
  style,
  showsUserLocation,
  followsUserLocation,
}: MonproMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [markers, setMarkers] = useState<Map<string, MarkerData>>(new Map());
  const [circles, setCircles] = useState<Map<string, CircleData>>(new Map());
  const markersRef = useRef(markers);
  const circlesRef = useRef(circles);
  markersRef.current = markers;
  circlesRef.current = circles;

  const center = centerCoordinate || ([-4.0083, 5.36] as [number, number]);
  const zoom = zoomLevel || 13;

  const html = useMemo(() => {
    return getLeafletHTML(
      Array.from(markers.values()),
      Array.from(circles.values()),
      center,
      zoom,
    );
  }, [markers, circles, center[0], center[1], zoom]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'regionChange' && onRegionChange) {
        onRegionChange({
          latitude: data.latitude,
          longitude: data.longitude,
          zoomLevel: data.zoomLevel,
        });
      }
      if (data.type === 'markerPress') {
        const marker = markersRef.current.get(data.id);
        if (marker?.onPress) {
          marker.onPress();
        }
      }
    } catch {}
  }, [onRegionChange]);

  const registerMarker = useCallback((id: string, data: Omit<MarkerData, 'id'>) => {
    setMarkers((prev) => {
      const next = new Map(prev);
      next.set(id, { ...data, id });
      return next;
    });
  }, []);

  const unregisterMarker = useCallback((id: string) => {
    setMarkers((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const registerCircle = useCallback((id: string, data: Omit<CircleData, 'id'>) => {
    setCircles((prev) => {
      const next = new Map(prev);
      next.set(id, { ...data, id });
      return next;
    });
  }, []);

  const unregisterCircle = useCallback((id: string) => {
    setCircles((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const contextValue = useMemo(() => ({
    registerMarker,
    unregisterMarker,
    registerCircle,
    unregisterCircle,
  }), [registerMarker, unregisterMarker, registerCircle, unregisterCircle]);

  return (
    <MapContext.Provider value={contextValue}>
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />
      </View>
    </MapContext.Provider>
  );
}

export function useMapMarker(id: string, data: Omit<MarkerData, 'id'>) {
  const ctx = useMapContext();
  useEffect(() => {
    if (!ctx) return;
    ctx.registerMarker(id, data);
    return () => ctx.unregisterMarker(id);
  }, [id, ctx?.registerMarker, ctx?.unregisterMarker]);
}

export function useMapCircle(id: string, data: Omit<CircleData, 'id'>) {
  const ctx = useMapContext();
  useEffect(() => {
    if (!ctx) return;
    ctx.registerCircle(id, data);
    return () => ctx.unregisterCircle(id);
  }, [id, ctx?.registerCircle, ctx?.unregisterCircle]);
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  webview: {
    flex: 1,
  },
});
