import { RSSItem } from "../models/item"

export function parseArticleKeywords(raw: string): string[] {
    if (!raw || !String(raw).trim()) {
        return []
    }
    return String(raw)
        .split(/[\n,，;；]/)
        .map(s => s.trim())
        .filter(Boolean)
}

export function plainTextFromHtml(html: string): string {
    if (!html) {
        return ""
    }
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

export function findFirstMatchingKeyword(
    text: string,
    keywords: string[]
): string | null {
    const lower = text.toLowerCase()
    for (const kw of keywords) {
        const k = kw.toLowerCase()
        if (k && lower.includes(k)) {
            return kw
        }
    }
    return null
}

export function findFirstMatchingKeywordInItem(
    item: RSSItem,
    keywords: string[]
): string | null {
    if (!keywords.length) {
        return null
    }
    const t = findFirstMatchingKeyword(item.title || "", keywords)
    if (t) {
        return t
    }
    const s = findFirstMatchingKeyword(item.snippet || "", keywords)
    if (s) {
        return s
    }
    return findFirstMatchingKeyword(plainTextFromHtml(item.content || ""), keywords)
}
