/* rRNA labels (rrna_lookup.py). Sequences that match the human rDNA unit (KY962518) at >=95% identity
   over >=80% of their length get an rRNA tag; "no named gene" / the GENCODE id in their gene column
   becomes the rRNA name (the old name stays in brackets). */
(function(){
var L=["28S rRNA", "5.8S rRNA", "rDNA spacer (5' ETS)"], M={"ACACTTCGAACGCACTTGCGGCCCCGGGTTCCTCCCGGG":1,"CAAGCACATACACCAAATGTCTGAACCTGCGGTTCCTCT":0,"CACTTCGAACGCACTTGCGGCCCCGGGTTCCTCCCGGGG":1,"TAGCGGGTTGGGACGCGGCGGTCGGCGGGCGGTGGGTGT":2};
var RE=/[ACGT]{25,80}/g, GENE=/^\s*(named\s+)?(closest\s+)?genes?\b|^\s*gene name|^\s*what it is/i, NONE=/^\s*(no named gene|none|-|)\s*$/i;
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function style(){if(document.getElementById('rr-style'))return;var s=document.createElement('style');s.id='rr-style';
 s.textContent='.rr-tag{display:inline-block;font:600 11px/1.4 system-ui,sans-serif;padding:0 6px;margin:0 4px 2px 0;border-radius:9px;border:1px solid currentColor;opacity:.85;white-space:nowrap;vertical-align:middle}.rr-was{opacity:.65;font-weight:400}';
 document.head.appendChild(s)}
function geneCol(tr){var t=tr.closest('table');if(!t)return -1;var h=t.tHead&&t.tHead.rows.length?t.tHead.rows[t.tHead.rows.length-1]:null;
 if(!h){var r0=t.rows[0];if(r0&&r0.querySelector('th'))h=r0}if(!h)return -1;
 for(var i=0;i<h.cells.length;i++){if(GENE.test(h.cells[i].textContent))return i}return -1}
function fixRow(el,lab){
 var tr=el.closest('tr');
 if(tr&&!tr.dataset.rrRow){tr.dataset.rrRow=1;var gi=geneCol(tr);
  if(gi>=0&&tr.cells[gi]&&!tr.cells[gi].contains(el)){var c=tr.cells[gi],o=c.textContent.trim();
   c.innerHTML='<b>'+esc(lab)+'</b>'+(NONE.test(o)?'':' <span class="rr-was">(GENCODE: '+esc(o)+')</span>')}}
 var box=tr||el.closest('li,.card,.ex,.excard,.vcard');if(!box)return;
 if(!tr&&!box.dataset.rrRow){box.dataset.rrRow=1;var bb=box.querySelector('b,strong');if(bb&&!bb.contains(el)&&/^\s*(ENSG\d+|no named gene|unnamed)/i.test(bb.textContent)){var o2=bb.textContent.trim();bb.innerHTML=esc(lab.charAt(0).toUpperCase()+lab.slice(1))+(/no named gene/i.test(o2)?'':' <span class="rr-was">(GENCODE: '+esc(o2)+')</span>')}}
 var w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT,null),n,hit=[];
 while((n=w.nextNode()))if(/no named gene/i.test(n.nodeValue))hit.push(n);
 hit.forEach(function(n){n.nodeValue=n.nodeValue.replace(/no named gene/ig,function(m){return m[0]==='N'?lab.charAt(0).toUpperCase()+lab.slice(1):lab})})}
function mark(el,lab){
 if(!el||el.closest('svg')||el.closest('[data-rr]')||el.closest('script,style,textarea'))return;
 el.setAttribute('data-rr','1');
 var b=document.createElement('span');b.className='rr-tag';b.textContent=lab;b.title='matches the human ribosomal RNA gene unit (rDNA, KY962518); GENCODE does not name rRNA genes here';
 if(el.tagName==='TD')el.insertBefore(b,el.firstChild);else el.parentNode.insertBefore(b,el);
 fixRow(el,lab)}
function scan(root){
 if(!root||root.nodeType!==1)return;
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n,todo=[];
 while((n=w.nextNode())){var v=n.nodeValue;if(v.length<25)continue;RE.lastIndex=0;var m;
  while((m=RE.exec(v))){if(m[0] in M){todo.push([n.parentElement,L[M[m[0]]]]);break}}}
 var q=root.querySelectorAll('[class*="sq"],[class*="seq"],code,.mono');
 for(var i=0;i<q.length;i++){var t=q[i].textContent.replace(/\s+/g,'');if(t.length>=25&&t in M)todo.push([q[i],L[M[t]]])}
 todo.forEach(function(x){mark(x[0],x[1])})}
var pend=[],tick=false;
function flush(){tick=false;var p=pend;pend=[];p.forEach(scan)}
function start(){style();scan(document.body);
 new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(x){if(x.nodeType===1&&!(x.classList&&x.classList.contains('rr-tag')))pend.push(x);else if(x.nodeType===3&&x.parentElement)pend.push(x.parentElement)})});
  if(pend.length&&!tick){tick=true;requestAnimationFrame(flush)}}).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
