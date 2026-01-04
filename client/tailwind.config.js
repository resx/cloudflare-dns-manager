/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'island-blue': '#6aa8ed',    // A pleasant sky/ocean blue
        'island-green': '#90ee90',  // A light, fresh green
        'island-sand': '#f5f5dc',   // A calm, sandy beige
        'island-text': '#36454f',   // Charcoal grey for text
        'island-background': '#e0ffff', // Light cyan for a soft background
      },
    },
  },
  plugins: [],
}