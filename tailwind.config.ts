import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2633",
        mist: "#edf2f7",
        signal: "#c96d42",
        moss: "#436850",
        steel: "#5d7083"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        display: ["'Fraunces'", "Georgia", "serif"]
      },
      boxShadow: {
        panel: "0 20px 60px rgba(25, 45, 65, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
