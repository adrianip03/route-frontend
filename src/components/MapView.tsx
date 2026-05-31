import {
  AdvancedMarker,
  APIProvider,
  Map,
  Polyline,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import "./MapView.css";
import { getRoute } from "../utils/routeApi";
import type { routeInfo } from "./RoutePlanner";

const MAX_RETRY = 5;

interface MapViewProps {
  token: undefined | string;
  onRouteInfoReceived: (routeInfo: null | routeInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: null | string) => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function MapView({
  token,
  onRouteInfoReceived,
  setLoading,
  setError,
}: MapViewProps) {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [apiReady, setApiReady] = useState<boolean>(false);
  const [path, setPath] = useState<null | Coordinates[]>(null);

  useEffect(() => {
    if (!API_KEY) setError("Google Maps API key missing. ");
  }, [API_KEY]);

  useEffect(() => {
    if (token) {
      // console.log(token);
      setLoading(true);
      setError(null);

      retryLoop();
      setLoading(false);
    }
  }, [token]);

  // Try get route subroutine, returns a boolean whether retry is needed.
  async function tryGetRoute(): Promise<boolean> {
    if (!token) return false;
    try {
      const data = await getRoute({ token: token });
      if (data.status === "success") {
        const parsedPath = data.path.map(([lat, long]) => ({
          lat: parseFloat(lat),
          lng: parseFloat(long),
        }));
        setPath(parsedPath);
        const parsedRouteInfo = {
          dist: data.total_distance,
          time: data.total_time,
        };
        onRouteInfoReceived(parsedRouteInfo);
        setError(null);
        setLoading(false);
        return false;
      } else if (data.status === "failure") {
        setError(data.error);
        setLoading(false);
        return false;
      } else if (data.status === "in progress") {
        return true;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error on route fetch";
      setError(errorMsg);
      setLoading(false);
      return false;
    }
    return false;
  }

  async function retryLoop() {
    for (let i = 0; i < MAX_RETRY; i++) {
      const needRetry = await tryGetRoute();
      // console.log(needRetry);
      if (!needRetry) break;
    }
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={["maps", "marker"]}
      onLoad={() => {
        // console.log("Google Maps API has loaded.")
        setApiReady(true);
      }}
      onError={() => {
        setError("Google Maps API failed to load. ");
        setApiReady(false);
      }}
    >
      {apiReady && (
        <Map
          className="map"
          defaultCenter={{ lat: 22.372081, lng: 114.107877 }}
          defaultZoom={11}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="DEMO_MAP_ID"
          onZoomChanged={() => {}}
        >
          {path && (
            <>
              <AdvancedMarker position={path.at(0)}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </AdvancedMarker>
              <Polyline path={path} strokeColor={"#000000"} strokeWeight={3} />
              <AdvancedMarker position={path.at(-1)} />
            </>
          )}
        </Map>
      )}
    </APIProvider>
  );
}

export default MapView;
