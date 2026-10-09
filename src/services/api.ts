import { Platform } from "react-native";

const fallbackUrl =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || fallbackUrl;

export function resolveApiAssetUrl(assetUrl: string): string {
  if (/^https?:\/\//i.test(assetUrl)) return assetUrl;

  const apiOrigin = new URL(API_BASE_URL).origin;
  return new URL(assetUrl, apiOrigin).toString();
}