const fontSize = {
  xs: "0.5rem",
  sm: "0.75rem",
  base: "1rem",
  md: "1.25rem",
  lg: "1.5rem",
};

export const lightTheme = {
  innerShadow: `
    box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.6),
                inset -6px -6px 12px rgba(255, 255, 255, 0.5);`,
  outerShadow: `
    box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
                -6px -6px 12px rgba(255, 255, 255, 0.5);`,
  fontSize,
};

export const darkTheme = {
  innerShadow: {},
  outerShadow: {},
  fontSize,
};
