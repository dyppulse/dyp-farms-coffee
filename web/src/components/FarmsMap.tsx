import { Fragment, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polygon,
  useJsApiLoader,
} from "@react-google-maps/api";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import type { FarmWithOwner } from "../api/client";

const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#e7f0ea" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cddcd2" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: "#c8e0cf" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d5e4da" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#dbe9df" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bcd6df" }],
  },
];

// Matte charcoal to match the dark cards: low-contrast roads, muted water, cream-tinted labels.
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f1f16" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9db0a2" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1a12" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#24382b" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: "#183024" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#203629" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f1f16" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#14261b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1a1f" }],
  },
];

const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 }; // Central Uganda

export function farmCenter(farm: FarmWithOwner) {
  const lat =
    farm.boundary.reduce((s, p) => s + p.lat, 0) / farm.boundary.length;
  const lng =
    farm.boundary.reduce((s, p) => s + p.lng, 0) / farm.boundary.length;
  return { lat, lng };
}

interface Props {
  farms: FarmWithOwner[];
  selected: FarmWithOwner | null;
  onSelect: (farm: FarmWithOwner | null) => void;
  height: number | string;
}

/** Themed Google map of farm boundaries with a click-to-inspect detail overlay. */
export function FarmsMap({ farms, selected, onSelect, height }: Props) {
  const dark = useTheme().palette.mode === "dark";
  const mapRef = useRef<google.maps.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey });

  // Farms can be a few hundred metres across, so fit the viewport to all of them
  // (a fixed zoom leaves polygons sub-pixel).
  function fitAll(map: google.maps.Map) {
    const points = farms.flatMap((f) => f.boundary);
    if (!points.length) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 64);
  }

  // Fly to the selected farm; zoom back out when the selection clears.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selected) {
      map.panTo(farmCenter(selected));
      map.setZoom(15);
    } else {
      fitAll(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Full-screen mode: Esc exits, page scroll is locked, and the map re-measures itself.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setExpanded(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Wait a frame so the container has its new size before re-measuring.
    const id = requestAnimationFrame(() => {
      google.maps.event.trigger(map, "resize");
      if (selected) map.panTo(farmCenter(selected));
      else fitAll(map);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const frame = {
    height: expanded ? "100dvh" : height,
    position: expanded ? ("fixed" as const) : ("relative" as const),
    ...(expanded ? { inset: 0, zIndex: 1400 } : {}),
    borderRadius: expanded ? 0 : 5,
    overflow: "hidden",
    border: expanded ? 0 : 1,
    borderColor: "divider",
    bgcolor: dark ? "#0f1f16" : "#e7f0ea",
  };

  if (!apiKey) {
    return (
      <Alert severity="info">
        Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to render this map. Farms on
        file: {farms.map((f) => f.name).join(", ") || "none yet"}.
      </Alert>
    );
  }
  if (!isLoaded) {
    return (
      <Box sx={{ ...frame, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height }}>
      <Box sx={frame}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={DEFAULT_CENTER}
          zoom={6}
          onLoad={(map) => {
            mapRef.current = map;
            fitAll(map);
          }}
          onUnmount={() => {
            mapRef.current = null;
          }}
          onClick={() => onSelect(null)}
          options={{
            styles: dark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {farms.map((farm) => (
            <Fragment key={farm.id}>
              {farm.boundary.length >= 3 ? (
                <Polygon
                  path={farm.boundary.map((p) => ({ lat: p.lat, lng: p.lng }))}
                  options={{
                    fillColor: dark ? "#7fd199" : "#2f6b4f",
                    fillOpacity: selected?.id === farm.id ? 0.55 : 0.32,
                    strokeColor: dark ? "#7fd199" : "#2f6b4f",
                    strokeWeight: selected?.id === farm.id ? 3 : 2,
                  }}
                  onClick={() => onSelect(farm)}
                />
              ) : null}
              <Marker
                position={farmCenter(farm)}
                onClick={() => onSelect(farm)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: selected?.id === farm.id ? 11 : 9,
                  fillColor: dark ? "#7fd199" : "#14532d",
                  fillOpacity: 1,
                  strokeColor: dark ? "#0b1a12" : "#ffffff",
                  strokeWeight: 3,
                }}
              />
            </Fragment>
          ))}
        </GoogleMap>

        <Tooltip title={expanded ? "Exit full screen (Esc)" : "Full screen"}>
          <IconButton
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Exit full screen" : "Enter full screen"}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 42,
              height: 42,
            }}
          >
            {expanded ? (
              <FullscreenExitIcon fontSize="small" />
            ) : (
              <FullscreenIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>

        {selected ? (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              width: 260,
              p: 2,
              borderRadius: 4,
              bgcolor: dark ? "#e7f0ea" : "#14532d",
              color: dark ? "#0b1a12" : "#ffffff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <IconButton
              size="small"
              onClick={() => onSelect(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                color: "inherit",
                border: "none",
                bgcolor: "transparent",
                "&:hover": { bgcolor: "rgba(128,128,128,0.2)" },
              }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: 12, opacity: 0.6 }}>
              {selected.boundary.length >= 3
                ? "Mapped boundary"
                : "Pin location"}
            </Typography>
            <Typography
              sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.25, pr: 3 }}
            >
              {selected.name}
            </Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.8, mt: 1 }}>
              {selected.owner?.name ?? "Unknown owner"}
            </Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
              {selected.sizeHectares
                ? `${selected.sizeHectares} ha`
                : "Size not set"}{" "}
              · {farmCenter(selected).lat.toFixed(4)},{" "}
              {farmCenter(selected).lng.toFixed(4)}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
