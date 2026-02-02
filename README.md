# What if you could hold a website?
open ```zine.html``` in your web browser (or <a href="https://hunterirving.github.io/zine.html/zines/zine.html/">click here</a>) then use ```⌘``` + ```P``` to print an 8-page mini zine to one sheet of 8.5 x 11" legal paper.

<a href="https://hunterirving.github.io/zine.html/zines/zine.html/"><img src="resources/readme_images/zine-layout.png"></a>

>[!NOTE]
>for best results, in your system print dialog...
>- ensure Portrait orientation is selected
>- set Margins to None or 0
>- select "Scale 100%" rather than "Fit to page width"
>- check "Print backgrounds" to ensure proper styling


## Assembly Instructions

Once you've printed the page, follow this assembly guide from <a href="https://vabook.org/wp-content/uploads/sites/16/2020/03/Where-Im-From-zine-folding-instructions.pdf">Virginia Center for the Book</a> to cut and fold the zine to shape:

<a href="https://vabook.org/wp-content/uploads/sites/16/2020/03/Where-Im-From-zine-folding-instructions.pdf">
    <img src="resources/readme_images/folding-guide.png">
</a>

>[!TIP]
>once assembled, consider gluing each page together with a gluestick for increased structural stability. see <a href="https://hunterirving.github.io/zine.html/diagnostics/glue_guide/">the glue guide</a> for a recommended gluing pattern.

# In Stock
1. <a href="https://hunterirving.github.io/zine.html/zines/zine.html/">zine.html</a><img src="resources/readme_images/hot.gif" style="padding-left:10px; height: 26px;">
> the literary classic that started a revolution in self-publishing.
2. <a href="https://hunterirving.github.io/zine.html/zines/hacksburg_gazette">the hacksburg gazette</a>
> a promotional zine for Hacksburg, a makerspace in Blacksburg, VA.

# Z.I.Y. (Zine it Yourself)
1. open <a href="https://hunterirving.github.io/zine.html/template.html/">template.html</a> in your text editor of choice
2. write some HTML within the existing ```.zine-page-content``` divs<br>
3. open the modified file in your favorite web browser
4. hit print!

# Not Looking Right?
if a given zine doesn't come out right on your printer (graphics/text cut off at the edges, etc.), please submit an issue and attach a picture of the failed print.

(so far these have only been tested with one printer... mine)

>[!TIP]
>A diagnostic <a href="https://hunterirving.github.io/zine.html/diagnostics/margin_finder/">margin finder tool</a> is provided for your convenience. Print a copy to push your printer to its absolute limits, and then, knowing those limits, make some cool zines with it.

# Cool Zine Ideas:
- comic book
- recipe book
- photo album
- album review
- dream journal
- manifesto

# Development

## Rebuilding the CodeMirror Bundle
The editor uses a bundled version of CodeMirror. To rebuild it:
```bash
cd vendor
npm install
npm run build
```
This regenerates `codemirror-bundle.js` in the project root.

# Licenses

## Project License
This project is licensed under the GNU General Public License v3.0 (GPLv3). See the [LICENSE](LICENSE) file for details.

## Font Licenses

| Font | License |
|------|---------|
| Baskervvile | [SIL Open Font License](resources/fonts/baskervvile/OFL.txt) |
| Basteleur | [SIL Open Font License](resources/fonts/basteleur-master/LICENSE.txt) |
| CatShop | [SIL Open Font License](resources/fonts/CatShop/Open%20Font%20License.txt) |
| CutMeOut | [SIL Open Font License](resources/fonts/CutMeOut/Open%20Font%20License.txt) |
| Electrolize | [SIL Open Font License](resources/fonts/Electrolize/OFL.txt) |
| ElbtunnelTT | [Creative Commons](resources/fonts/ElbtunnelTT/Creative%20Commons%20Lizenz.txt) |
| ElbtunnelTT2 | [Creative Commons](resources/fonts/ElbtunnelTT2/Creative%20Commons%20Lizenz.txt) |
| Eureka | [SIL Open Font License](resources/fonts/Eureka/Open%20Font%20License.txt) |
| Eyechart | [SIL Open Font License](resources/fonts/Eyechart/Open%20Font%20License.txt) |
| Immermann | [SIL Open Font License](resources/fonts/Immermann/Open%20Font%20License.txt) |
| Impact Label | [Tension Type Free Font License](resources/fonts/impact-label/Tension%20Type%20Font%20License.txt) |
| Indira_K | [SIL Open Font License](resources/fonts/Indira_K/OFL.txt) |
| Instrument_Serif | [SIL Open Font License](resources/fonts/Instrument_Serif/OFL.txt) |
| Kanalisirung | [SIL Open Font License](resources/fonts/Kanalisirung/OFL.txt) |
| Karrik | [SIL Open Font License](resources/fonts/karrik_fonts-main/LICENCE.txt) |
| MMX2010 | [SIL Open Font License](resources/fonts/MMX2010/Open%20Font%20License.txt) |
| Mon_Hugo | [SIL Open Font License](resources/fonts/Mon_Hugo_freefont/FREE%20FONT%20LICENSE.txt) |
| Murrx | [SIL Open Font License](resources/fonts/Murrx/Open%20Font%20License.txt) |
| Néo-castel | [OIFL (French OFL)](resources/fonts/Néo-castel/Licence.txt) |
| OUEST | [OIFL (French OFL)](resources/fonts/OUEST/license.txt) |
| Resistance générale | [SIL Open Font License](resources/fonts/resistance-generale-master/LICENSE.txt) |
| Special_Gothic_Expanded_One | [SIL Open Font License](resources/fonts/Special_Gothic_Expanded_One/OFL.txt) |

For detailed license terms, see the individual license files linked above.
