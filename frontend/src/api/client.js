import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export const onboardInvestor = (data) =>
  apiClient.post("/profile/onboard", data).then((res) => res.data);

export const getPrediction = (ticker) =>
  apiClient.get(`/prediction/${ticker}`).then((res) => res.data);

export default apiClient;