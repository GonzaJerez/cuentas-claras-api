/**
 * Color palette for member avatars.
 * Each color has a main color and a lighter background color.
 */
export interface MemberColor {
  color: string; // Main color (for text/border)
  backgroundColor: string; // Lighter background color (for avatar background)
}

export const MEMBER_COLORS: MemberColor[] = [
  {
    color: "#3B82F6", // Blue
    backgroundColor: "#DBEAFE", // Light blue
  },
  {
    color: "#10B981", // Green
    backgroundColor: "#D1FAE5", // Light green
  },
  {
    color: "#F59E0B", // Amber
    backgroundColor: "#FEF3C7", // Light amber
  },
  {
    color: "#EF4444", // Red
    backgroundColor: "#FEE2E2", // Light red
  },
  {
    color: "#8B5CF6", // Purple
    backgroundColor: "#EDE9FE", // Light purple
  },
  {
    color: "#EC4899", // Pink
    backgroundColor: "#FCE7F3", // Light pink
  },
  {
    color: "#06B6D4", // Cyan
    backgroundColor: "#CFFAFE", // Light cyan
  },
  {
    color: "#84CC16", // Lime
    backgroundColor: "#ECFCCB", // Light lime
  },
  {
    color: "#F97316", // Orange
    backgroundColor: "#FFEDD5", // Light orange
  },
  {
    color: "#6366F1", // Indigo
    backgroundColor: "#E0E7FF", // Light indigo
  },
  {
    color: "#14B8A6", // Teal
    backgroundColor: "#CCFBF1", // Light teal
  },
  {
    color: "#A855F7", // Violet
    backgroundColor: "#F3E8FF", // Light violet
  },
];
