import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 90000, // screener/top-picks endpoints can take 30-60s
});

// ── Profile ──────────────────────────────────────────────
export const onboardInvestor = (data) =>
  apiClient.post("/profile/onboard", data).then((res) => res.data);

export const getRiskProfile = (profileId) =>
  apiClient.get(`/profile/${profileId}/risk`).then((res) => res.data);

/** Look up investor profile + risk summary by Supabase auth user_id */
export const getUserProfile = (userId) =>
  apiClient.get(`/profile/by-user/${userId}`).then((res) => res.data);

/** Fetch raw questionnaire answers to pre-fill the Settings form */
export const getQuestionnaire = (profileId) =>
  apiClient.get(`/profile/${profileId}/questionnaire`).then((res) => res.data);

/** Update profile + questionnaire answers, recomputes risk score */
export const updateProfile = (profileId, data) =>
  apiClient.put(`/profile/${profileId}/update`, data).then((res) => res.data);

// ── Prediction ────────────────────────────────────────────
export const getPrediction = (ticker) =>
  apiClient.get(`/prediction/${ticker}`).then((res) => res.data);

// ── Screener ──────────────────────────────────────────────
export const getScreener = () =>
  apiClient.get(`/screener/nifty50`).then((res) => res.data);

export const getTopPicks = (topN = 5) =>
  apiClient.get(`/screener/top-picks?top_n=${topN}`).then((res) => res.data);

// ── Mutual Funds ──────────────────────────────────────────
export const getMutualFunds = (profileId) =>
  apiClient
    .get(`/mutual-funds/recommendations/${profileId}?top_n=10`)
    .then((res) => res.data);

// ── Portfolio ─────────────────────────────────────────────
export const getPortfolio = (profileId) =>
  apiClient.get(`/portfolio/recommendation/${profileId}`).then((res) => res.data);

// ── Monitoring ────────────────────────────────────────────
export const getMonitoringStats = (ticker = "TCS.NS") =>
  apiClient.get(`/monitoring/stats?ticker=${ticker}`).then((res) => res.data);

export default apiClient;