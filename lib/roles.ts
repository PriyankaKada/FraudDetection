export const roles = [
  "warehouse-manager",
  "regional-manager",
  "operations-manager",
  "executive",
] as const;

export type UserRole = (typeof roles)[number];

export type RoleCapabilities = {
  canViewAnalytics: boolean;
  canEditTransactions: boolean;
  canEscalate: boolean;
  canOverride: boolean;
  scope: "warehouse" | "region" | "all";
};

export const roleCapabilities: Record<UserRole, RoleCapabilities> = {
  "warehouse-manager": {
    canViewAnalytics: false,
    canEditTransactions: true,
    canEscalate: false,
    canOverride: false,
    scope: "warehouse",
  },
  "regional-manager": {
    canViewAnalytics: true,
    canEditTransactions: true,
    canEscalate: true,
    canOverride: false,
    scope: "region",
  },
  "operations-manager": {
    canViewAnalytics: true,
    canEditTransactions: true,
    canEscalate: true,
    canOverride: true,
    scope: "all",
  },
  executive: {
    canViewAnalytics: true,
    canEditTransactions: false,
    canEscalate: false,
    canOverride: false,
    scope: "all",
  },
};

