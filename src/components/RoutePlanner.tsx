import { useNavigate, useParams } from "react-router-dom";
import AddressPane from "./AddressPane";
import MapView from "./MapView";
import "./RoutePlanner.css";
import { useState } from "react";

export interface routeInfo {
  dist: number;
  time: number;
}

function RoutePlanner() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [routeInfo, setRouteInfo] = useState<null | routeInfo>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<null | string>(null);

  return (
    <div className="routePlannerContainer">
      <div className="addressPane">
        <AddressPane
          routeInfo={routeInfo}
          onTokenReceived={(newToken: string) => {
            navigate(`/route/${newToken}`, { replace: true });
          }}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
        />
      </div>
      <MapView
        token={token}
        onRouteInfoReceived={setRouteInfo}
        setLoading={setLoading}
        setError={setError}
      />
    </div>
  );
}

export default RoutePlanner;
