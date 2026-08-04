/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Apple SD Gothic Neo",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Malgun Gothic",
          "sans-serif"
        ]
      },
      colors: {
        ink: "#111111",
        paper: "#ffffff",
        line: "#e5e5e5",
        muted: "#8a8a8a"
      }
    }
  },
  plugins: []
};
