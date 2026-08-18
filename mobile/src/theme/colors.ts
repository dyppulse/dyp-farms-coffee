/**
 * Agricultural / farm-forward palette.
 * Soft sage surfaces + deep leaf greens (not cream+terracotta, not navy/fintech).
 */
export const colors = {
  // Legacy token names kept so screens keep working; values are green-themed.
  navy: '#14532D',
  navy2: '#2F6B4F',
  lavender: '#E7F0EA',

  red: '#DC2626',
  green: '#22C55E',
  farmerGreen: '#15803D',
  farmerGreenDark: '#166534',
  /** Distinct accent for tourist / AI actions (teal within the green family). */
  touristPurple: '#0F766E',
  amber: '#B45309',
  coffee: '#5C4033',

  primary: '#14532D',
  primaryLight: '#2F6B4F',
  secondary: '#5C4033',
  accent: '#2F6B4F',
  background: '#E7F0EA',
  surface: '#FFFFFF',
  text: '#14532D',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textBody: '#374151',
  border: '#D5E4DA',
  success: '#16A34A',
  warning: '#B45309',
  error: '#DC2626',
  white: '#FFFFFF',
};

export type UserRole = 'farmer' | 'roaster' | 'tourist';

export function roleAccent(role: UserRole | string | null | undefined): string {
  switch (role) {
    case 'farmer':
      return colors.farmerGreen;
    case 'tourist':
      return colors.touristPurple;
    case 'roaster':
    default:
      return colors.navy2;
  }
}

export function roleLabel(role: UserRole | string | null | undefined): string {
  switch (role) {
    case 'farmer':
      return 'Farmer';
    case 'tourist':
      return 'Tourist';
    case 'roaster':
      return 'Roaster / Buyer';
    default:
      return 'Member';
  }
}
