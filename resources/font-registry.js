// Font registry - maps font-family names to their file paths and styles
// Fonts are registered using the family names embedded in the font files

const FONT_ENTRIES = [
	{ family: 'Baskervville', file: 'resources/fonts/baskervvile/Baskervville-Regular.ttf', weight: 400, style: 'normal' },
	{ family: 'Baskervville', file: 'resources/fonts/baskervvile/Baskervville-Italic.ttf', weight: 400, style: 'italic' },
	{ family: 'Baskervville', file: 'resources/fonts/baskervvile/Baskervville-Bold.ttf', weight: 700, style: 'normal' },
	{ family: 'Baskervville', file: 'resources/fonts/baskervvile/Baskervville-BoldItalic.ttf', weight: 700, style: 'italic' },
	{ family: 'Baskervville Medium', file: 'resources/fonts/baskervvile/Baskervville-Medium.ttf', weight: 500, style: 'normal' },
	{ family: 'Baskervville Medium', file: 'resources/fonts/baskervvile/Baskervville-MediumItalic.ttf', weight: 500, style: 'italic' },
	{ family: 'Baskervville SemiBold', file: 'resources/fonts/baskervvile/Baskervville-SemiBold.ttf', weight: 600, style: 'normal' },
	{ family: 'Baskervville SemiBold', file: 'resources/fonts/baskervvile/Baskervville-SemiBoldItalic.ttf', weight: 600, style: 'italic' },
	{ family: 'Basteleur Bold', file: 'resources/fonts/basteleur-master/Basteleur-Bold.ttf', weight: 700, style: 'normal' },
	{ family: 'Basteleur Moonlight', file: 'resources/fonts/basteleur-master/Basteleur-Moonlight.ttf', weight: 400, style: 'normal' },
	{ family: 'CatShop', file: 'resources/fonts/CatShop/CatShop.ttf', weight: 400, style: 'normal' },
	{ family: 'Cut Me Out', file: 'resources/fonts/CutMeOut/CutMeOut.ttf', weight: 400, style: 'normal' },
	{ family: 'Cut Me Out 2', file: 'resources/fonts/CutMeOut/CutMeOut2.ttf', weight: 400, style: 'normal' },
	{ family: 'Cut Me Out 3', file: 'resources/fonts/CutMeOut/CutMeOut3.ttf', weight: 400, style: 'normal' },
	{ family: 'Elb-Tunnel', file: 'resources/fonts/ElbtunnelTT/Elb-Tunnel.ttf', weight: 400, style: 'normal' },
	{ family: 'Elb-Tunnel Schatten', file: 'resources/fonts/ElbtunnelTT/Elb-Tunnel Schatten.ttf', weight: 400, style: 'normal' },
	{ family: 'Electrolize', file: 'resources/fonts/Electrolize/Electrolize-Regular.ttf', weight: 400, style: 'normal' },
	{ family: 'Eureka', file: 'resources/fonts/Eureka/Eureka.ttf', weight: 400, style: 'normal' },
	{ family: 'Eyechart', file: 'resources/fonts/Eyechart/Eyechart.ttf', weight: 400, style: 'normal' },
	{ family: 'Immermann', file: 'resources/fonts/Immermann/immermann.ttf', weight: 400, style: 'normal' },
	{ family: 'Impact Label', file: 'resources/fonts/impact-label/Impact_Label.ttf', weight: 400, style: 'normal' },
	{ family: 'Impact Label Reversed', file: 'resources/fonts/impact-label/Impact_Label_Reversed.ttf', weight: 400, style: 'normal' },
	{ family: 'Indira K', file: 'resources/fonts/Indira_K/Indira_K.ttf', weight: 400, style: 'normal' },
	{ family: 'Instrument Serif', file: 'resources/fonts/Instrument_Serif/InstrumentSerif-Regular.ttf', weight: 400, style: 'normal' },
	{ family: 'Instrument Serif', file: 'resources/fonts/Instrument_Serif/InstrumentSerif-Italic.ttf', weight: 400, style: 'italic' },
	{ family: 'Kanalisirung', file: 'resources/fonts/Kanalisirung/Kanalisirung.otf', weight: 400, style: 'normal' },
	{ family: 'Karrik', file: 'resources/fonts/karrik_fonts-main/Karrik-Regular.ttf', weight: 400, style: 'normal' },
	{ family: 'Karrik', file: 'resources/fonts/karrik_fonts-main/Karrik-Italic.ttf', weight: 400, style: 'italic' },
	{ family: 'MMX2010', file: 'resources/fonts/MMX2010/mmx2010.ttf', weight: 400, style: 'normal' },
	{ family: 'Mon Hugo', file: 'resources/fonts/Mon_Hugo_freefont/MonHugo-in.ttf', weight: 400, style: 'normal' },
	{ family: 'Mon Hugo Out', file: 'resources/fonts/Mon_Hugo_freefont/MonHugo-out.ttf', weight: 400, style: 'normal' },
	{ family: 'Murrx', file: 'resources/fonts/Murrx/Murrx.ttf', weight: 400, style: 'normal' },
	{ family: 'Neo-castel', file: 'resources/fonts/N\u00e9o-castel/webfont/Neo-castel.woff2', weight: 400, style: 'normal' },
	{ family: 'Ouest', file: 'resources/fonts/OUEST/Ouest-Regular.ttf', weight: 400, style: 'normal' },
	{ family: 'Resistance', file: 'resources/fonts/resistance-generale-master/Resistance g\u00e9n\u00e9rale.otf', weight: 400, style: 'normal' },
	{ family: 'Special Gothic Expanded One', file: 'resources/fonts/Special_Gothic_Expanded_One/SpecialGothicExpandedOne-Regular.ttf', weight: 400, style: 'normal' },
];

function formatForCSS(file) {
	if (file.endsWith('.woff2')) return `url('${file}') format('woff2')`;
	if (file.endsWith('.woff')) return `url('${file}') format('woff')`;
	if (file.endsWith('.otf')) return `url('${file}') format('opentype')`;
	return `url('${file}') format('truetype')`;
}

// Generate @font-face CSS for all registered fonts
export function generateFontFaceCSS() {
	return FONT_ENTRIES.map(entry =>
		`@font-face {
	font-family: '${entry.family}';
	src: ${formatForCSS(entry.file)};
	font-weight: ${entry.weight};
	font-style: ${entry.style};
	font-display: swap;
}`
	).join('\n');
}

// Get list of available font family names (deduplicated)
export function getAvailableFontFamilies() {
	return [...new Set(FONT_ENTRIES.map(e => e.family))];
}
