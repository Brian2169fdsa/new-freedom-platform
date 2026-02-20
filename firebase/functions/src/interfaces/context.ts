import {User} from "../models/data/user";

export interface Context {
  authUserId: string | "UNUSED"
  authUser: User
}

export interface ContextOptions {
  withAuthUserId: boolean,
  withRole: string | "UNUSED"
  includeUser: boolean
}

export const DefaultOptions: ContextOptions = {
  withAuthUserId: true,
  withRole: "UNUSED",
  includeUser: false,
};

export const IsAdminUser: ContextOptions = {
  withAuthUserId: true,
  withRole: "admin",
  includeUser: true,
};

export const IncludeAuthUser: ContextOptions = {
  withAuthUserId: true,
  withRole: "UNUSED",
  includeUser: true,
};

