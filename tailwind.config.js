/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          950: "#142027",
          800: "#21313a",
          600: "#51606a",
        },
        radar: {
          50: "#eefdfa",
          100: "#d2f8ef",
          200: "#a7eddf",
          300: "#72dccb",
          500: "#13a58d",
          600: "#0b826f",
          700: "#0b6659",
        },
        oat: "#f7f3eb",
      },
      boxShadow: {
        panel: "0 18px 48px rgba(20, 32, 39, 0.08)",
      },
    },
  },
  plugins: [],
};
