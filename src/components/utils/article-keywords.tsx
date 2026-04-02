import * as React from "react"
export {
    parseArticleKeywords,
    plainTextFromHtml,
    findFirstMatchingKeyword,
    findFirstMatchingKeywordInItem,
} from "../../scripts/utils/article-keywords-match"

type Range = { start: number; end: number }

function mergeRanges(ranges: Range[]): Range[] {
    if (ranges.length === 0) {
        return []
    }
    const sorted = [...ranges].sort((a, b) => a.start - b.start)
    const out: Range[] = []
    for (const r of sorted) {
        const last = out[out.length - 1]
        if (!last || r.start > last.end) {
            out.push({ ...r })
        } else {
            last.end = Math.max(last.end, r.end)
        }
    }
    return out
}

/** Wrap each matched substring with a span (list / search highlights). */
export function highlightTextWithKeywords(
    text: string,
    keywords: string[]
): React.ReactNode {
    if (!keywords.length || !text) {
        return text
    }
    const lower = text.toLowerCase()
    const ranges: Range[] = []
    for (const kw of keywords) {
        const k = kw.trim().toLowerCase()
        if (!k) {
            continue
        }
        let i = 0
        while (i < lower.length) {
            const j = lower.indexOf(k, i)
            if (j < 0) {
                break
            }
            ranges.push({ start: j, end: j + k.length })
            i = j + 1
        }
    }
    const merged = mergeRanges(ranges)
    if (merged.length === 0) {
        return text
    }
    const parts: React.ReactNode[] = []
    let pos = 0
    merged.forEach((r, idx) => {
        if (r.start > pos) {
            parts.push(text.slice(pos, r.start))
        }
        parts.push(
            <span
                key={`hit-${r.start}-${r.end}-${idx}`}
                className="article-keyword-hit">
                {text.slice(r.start, r.end)}
            </span>
        )
        pos = r.end
    })
    if (pos < text.length) {
        parts.push(text.slice(pos))
    }
    return <>{parts}</>
}

export const ARTICLE_KW_SESSION_PREFIX = "articleKw:"

export function sessionKeyForArticleKeyword(
    itemId: number,
    keyword: string
): string {
    return `${ARTICLE_KW_SESSION_PREFIX}${itemId}::${encodeURIComponent(keyword)}`
}

export function clearArticleKeywordSessionFlags(): void {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith(ARTICLE_KW_SESSION_PREFIX)) {
            keys.push(k)
        }
    }
    keys.forEach(k => sessionStorage.removeItem(k))
}
