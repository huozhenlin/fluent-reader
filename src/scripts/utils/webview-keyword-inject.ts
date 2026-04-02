/**
 * Guest-page script for Electron webview: highlight configured keywords in visible text.
 * Injected via webview.executeJavaScript (external URLs).
 */
export function buildWebviewKeywordHighlightInjectSource(
    keywords: string[]
): string | null {
    if (!keywords.length) {
        return null
    }
    const K = JSON.stringify(keywords)
    return (
        "(function(){" +
        "'use strict';" +
        "if(document.documentElement.getAttribute('data-fr-kw')==='1')return;" +
        "document.documentElement.setAttribute('data-fr-kw','1');" +
        "var K=" +
        K +
        ";" +
        "function mergeRanges(ranges){if(!ranges.length)return[];" +
        "var sorted=[].concat(ranges).sort(function(a,b){return a.start-b.start});" +
        "var out=[];for(var i=0;i<sorted.length;i++){" +
        "var r=sorted[i],last=out[out.length-1];" +
        "if(!last||r.start>last.end)out.push({start:r.start,end:r.end});" +
        "else last.end=Math.max(last.end,r.end);}return out;}" +
        "function highlightKeywordsInNode(root,keywords){" +
        "if(!keywords.length)return;" +
        "var lowerKeywords=keywords.map(function(k){return k.trim().toLowerCase();}).filter(Boolean);" +
        "if(!lowerKeywords.length)return;" +
        "var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{" +
        "acceptNode:function(node){" +
        "var p=node.parentElement;if(!p)return NodeFilter.FILTER_REJECT;" +
        "if(p.closest('script,style,noscript'))return NodeFilter.FILTER_REJECT;" +
        "return NodeFilter.FILTER_ACCEPT;}});" +
        "var nodes=[],n;while(n=walker.nextNode())nodes.push(n);" +
        "for(var ti=0;ti<nodes.length;ti++){" +
        "var textNode=nodes[ti],text=textNode.textContent;if(!text)continue;" +
        "var lower=text.toLowerCase(),ranges=[];" +
        "for(var ki=0;ki<lowerKeywords.length;ki++){" +
        "var kw=lowerKeywords[ki],i=0;" +
        "while(i<lower.length){var j=lower.indexOf(kw,i);if(j<0)break;" +
        "ranges.push({start:j,end:j+kw.length});i=j+1;}}" +
        "var merged=mergeRanges(ranges);if(!merged.length)continue;" +
        "var frag=document.createDocumentFragment(),pos=0;" +
        "for(var mi=0;mi<merged.length;mi++){" +
        "var r=merged[mi];if(r.start>pos)frag.appendChild(document.createTextNode(text.slice(pos,r.start)));" +
        "var span=document.createElement('span');span.className='article-keyword-hit';" +
        "span.textContent=text.slice(r.start,r.end);frag.appendChild(span);pos=r.end;}" +
        "if(pos<text.length)frag.appendChild(document.createTextNode(text.slice(pos)));" +
        "textNode.parentNode.replaceChild(frag,textNode);}}" +
        "var st=document.createElement('style');" +
        "st.textContent='.article-keyword-hit{color:#a4262c;font-weight:600;}'+" +
        "'@media (prefers-color-scheme: dark){.article-keyword-hit{color:#f1707b;}}';" +
        "(document.head||document.documentElement).appendChild(st);" +
        "if(document.body)highlightKeywordsInNode(document.body,K);" +
        "})();"
    )
}
