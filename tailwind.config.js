/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { base:'#030914',surface:'#071426',surfaceAlt:'#0A1C33',border:'#12365A',brand:{navy:'#050B1F',blue:'#008CFF',cyan:'#19D9FF',orange:'#FF8A1F',amber:'#4DD7FF'},gain:'#18D98B',loss:'#E2574C',ink:{primary:'#F3F7FF',muted:'#93A4C7'}},fontFamily:{display:['"Space Grotesk"','sans-serif'],body:['Inter','sans-serif']} } },
  plugins: [],
};
