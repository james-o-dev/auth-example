/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const plugin = require('tailwindcss/plugin')

const themeColour = '#3498db'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addBase, theme }) {
      addBase({
        'h1': { fontSize: theme('fontSize.2xl') },
        'h2': { fontSize: theme('fontSize.xl') },
        'h3': { fontSize: theme('fontSize.lg') },
        'input': {
          padding: '4px',
          backgroundColor: '#fff',
          borderRadius: '.25rem',
          border: '1px solid #ccc',
          // boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
        button: {
          display: 'inline-block',
          padding: '4px',
          // fontSize: '16px',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          border: `1px solid ${themeColour}`,
          color: '#3498d',
          backgroundColor: 'white',
          borderRadius: '5px',
          transition: 'background-color 0.3s, color 0.3s',
        },
        'button:hover': {
          backgroundColor: themeColour,
          color: 'white',
        },
        a: {
          color: themeColour,
        },
        /* Hover state */
        'a:hover': {
          color: '#e74c3c', /* Change the text color on hover */
          textDecoration: 'underline', /* Add underline on hover */
        },
        'ul': {
          listStyle: 'inside',
        },
      })
    }),
  ],
}
