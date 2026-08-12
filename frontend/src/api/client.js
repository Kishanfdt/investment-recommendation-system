import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 90000, // screener endpoint can take 30-60s
});

export const onboardInvestor = (data) =>
  apiClient.post("/profile/onboard", data).then((res) => res.data);

export const getRiskProfile = (profileId) =>
  apiClient.get(`/profile/${profileId}/risk`).then((res) => res.data);

export const getPrediction = (ticker) =>
  apiClient.get(`/prediction/${ticker}`).then((res) => res.data);

export const getScreener = () =>
  apiClient.get(`/screener/nifty50`).then((res) => res.data);

export const getMutualFunds = (profileId) =>
  apiClient.get(`/mutual-funds/recommendations/${profileId}?top_n=10`).then((res) => res.data);

export const getPortfolio = (profileId) =>
  apiClient.get(`/portfolio/recommendation/${profileId}`).then((res) => res.data);

export default apiClient;