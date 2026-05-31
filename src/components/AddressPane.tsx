import { useState } from "react";
import React from "react";
import "./AddressPane.css";
import { getRouteToken } from "../utils/routeApi";
import type { routeInfo } from "./RoutePlanner";

interface AddressPaneProps {
  currRouteInfo: null | routeInfo;
  onTokenReceived: (token: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: boolean;
  setError: (error: null | string) => void;
}

function AddressPane({
  currRouteInfo,
  onTokenReceived,
  loading,
  setLoading,
  error,
  setError,
}: AddressPaneProps) {
  const [sourceLoc, setSourceLoc] = useState<string>("");
  const [destLoc, setDestLoc] = useState<string>("");

  async function handleFormSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!sourceLoc.trim() || !destLoc.trim()) {
      setError("Please enter both locations");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newToken = await getRouteToken({
        sourceLoc: sourceLoc,
        destLoc: destLoc,
      });
      onTokenReceived(newToken);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error on route token fetch";
      setError(errorMsg);
      // onTokenReceived(null);
    } finally {
      setLoading(false);
    }
  }

  function handleFormReset(_: React.SyntheticEvent<HTMLFormElement>) {
    setSourceLoc("");
    setDestLoc("");
  }

  return (
    <>
      <form
        className="card"
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
      >
        <label className="locInputLabel" htmlFor="sourceLoc">
          Starting Location
        </label>
        <input
          className="locInput"
          name="sourceLoc"
          id="sourceLoc"
          type="text"
          value={sourceLoc}
          onChange={(e) => {
            setSourceLoc(e.target.value);
          }}
          placeholder="Starting Location"
        />

        <label className="locInputLabel" htmlFor="destLoc">
          Drop-off Location
          <br />
          <input
            className="locInput"
            name="destLoc"
            id="destLoc"
            type="text"
            value={destLoc}
            onChange={(e) => {
              setDestLoc(e.target.value);
            }}
            placeholder="Drop-off Location"
          />
        </label>

        <div>
          <button className="resetButton" type="reset">
            Reset
          </button>

          <button className="submitButton" type="submit">
            Submit
          </button>
        </div>
      </form>

      {loading || error ? (
        <div className="card">
          {loading && <div>Loading route...</div>}
          {error && <div className="error">Error: {error}</div>}
        </div>
      ) : (
        currRouteInfo && (
          <div className="card">
            {<div className="info">Total distance: {currRouteInfo.dist}</div>}
            {<div className="info">Total time: {currRouteInfo.time}</div>}
          </div>
        )
      )}
    </>
  );
}

export default AddressPane;
