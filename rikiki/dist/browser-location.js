var o={read(){return typeof location>"u"?"":location.hash},write(t){if(!(typeof history>"u"))try{history.replaceState(null,"",t)}catch{}}};export{o as browserLocation};
