import { RSSItem } from "./item"
import {
    findFirstMatchingKeywordInItem,
} from "../utils/article-keywords-match"

/** Sidebar + filter: articles whose title/snippet/body match configured keywords. */
export const PUBLISHER_KEY_MY_FOLLOWING = "__my_following__"

/** Normalized creator for grouping (trim); empty string if missing. */
export function normalizePublisherCreator(c?: string): string {
    return (c && c.trim()) || ""
}

/**
 * @param publisherKey null = all; PUBLISHER_KEY_MY_FOLLOWING = keyword matches; "" = items with no creator; else match normalized creator
 * @param keywordStrings required for MY_FOLLOWING (parsed article keywords)
 */
export function filterItemsByPublisherKey(
    items: RSSItem[],
    publisherKey: string | null,
    keywordStrings: string[] = []
): RSSItem[] {
    if (publisherKey === null) {
        return items
    }
    if (publisherKey === PUBLISHER_KEY_MY_FOLLOWING) {
        if (!keywordStrings.length) {
            return []
        }
        return items.filter(i =>
            Boolean(findFirstMatchingKeywordInItem(i, keywordStrings))
        )
    }
    return items.filter(i => {
        const n = normalizePublisherCreator(i.creator)
        if (publisherKey === "") {
            return n === ""
        }
        return n === publisherKey
    })
}

export function itemMatchesPublisherKey(
    item: RSSItem,
    publisherKey: string | null,
    keywordStrings: string[] = []
): boolean {
    if (publisherKey === null) {
        return true
    }
    if (publisherKey === PUBLISHER_KEY_MY_FOLLOWING) {
        if (!keywordStrings.length) {
            return false
        }
        return Boolean(findFirstMatchingKeywordInItem(item, keywordStrings))
    }
    const n = normalizePublisherCreator(item.creator)
    if (publisherKey === "") {
        return n === ""
    }
    return n === publisherKey
}
