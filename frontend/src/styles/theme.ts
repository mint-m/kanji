const fontSize: { [key: string]: string } = {
  xs: "0.5rem",
  sm: "1rem",
  base: "1.25rem",
  md: "1.5rem",
  lg: "2rem",
  xlg: "3rem",
  xxlg: "3rem",
};

const fontWeight = {};

export const lightTheme = {
  innerShadow: `
    box-shadow: inset 6px 6px 12px rgba(163, 177, 198, 0.6),
                inset -6px -6px 12px rgba(255, 255, 255, 0.5);`,
  outerShadow: `
    box-shadow: 6px 6px 12px rgba(163, 177, 198, 0.6),
                -6px -6px 12px rgba(255, 255, 255, 0.5);`,
  fontSize,
  fontWeight,
};

export const darkTheme = {
  innerShadow: ``,
  outerShadow: ``,
  fontSize,
  fontWeight,
};

export type Theme = typeof lightTheme;
