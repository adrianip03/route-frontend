import { useState } from "react";
import React from "react";
import "./AddressPane.css";
import { getRouteToken } from "../services/routeApi";
import type { routeInfo } from "./RoutePlanner";

/**
 * Props for the AddressPane component
 *
 * @interface AddressPaneProps
 * @property {null | routeInfo} routeInfo - Route distance and time information when available
 * @property {Function} onTokenReceived - Callback fired when route token is successfully obtained
 * @property {boolean} loading - Indicates if an API request is currently in progress
 * @property {Function} setLoading - State setter for loading state in parent component
 * @property {null | string} error - Current error message, null when no error exists
 * @property {Function} setError - State setter for error state in parent component
 */
interface AddressPaneProps {
  routeInfo: null | routeInfo;
  onTokenReceived: (token: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: null | string;
  setError: (error: null | string) => void;
}

/**
 * AddressPane component for collecting and submitting location addresses
 *
 * @component
 * @param {AddressPaneProps} props - Component props
 * @returns {JSX.Element} Rendered address form with route information
 *
 * @example
 * ```tsx
 * <AddressPane
 *   routeInfo={routeInfo}
 *   onTokenReceived={handleToken}
 *   loading={isLoading}
 *   setLoading={setIsLoading}
 *   error={error}
 *   setError={setError}
 * />
 * ```
 */
function AddressPane({
  routeInfo,
  onTokenReceived,
  loading,
  setLoading,
  error,
  setError,
}: AddressPaneProps) {
  const [sourceLoc, setSourceLoc] = useState<string>("");
  const [destLoc, setDestLoc] = useState<string>("");

  /**
   * Handles form submission to get route token
   *
   * @async
   * @param {React.SubmitEvent<HTMLFormElement>} e - Form submit event
   * @returns {Promise<void>}
   *
   * @throws {Error} When API call fails
   */
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
        routeInfo && (
          <div className="card">
            {<div className="info">Total distance: {routeInfo.dist}</div>}
            {<div className="info">Total time: {routeInfo.time}</div>}
          </div>
        )
      )}
    </>
  );
}

export default AddressPane;
