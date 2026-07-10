import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

export const API_URL =
  import.meta.env.VITE_API_URL ??
  "https://q4n8mbr4-3000.inc1.devtunnels.ms/v1/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

// The 'http-only' auth strategy means the access token is a session cookie with no
// client-visible expiry — a 401 is the only signal it's gone. Retry once via /auth/refresh
// (backed by the longer-lived efc_refresh_token cookie) before giving up.
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );
    if (refreshResult.data) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};
