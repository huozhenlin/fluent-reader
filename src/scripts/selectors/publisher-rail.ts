import { createSelector } from "reselect"
import intl from "react-intl-universal"
import { SOURCE } from "../models/feed"
import {
    normalizePublisherCreator,
    filterItemsByPublisherKey,
    PUBLISHER_KEY_MY_FOLLOWING,
} from "../models/publisher-filter"
import {
    parseArticleKeywords,
    findFirstMatchingKeywordInItem,
} from "../utils/article-keywords-match"
import type { RootState } from "../reducer"
import type { RSSItem } from "../models/item"

export type PublisherRow = {
    key: string | null
    label: string
    unread: number
    /** From latest item in group that carries creatorAvatar (RSS / future mapping). */
    avatarUrl?: string
}

type Agg = {
    unread: number
    /** newest article date in this publisher group */
    maxDate: number
}

/** Pick avatar from the newest item in the group that defines creatorAvatar. */
function avatarUrlForPublisherKey(
    items: RSSItem[],
    key: string
): string | undefined {
    let best: { t: number; url: string } | null = null
    for (const it of items) {
        if (normalizePublisherCreator(it.creator) !== key) {
            continue
        }
        const url = it.creatorAvatar?.trim()
        if (!url) {
            continue
        }
        const t = it.date.getTime()
        if (!best || t >= best.t) {
            best = { t, url }
        }
    }
    return best?.url
}

function buildRows(
    items: RSSItem[],
    articleHighlightKeywords: string
): PublisherRow[] {
    const kwList = parseArticleKeywords(articleHighlightKeywords)
    const filtered = filterItemsByPublisherKey(items, null, kwList)
    const byKey = new Map<string, Agg>()
    for (const item of filtered) {
        const k = normalizePublisherCreator(item.creator)
        const prev = byKey.get(k) ?? { unread: 0, maxDate: 0 }
        if (!item.hasRead) {
            prev.unread += 1
        }
        const t = item.date.getTime()
        if (t > prev.maxDate) {
            prev.maxDate = t
        }
        byKey.set(k, prev)
    }
    const keys = [...byKey.keys()].sort((a, b) => {
        if (a === "") {
            return 1
        }
        if (b === "") {
            return -1
        }
        const A = byKey.get(a)!
        const B = byKey.get(b)!
        const ua = A.unread > 0 ? 1 : 0
        const ub = B.unread > 0 ? 1 : 0
        if (ua !== ub) {
            return ub - ua
        }
        if (B.maxDate !== A.maxDate) {
            return B.maxDate - A.maxDate
        }
        return a.localeCompare(b)
    })
    const list: PublisherRow[] = [
        {
            key: null,
            label: intl.get("publisherRail.allPublishers"),
            unread: filtered.filter(i => !i.hasRead).length,
        },
    ]
    if (kwList.length > 0) {
        const myFollowing = filtered.filter(i =>
            Boolean(findFirstMatchingKeywordInItem(i, kwList))
        )
        list.push({
            key: PUBLISHER_KEY_MY_FOLLOWING,
            label: intl.get("publisherRail.myFollowing"),
            unread: myFollowing.filter(i => !i.hasRead).length,
        })
    }
    for (const k of keys) {
        const label =
            k === "" ? intl.get("publisherRail.noAuthor") : k
        const avatarUrl = avatarUrlForPublisherKey(filtered, k)
        list.push({
            key: k === "" ? "" : k,
            label,
            unread: (byKey.get(k) ?? { unread: 0, maxDate: 0 }).unread,
            ...(avatarUrl ? { avatarUrl } : {}),
        })
    }
    return list
}

/**
 * Recomputes when SOURCE feed or any item in the store changes (so unread / new articles refresh).
 */
export const selectPublisherRows = createSelector(
    [
        (state: RootState) => state.feeds[SOURCE],
        (state: RootState) => state.items,
        (state: RootState) => state.page.articleHighlightKeywords,
    ],
    (feed, itemsState, articleHighlightKeywords): PublisherRow[] => {
        if (!feed || !feed.loaded) {
            return []
        }
        const items = feed.iids
            .map(iid => itemsState[iid])
            .filter((i): i is RSSItem => Boolean(i))
        return buildRows(items, articleHighlightKeywords)
    }
)
