/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./App.{js,jsx,ts,tsx}",
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				"primary-dark-blue": "#2985D0",
				"white-sand": "#F6F4F2",
				"grey-3": "#D1D1D6",
				"grey-6": "#8E8E93",
				"grey-8": "#5C5C61",
				"primary-light-blue": "#2563EB",
				"blue-ocean": "#2985D0",
				"enaleia-black": "#0D0D0D",
				"sand-beige": "#EEEAE7",
				"med-ocean": "#6C9EC6",
			},
			fontFamily: {
				"dm-light": ["DMSans-Light", "system-ui", "sans-serif"],
				"dm-regular": ["DMSans-Regular", "system-ui", "sans-serif"],
				"dm-medium": ["DMSans-Medium", "system-ui", "sans-serif"],
				"dm-bold": ["DMSans-Bold", "system-ui", "sans-serif"],
			},
		},
	},
	plugins: [],
};