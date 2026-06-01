import axios from "axios";

interface GetRouteTokenParams {
  sourceLoc: string;
  destLoc: string;
}

interface GetRouteTokenResponse {
  token: string;
}

interface GetRouteParams {
  token: string;
}

type RouteGetStatus = "in progress" | "failure" | "success";

interface BaseGetRouteResponse {
  status: RouteGetStatus;
}

interface BusyGetRouteResponse extends BaseGetRouteResponse {
  status: "in progress";
}

interface FailureGetRouteResponse extends BaseGetRouteResponse {
  status: "failure";
  error: string;
}

export interface SuccessGetRouteResponse extends BaseGetRouteResponse {
  status: "success";
  path: [string, string][];
  total_distance: number;
  total_time: number;
}

type GetRouteResponse =
  | BusyGetRouteResponse
  | FailureGetRouteResponse
  | SuccessGetRouteResponse;

const api = axios.create({
  // baseURL: "http://127.0.0.1:8080",
  baseURL: "https://sg-mock-api.lalamove.com",
  // timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

export function getRouteToken(params: GetRouteTokenParams): Promise<string> {
  return api
    // .post<GetRouteTokenResponse>("/mock/route/success", {
      .post<GetRouteTokenResponse>("/route", {
      origin: params.sourceLoc,
      destination: params.destLoc,
    })
    .then((response) => {
      // console.log(response);
      return response.data.token;
    })
    .catch((err) => {
      // console.log(err);
      throw new Error(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Error on route token fetch",
      );
    });
}

export function getRoute(params: GetRouteParams): Promise<GetRouteResponse> {
  return (
    api
      .get<GetRouteResponse>(`/route/${params.token}`)
      // .get<GetRouteResponse>(`mock/route/success`)
      .then((response) => {
        // console.log(response);
        const data = response.data;
        return data;
      })
      .catch((err) => {
        // console.log(err);
        throw new Error(
          typeof err.response?.data === "string"
            ? err.response.data
            : "Error on route fetch",
        );
      })
  );
}
