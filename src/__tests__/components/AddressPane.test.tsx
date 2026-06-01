/**
 * @vitest-environment jsdom
 */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRouteToken } from "@services/routeApi";
import AddressPane from "@/components/AddressPane";

vi.mock("@services/routeApi");

describe("AddressPane", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits source, dest addr, on success, updates token", async () => {
    const mockData = { token: "9d3503e0-7236-4e47-a62f-8b01b5646c16" };
    const testRouteInfo = { dist: 20000, time: 1800 };
    const mockOnTokenReceived = vi.fn();
    let loading = false;
    let error = null;
    const setLoading = (value: boolean) => {
      loading = value;
    };
    const setError = (value: string | null) => {
      error = value;
    };

    vi.mocked(getRouteToken).mockResolvedValue(mockData as any);

    render(
      <AddressPane
        routeInfo={testRouteInfo}
        onTokenReceived={mockOnTokenReceived}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Starting Location"), {
      target: { value: "Innocentre, Hong Kong" },
    });
    fireEvent.change(screen.getByPlaceholderText("Drop-off Location"), {
      target: { value: "Hong Kong International Airport Terminal 1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(loading).toBe(true);

    await waitFor(() => {
      expect(getRouteToken).toHaveBeenCalledWith({
        sourceLoc: "Innocentre, Hong Kong",
        destLoc: "Hong Kong International Airport Terminal 1",
      });
    });

    await waitFor(() => {
      expect(mockOnTokenReceived).toHaveBeenCalledWith({
        token: "9d3503e0-7236-4e47-a62f-8b01b5646c16",
      });
    });

    expect(error).toBe(null);

    expect(loading).toBe(false);
  });

  it("submits source, dest addr, on 500 internal server error, updates error message", async () => {
    const testRouteInfo = { dist: 20000, time: 1800 };
    const mockOnTokenReceived = vi.fn();
    let loading = false;
    let error = null;
    const setLoading = (value: boolean) => {
      loading = value;
    };
    const setError = (value: string | null) => {
      error = value;
    };

    const serverError = new Error("Internal Server Error");
    vi.mocked(getRouteToken).mockRejectedValue(serverError);

    render(
      <AddressPane
        routeInfo={testRouteInfo}
        onTokenReceived={mockOnTokenReceived}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Starting Location"), {
      target: { value: "Innocentre, Hong Kong" },
    });
    fireEvent.change(screen.getByPlaceholderText("Drop-off Location"), {
      target: { value: "Hong Kong International Airport Terminal 1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(loading).toBe(true);

    await waitFor(() => {
      expect(getRouteToken).toHaveBeenCalledWith({
        sourceLoc: "Innocentre, Hong Kong",
        destLoc: "Hong Kong International Airport Terminal 1",
      });
    });

    expect(error).toBe("Internal Server Error");

    expect(loading).toBe(false);
  });
});
