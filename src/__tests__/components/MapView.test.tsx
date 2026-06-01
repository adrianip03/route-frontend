/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRoute } from "@services/routeApi";
import MapView from "@components/MapView";
import { useEffect } from "react";

vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({
    children,
    onLoad,
  }: {
    children: React.ReactNode;
    onLoad?: () => void;
  }) => {
    useEffect(() => {
      onLoad?.();
    }, [onLoad]);
    return <div>{children}</div>;
  },
  Map: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Polyline: ({ path }: { path: any[] }) => (
    <div data-testid="polyline" data-path={JSON.stringify(path)} />
  ),
  AdvancedMarker: ({ position }: { position: any }) => (
    <div data-testid={`marker-${position?.lat}-${position?.lng}`} />
  ),
}));

vi.mock("@services/routeApi");

describe("MapView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits route token, on success, updates route info, and displays waypoints", async () => {
    const mockData = {
      status: "success",
      path: [
        ["22.372081", "114.107877"],
        ["22.326442", "114.167811"],
        ["22.284419", "114.159510"],
      ],
      total_distance: 20000,
      total_time: 1800,
    };

    const mockOnRouteInfoReceived = vi.fn();
    const mockSetLoading = vi.fn();
    const mockSetError = vi.fn();

    // as any to bipass ts not recognising status === success
    vi.mocked(getRoute).mockResolvedValue(mockData as any);

    render(
      <MapView
        token="test-token"
        onRouteInfoReceived={mockOnRouteInfoReceived}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />,
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(getRoute).toHaveBeenCalledWith({ token: "test-token" });
    });

    await waitFor(() => {
      expect(mockOnRouteInfoReceived).toHaveBeenCalledWith({
        dist: 20000,
        time: 1800,
      });
    });

    expect(mockSetError).toHaveBeenCalledWith(null);

    expect(mockSetLoading).toHaveBeenCalledWith(false);

    const polyline = screen.getByTestId("polyline");
    const pathProp = JSON.parse(polyline.getAttribute("data-path") || "[]");

    expect(pathProp).toHaveLength(3);
    expect(pathProp[0]).toEqual({ lat: 22.372081, lng: 114.107877 });
    expect(pathProp[1]).toEqual({ lat: 22.326442, lng: 114.167811 });
    expect(pathProp[2]).toEqual({ lat: 22.284419, lng: 114.15951 });

    const startMarker = screen.getByTestId("marker-22.372081-114.107877");
    const endMarker = screen.getByTestId("marker-22.284419-114.15951");
    expect(startMarker).toBeDefined();
    expect(endMarker).toBeDefined();
  });

  it("submits route token, on failure, passes error message", async () => {
    const mockData = {
      status: "failure",
      error: "Location not accessible by car",
    };

    const mockOnRouteInfoReceived = vi.fn();
    const mockSetLoading = vi.fn();
    const mockSetError = vi.fn();

    vi.mocked(getRoute).mockResolvedValue(mockData as any);

    render(
      <MapView
        token="test-token"
        onRouteInfoReceived={mockOnRouteInfoReceived}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />,
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(getRoute).toHaveBeenCalledWith({ token: "test-token" });
    });

    expect(mockSetError).toHaveBeenCalledWith("Location not accessible by car");

    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("submits route token, on in progress, retry", async () => {
    const mockInProgress = {
      status: "in progress",
    };
    const mockSuccess = {
      status: "success",
      path: [
        ["22.372081", "114.107877"],
        ["22.326442", "114.167811"],
        ["22.284419", "114.159510"],
      ],
      total_distance: 20000,
      total_time: 1800,
    };

    const mockOnRouteInfoReceived = vi.fn();
    const mockSetLoading = vi.fn();
    const mockSetError = vi.fn();

    vi.mocked(getRoute)
      .mockResolvedValueOnce(mockInProgress as any)
      .mockResolvedValueOnce(mockSuccess as any);

    render(
      <MapView
        token="test-token"
        onRouteInfoReceived={mockOnRouteInfoReceived}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />,
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(getRoute).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(mockOnRouteInfoReceived).toHaveBeenCalledWith({
        dist: 20000,
        time: 1800,
      });
    });

    expect(mockSetError).toHaveBeenCalledWith(null);

    expect(mockSetLoading).toHaveBeenCalledWith(false);

    const polyline = screen.getByTestId("polyline");
    const pathProp = JSON.parse(polyline.getAttribute("data-path") || "[]");

    expect(pathProp).toHaveLength(3);
    expect(pathProp[0]).toEqual({ lat: 22.372081, lng: 114.107877 });
    expect(pathProp[1]).toEqual({ lat: 22.326442, lng: 114.167811 });
    expect(pathProp[2]).toEqual({ lat: 22.284419, lng: 114.15951 });

    const startMarker = screen.getByTestId("marker-22.372081-114.107877");
    const endMarker = screen.getAllByTestId("marker-22.284419-114.15951");
    expect(startMarker).toBeDefined();
    expect(endMarker).toBeDefined();
  });
});
