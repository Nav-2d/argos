/* eslint-env node */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color classes
        primary: colors.violet,
        info: colors.sky,
        warning: colors.orange,
        danger: colors.red,
        success: colors.green,
        neutral: colors.gray,
        pending: colors.amber,

        // Global colors
        bg: colors.black,
        on: colors.slate[100],
        "on-light": colors.slate[400],
        "on-danger": colors.red[400],
        border: colors.slate[700],
        "border-hover": colors.slate[600],
        text: colors.slate[50],

        // Components
        tooltip: {
          bg: colors.slate[900],
          border: colors.slate[800],
          on: colors.slate[50],
        },

        dialog: {
          bg: colors.slate[900],
          border: colors.slate[800],
          on: colors.slate[50],
        },

        code: {
          bg: colors.slate[700],
          on: colors.slate[50],
        },

        "icon-button": {
          on: colors.slate[400],
          primary: {
            "hover-border": colors.purple[700],
            "hover-on": colors.purple[300],
            "active-bg": colors.purple[800],
          },
          neutral: {
            "hover-border": colors.slate[700],
            "hover-on": colors.slate[300],
            "active-bg": colors.slate[800],
          },
          danger: {
            "hover-border": colors.red[700],
            "hover-on": colors.red[300],
            "active-bg": colors.red[900],
          },
          success: {
            "hover-border": colors.green[700],
            "hover-on": colors.green[300],
            "active-bg": colors.green[900],
          },
        },

        tab: {
          on: colors.slate[400],
          "hover-on": colors.slate[200],
          "selected-on": colors.slate[50],
        },

        menu: {
          bg: colors.slate[900],
          border: colors.slate[600],
          on: colors.slate[300],
          "on-title": colors.slate[400],
          "hover-on": colors.slate[50],
          danger: {
            on: colors.red[500],
            "hover-on": colors.red[500],
          },
          item: {
            "hover-bg": colors.slate[700],
            "selected-bg": colors.slate[800],
          },
        },
      },
      fontSize: {
        xxs: [
          "0.6875rem",
          {
            lineHeight: "1rem",
          },
        ],
      },
      opacity: {
        disabled: ".38",
      },
      fontFamily: {
        sans: '"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
      },
      borderRadius: {
        chip: "20px",
      },
      aria: {
        invalid: 'invalid="true"',
      },
      borderColor: {
        DEFAULT: colors.slate[700],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
