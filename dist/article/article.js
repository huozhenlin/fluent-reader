function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
let dir = get("d")
if (dir === "1") {
    document.body.classList.add("rtl")
} else if (dir === "2") {
    document.body.classList.add("vertical")
    document.body.addEventListener("wheel", (evt) => {
        document.scrollingElement.scrollLeft -= evt.deltaY;
    });
}
async function getArticle(url) {
    let article = get("a")
    if (get("m") === "1") {
        return (await Mercury.parse(url, {html: article})).content || ""
    } else {
        return article
    }
}
document.documentElement.style.fontSize = get("s") + "px"
let font = get("f")
if (font) document.body.style.fontFamily = `"${font}"`
let url = get("u")
function mergeRanges(ranges) {
    if (!ranges.length) return []
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    const out = []
    for (const r of sorted) {
        const last = out[out.length - 1]
        if (!last || r.start > last.end) out.push({ start: r.start, end: r.end })
        else last.end = Math.max(last.end, r.end)
    }
    return out
}
function parseKeywords() {
    const raw = get("k")
    if (!raw) return []
    try {
        const parsed = JSON.parse(decodeURIComponent(raw))
        return Array.isArray(parsed) ? parsed.filter(function (x) { return typeof x === "string" }) : []
    } catch (e) {
        return []
    }
}
function highlightKeywordsInNode(root, keywords) {
    if (!keywords.length) return
    const lowerKeywords = keywords.map(function (k) { return k.trim().toLowerCase() }).filter(Boolean)
    if (!lowerKeywords.length) return
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
            var p = node.parentElement
            if (!p) return NodeFilter.FILTER_REJECT
            if (p.closest("script, style, noscript")) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        }
    })
    const nodes = []
    var n
    while (n = walker.nextNode()) nodes.push(n)
    for (var ti = 0; ti < nodes.length; ti++) {
        var textNode = nodes[ti]
        var text = textNode.textContent
        if (!text) continue
        var lower = text.toLowerCase()
        var ranges = []
        for (var ki = 0; ki < lowerKeywords.length; ki++) {
            var k = lowerKeywords[ki]
            var i = 0
            while (i < lower.length) {
                var j = lower.indexOf(k, i)
                if (j < 0) break
                ranges.push({ start: j, end: j + k.length })
                i = j + 1
            }
        }
        var merged = mergeRanges(ranges)
        if (!merged.length) continue
        var frag = document.createDocumentFragment()
        var pos = 0
        for (var mi = 0; mi < merged.length; mi++) {
            var r = merged[mi]
            if (r.start > pos) {
                frag.appendChild(document.createTextNode(text.slice(pos, r.start)))
            }
            var span = document.createElement("span")
            span.className = "article-keyword-hit"
            span.textContent = text.slice(r.start, r.end)
            frag.appendChild(span)
            pos = r.end
        }
        if (pos < text.length) {
            frag.appendChild(document.createTextNode(text.slice(pos)))
        }
        textNode.parentNode.replaceChild(frag, textNode)
    }
}
var keywords = parseKeywords()
getArticle(url).then(function (article) {
    let domParser = new DOMParser()
    let dom = domParser.parseFromString(get("h"), "text/html")
    dom.getElementsByTagName("article")[0].innerHTML = article
    let baseEl = dom.createElement('base')
    baseEl.setAttribute('href', url.split("/").slice(0, 3).join("/"))
    dom.head.append(baseEl)
    for (let s of dom.getElementsByTagName("script")) {
        s.parentNode.removeChild(s)
    }
    for (let e of dom.querySelectorAll("*[src]")) {
        e.src = e.src
    }
    for (let e of dom.querySelectorAll("*[href]")) {
        e.href = e.href
    }
    let main = document.getElementById("main")
    main.innerHTML = dom.body.innerHTML
    main.classList.add("show")
    highlightKeywordsInNode(main, keywords)
})
