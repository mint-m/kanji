const lightTheme = {
  innerShadow: {},
  outerShadow: {},
};

const darkTheme = {
  innerShadow: {},
  outerShadow: {},
};

const fontSize = {
  xs: "0.5rem",
  sm: "0.75rem",
  base: "1rem",
  md: "1.25rem",
  lg: "1.5rem",
};

const theme = {
  lightTheme,
  darkTheme,
  fontSize,
};

type ThemeType = typeof theme;

export default theme as ThemeType;
