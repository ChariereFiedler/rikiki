function c(i,g=","){let f=[],n=[],l="",t=!1,r=()=>{n.push(l),l=""},o=()=>{r(),f.push(n),n=[]};for(let e=0;e<i.length;e++){let s=i[e];t?s==='"'?i[e+1]==='"'?(l+='"',e++):t=!1:l+=s:s==='"'?t=!0:s===g?r():s===`
`?o():s!=="\r"&&(l+=s)}return(l.length>0||n.length>0)&&o(),f.filter(e=>!(e.length===1&&e[0]===""))}export{c as parseCsv};
