import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface VisitingPlace {
  id: string;
  name: string;
  description: string;
  lat: string;
  long: string;
}

interface CreateVisitingPlaceRequest {
  name: string;
  description: string;
  lat: string;
  long: string;
}

export const visitingPlaceApi = createApi({
  reducerPath: "visitingPlaceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["VisitingPlace"],
  endpoints: (builder) => ({
    getVisitingPlaces: builder.query<{ places: VisitingPlace[] }, void>({
      query: () => "/visiting-places",
      providesTags: ["VisitingPlace"],
    }),
    createVisitingPlace: builder.mutation<{ message: string; place: VisitingPlace }, CreateVisitingPlaceRequest>({
      query: (body) => ({ url: "/visiting-places", method: "POST", body }),
      invalidatesTags: ["VisitingPlace"],
    }),
  }),
});

export const { useGetVisitingPlacesQuery, useCreateVisitingPlaceMutation } = visitingPlaceApi;
