/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 60-30-10 design system (WCAG AA):
        //   60% dominant: deep navy surfaces/backgrounds
        //   30% secondary: navy neutrals (borders, chips, hovers)
        //   10% accent: teal for CTAs, links, highlights
        navy: {
          50: '#EBF1F8',
          100: '#D7E2EF',
          200: '#B4C5DA',
          300: '#8AA3C0',
          400: '#5C7FA6',
          500: '#3A5F8F',
          600: '#2A4A77',
          700: '#1E3A5F', // brand navy
          800: '#12263F', // card surface
          900: '#0A1626', // page background
        },
        // Accent (10%): teal — passes 4.5:1 with white text at the 700 step
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Secondary neutrals remapped for dark backgrounds:
        // light shades become dark surfaces, dark shades become light text
        gray: {
          50: '#0A1626',  // page background
          100: '#162B45', // chip / hover surface
          200: '#1E3A5F', // borders (brand navy)
          300: '#2E4A73', // input borders
          400: '#5C7FA6', // muted icons
          500: '#8AA3C0', // muted text
          600: '#A9BCD4', // body text
          700: '#C4D2E4', // labels
          800: '#DCE6F2', // strong text
          900: '#F1F5F9', // headings / near-white
        },
      },
    },
  },
  plugins: [],
};
