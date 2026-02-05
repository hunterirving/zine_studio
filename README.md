# if you have a printer, you're a publisher

1. open <a href="https://hunterirving.github.io/zine_workshop/">zine workshop ↗</a> in your web browser
2. flesh out the pages using HTML
3. press ```⌘ + P``` to print an 8-page mini zine to one sheet of 8.5 x 11" legal paper

<a href="https://hunterirving.github.io/zine_workshop/"><img src="resources/readme_images/zines.jpeg" width="600"></a>

>[!NOTE]
>for best results, in your system print dialog...
>- set Margins to None or 0
>- select "Scale 100%" rather than "Fit to page width"
>- check "Print backgrounds" to ensure proper styling

## assembly

once you've printed your zine, follow this <a href="https://vabook.org/wp-content/uploads/sites/16/2020/03/Where-Im-From-zine-folding-instructions.pdf">assembly guide</a> from Virginia Center for the Book to cut and fold it to shape:

<a href="https://vabook.org/wp-content/uploads/sites/16/2020/03/Where-Im-From-zine-folding-instructions.pdf">
    <img src="resources/readme_images/folding_guide.png" width="600">
</a>
<br><br>

>[!TIP]
>once assembled, use a gluestick to increase your zine's structural stability (add glue to the back of the purple sections):

<img src="resources/readme_images/glue_guide.png" width="600">

## built-in fonts

bundled fonts are automatically available. just use `font-family` in your CSS:

```html
<style>
  #front-cover { font-family: 'Basteleur Bold'; }
  #page1 { font-family: 'Baskervville'; font-style: italic; }
</style>
```

<details>
<summary>available font families</summary>

| font-family | variants | license |
|-------------|----------|---------|
| `Baskervville` | Regular, Italic, Bold, Bold Italic | [SIL Open Font License](resources/fonts/baskervvile/OFL.txt) |
| `Baskervville Medium` | Regular, Italic | [SIL Open Font License](resources/fonts/baskervvile/OFL.txt) |
| `Baskervville SemiBold` | Regular, Italic | [SIL Open Font License](resources/fonts/baskervvile/OFL.txt) |
| `Basteleur Bold` | Regular | [SIL Open Font License](resources/fonts/basteleur-master/LICENSE.txt) |
| `Basteleur Moonlight` | Regular | [SIL Open Font License](resources/fonts/basteleur-master/LICENSE.txt) |
| `CatShop` | Regular | [SIL Open Font License](resources/fonts/CatShop/Open%20Font%20License.txt) |
| `Cut Me Out` | Regular | [SIL Open Font License](resources/fonts/CutMeOut/Open%20Font%20License.txt) |
| `Cut Me Out 2` | Regular | [SIL Open Font License](resources/fonts/CutMeOut/Open%20Font%20License.txt) |
| `Cut Me Out 3` | Regular | [SIL Open Font License](resources/fonts/CutMeOut/Open%20Font%20License.txt) |
| `Elb-Tunnel` | Regular | [Creative Commons](resources/fonts/ElbtunnelTT/Creative%20Commons%20Lizenz.txt) |
| `Elb-Tunnel Schatten` | Regular | [Creative Commons](resources/fonts/ElbtunnelTT/Creative%20Commons%20Lizenz.txt) |
| `Electrolize` | Regular | [SIL Open Font License](resources/fonts/Electrolize/OFL.txt) |
| `Eureka` | Regular | [SIL Open Font License](resources/fonts/Eureka/Open%20Font%20License.txt) |
| `Eyechart` | Regular | [SIL Open Font License](resources/fonts/Eyechart/Open%20Font%20License.txt) |
| `Immermann` | Regular | [SIL Open Font License](resources/fonts/Immermann/Open%20Font%20License.txt) |
| `Impact Label` | Regular | [Tension Type Free Font License](resources/fonts/impact-label/Tension%20Type%20Font%20License.txt) |
| `Impact Label Reversed` | Regular | [Tension Type Free Font License](resources/fonts/impact-label/Tension%20Type%20Font%20License.txt) |
| `Indira K` | Regular | [SIL Open Font License](resources/fonts/Indira_K/OFL.txt) |
| `Instrument Serif` | Regular, Italic | [SIL Open Font License](resources/fonts/Instrument_Serif/OFL.txt) |
| `Kanalisirung` | Regular | [SIL Open Font License](resources/fonts/Kanalisirung/OFL.txt) |
| `Karrik` | Regular, Italic | [SIL Open Font License](resources/fonts/karrik_fonts-main/LICENCE.txt) |
| `MMX2010` | Regular | [SIL Open Font License](resources/fonts/MMX2010/Open%20Font%20License.txt) |
| `Mon Hugo` | Regular | [SIL Open Font License](resources/fonts/Mon_Hugo_freefont/FREE%20FONT%20LICENSE.txt) |
| `Mon Hugo Out` | Regular | [SIL Open Font License](resources/fonts/Mon_Hugo_freefont/FREE%20FONT%20LICENSE.txt) |
| `Murrx` | Regular | [SIL Open Font License](resources/fonts/Murrx/Open%20Font%20License.txt) |
| `Neo-castel` | Regular | [OIFL (French OFL)](resources/fonts/N%C3%A9o-castel/Licence.txt) |
| `Ouest` | Regular | [OIFL (French OFL)](resources/fonts/OUEST/license.txt) |
| `Resistance` | Regular | [SIL Open Font License](resources/fonts/resistance-generale-master/LICENSE.txt) |
| `Special Gothic Expanded One` | Regular | [SIL Open Font License](resources/fonts/Special_Gothic_Expanded_One/OFL.txt) |

</details>

## cool zine ideas:
- comic book
- recipe book
- album review
- photo album
- dream journal
- poem collection
- manifesto

## licenses and acknowledgements

this project is licensed under the [GNU General Public License v3.0](LICENSE).

## technologies used

- [CodeMirror 6](https://codemirror.net/)
- [GitHub Dark Theme for CodeMirror](https://github.com/fsegurai/codemirror-themes)
