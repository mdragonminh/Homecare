import axiosClient from "../config/axiosClient";

export const mapApi = {
  getCoordinates: async (address) => {
    const params = new URLSearchParams({ address });
    const response = await axiosClient.get(`/maps/geocode?${params}`);
    return response.data;
  },

  getAddress: async (lat, lng) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    const response = await axiosClient.get(`/maps/reverse-geocode?${params}`);
    return response.data;
  },
};