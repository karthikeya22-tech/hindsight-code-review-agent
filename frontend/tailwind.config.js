/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f141b',
        panel: '#161d27',
        edge: '#26303d',
      },
    },
  },
  plugins: [],
};
