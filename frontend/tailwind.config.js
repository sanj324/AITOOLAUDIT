/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f7fb",
          100: "#dfe8f4",
          200: "#c1d1e8",
          300: "#93add6",
          400: "#5e86bd",
          500: "#39679f",
          600: "#244d80",
          700: "#1b3a61",
          800: "#172f4e",
          900: "#162841"
        }
      },
      boxShadow: {
        panel: "0 20px 40px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
