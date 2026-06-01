import {
  AdvancedMarker,
  APIProvider,
  Map,
  Polyline,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import "./MapView.css";
import { getRoute } from "../services/routeApi";
import type { routeInfo } from "./RoutePlanner";

/** Maximum number of attempts when route calculation is still in progress */
const MAX_TRY = 5;

/**
 * Props for the MapView component
 *
 * @interface MapViewProps
 * @property {undefined | string} token - Authentication token for fetching route data
 * @property {Function} onRouteInfoReceived - Callback fired when route information is successfully retrieved
 * @property {Function} setLoading - Setter function for loading state in parent component
 * @property {Function} setError - Setter function for error state in parent component
 */
interface MapViewProps {
  token: undefined | string;
  onRouteInfoReceived: (routeInfo: null | routeInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: null | string) => void;
}

/**
 * Geographic coordinates for map markers and paths
 *
 * @interface Coordinates
 * @property {number} lat - Latitude coordinate
 * @property {number} lng - Longitude coordinate
 */
interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * MapView Component - Displays route on Google Maps with retry logic
 *
 * This component handles:
 * - Rendering an interactive Google Map
 * - Fetching route data using an authentication token
 * - Automatic retry mechanism for "in progress" route calculations
 * - Displaying start/end markers and route polyline
 * - Loading and error state management
 *
 * @component
 * @param {MapViewProps} props - Component properties
 * @returns {JSX.Element} Rendered map with route visualization
 *
 * @example
 * ```tsx
 * <MapView
 *   token="9d3503e0-7236-4e47-a62f-8b01b5646c16"
 *   onRouteInfoReceived={(routeInfo) => console.log('Route:', routeInfo)}
 *   setLoading={(isLoading) => setIsLoading(isLoading)}
 *   setError={(error) => setErrorMessage(error)}
 * />
 * ```
 *
 * @remarks
 * - Requires VITE_GOOGLE_MAPS_API_KEY environment variable
 * - Implements retry pattern with MAX_TRY limit
 * - Google Maps API loads asynchronously and only renders when ready
 */
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

  /**
   * Attempts to fetch route data using current token
   *
   * @async
   * @returns {Promise<boolean>} True if retry is needed (status "in progress"), false otherwise
   *
   * @remarks
   * - Parses coordinate strings to numbers for map rendering
   * - Updates path and route info on success
   * - Handles three API response statuses: success, failure, in progress
   * - Propagates errors to parent component via setError callback
   */
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
    for (let i = 0; i < MAX_TRY; i++) {
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
