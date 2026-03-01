/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  safelist: [
    // Dynamic color classes used by the app
    {
      pattern: /(bg|text|border)-(blue|green|orange)-(50|100|200|300|400|500|600|700|800)/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
