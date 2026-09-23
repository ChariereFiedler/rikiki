// Browser oracle for landing UI text. Slide previews are separate documents/images
// deliberately scaled as thumbnails; they are not landing UI typography.
import { chromium, firefox } from '../../rikiki/node_modules/playwright/index.mjs';
const url = process.argv[2] ?? 'http://127.0.0.1:7804/';
const failures = [];
for (const [name, engine] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await engine.launch({headless:true});
  try {
    const page = await browser.newPage();
    for (const width of [390, 768, 1440, 2048]) {
      await page.setViewportSize({width,height:1056});
      await page.goto(url,{waitUntil:'networkidle'});
      await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('details').forEach(d=>d.open=true)});
      const issues = await page.evaluate(()=>{
        const issues=[];
        const walker=document.createTreeWalker(document.querySelector('.landing') ?? document.body,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()) {
          const node=walker.currentNode, text=node.textContent.trim(), el=node.parentElement;
          if(!text || !el || el.closest('script,style,template,[aria-hidden="true"]'))continue;
          const range=document.createRange();range.selectNodeContents(node);
          if(!range.getClientRects().length)continue;
          let visible=true,scale=1;
          for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)visible=false;
            if(s.transform!=='none'){const m=new DOMMatrix(s.transform);scale*=Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d));}
          }
          if(!visible)continue;
          const size=parseFloat(getComputedStyle(el).fontSize)*scale;
          if(size<13.99)issues.push({kind:'small-text',size:Math.round(size*100)/100,text:text.slice(0,90),element:el.tagName+'.'+el.className});
          if(el.closest('.film-section') && !el.closest('video')) {
            const rgb=value=>value.match(/[\d.]+/g)?.map(Number);
            const luminance=values=>values.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
            let bg;
            for(let p=el;p;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c && (c.length===3 || c[3]===1)){bg=c;break}}
            const fg=rgb(getComputedStyle(el).color);
            if(fg&&bg){const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
              if(ratio<4.5)issues.push({kind:'film-text-contrast',ratio,text:text.slice(0,90)});
            }
          }
        }
        for(const el of document.querySelectorAll('.source-code pre,.workflow-grid code')){
          if(el.scrollWidth>el.clientWidth+1)issues.push({kind:'clipped-code',text:el.textContent.slice(0,60)});
        }
        if(document.documentElement.scrollWidth>innerWidth+1)issues.push({kind:'horizontal-page-overflow'});
        return issues;
      });
      failures.push(...issues.map(issue=>({browser:name,width,...issue})));
      console.log(`${name} ${width}px: ${issues.length} issue(s)`);
    }
  } finally {await browser.close()}
}
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}
else console.log('Landing readability: every visible UI text is at least 14px; source/command blocks fit.');
