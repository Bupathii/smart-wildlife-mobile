export type UserRole =
  | "COMMUNITY_MEMBER"
  | "RANGER"
  | "COMMUNITY_LIAISON_OFFICER"
  | "PARK_MANAGER"
  | "RANGER_SUPERVISOR"
  | "RESEARCHER"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}