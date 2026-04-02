import * as React from "react"
import { useCallback, useMemo, useEffect } from "react"
import intl from "react-intl-universal"
import { RSSItem, markRead, itemShortcuts } from "../../scripts/models/item"
import { openItemMenu } from "../../scripts/models/app"
import { RSSFeed, FeedFilter, loadMore } from "../../scripts/models/feed"
import { showItem, setArticleHighlightKeywords } from "../../scripts/models/page"
import { filterItemsByPublisherKey } from "../../scripts/models/publisher-filter"
import { useAppSelector, useAppDispatch } from "../../scripts/reducer"
import { ViewType, ViewConfigs } from "../../schema-types"
import CardsFeed from "./cards-feed"
import ListFeed from "./list-feed"
import {
    parseArticleKeywords,
    findFirstMatchingKeywordInItem,
    sessionKeyForArticleKeyword,
    clearArticleKeywordSessionFlags,
} from "../utils/article-keywords"

export type FeedProps = {
    feed: RSSFeed
    viewType: ViewType
    viewConfigs?: ViewConfigs
    items: RSSItem[]
    currentItem: number
    sourceMap: Object
    filter: FeedFilter
    keywordStrings: string[]
    shortcuts: (item: RSSItem, e: KeyboardEvent) => void
    markRead: (item: RSSItem) => void
    contextMenu: (feedId: string, item: RSSItem, e) => void
    loadMore: (feed: RSSFeed) => void
    showItem: (fid: string, item: RSSItem) => void
}

interface FeedOwnProps {
    feedId: string
    viewType: ViewType
}

export const Feed: React.FC<FeedOwnProps> = ({ feedId, viewType }) => {
    const dispatch = useAppDispatch()

    const feed = useAppSelector(s => s.feeds[feedId])
    const itemsRaw = useAppSelector(s =>
        s.feeds[feedId] ? s.feeds[feedId].iids.map(iid => s.items[iid]) : []
    )
    const publisherKey = useAppSelector(s => s.page.publisherKey)
    const kwRaw = useAppSelector(s => s.page.articleHighlightKeywords)
    const keywordStrings = useMemo(() => parseArticleKeywords(kwRaw), [kwRaw])
    const items = useMemo(
        () =>
            filterItemsByPublisherKey(itemsRaw, publisherKey, keywordStrings),
        [itemsRaw, publisherKey, keywordStrings]
    )
    const sourceMap = useAppSelector(s => s.sources)
    const filter = useAppSelector(s => s.page.filter)
    const viewConfigs = useAppSelector(s => s.page.viewConfigs)
    const currentItem = useAppSelector(s => s.page.itemId)

    useEffect(() => {
        const onKeywordsChanged = () => {
            dispatch(
                setArticleHighlightKeywords(
                    window.settings.getArticleHighlightKeywords()
                )
            )
            clearArticleKeywordSessionFlags()
        }
        window.addEventListener("article-keywords-changed", onKeywordsChanged)
        return () =>
            window.removeEventListener(
                "article-keywords-changed",
                onKeywordsChanged
            )
    }, [dispatch])

    useEffect(() => {
        if (!feed?.loaded || keywordStrings.length === 0) {
            return
        }
        if (typeof Notification === "undefined") {
            return
        }
        if (Notification.permission !== "granted") {
            return
        }
        if (window.utils.isFocused()) {
            return
        }
        for (const item of items) {
            const m = findFirstMatchingKeywordInItem(item, keywordStrings)
            if (!m) {
                continue
            }
            const sk = sessionKeyForArticleKeyword(item._id, m)
            if (sessionStorage.getItem(sk)) {
                continue
            }
            sessionStorage.setItem(sk, "1")
            try {
                new Notification(intl.get("articleKeyword.notifyTitle"), {
                    body: intl.get("articleKeyword.notifyBody", {
                        title: item.title,
                        keyword: m,
                    }),
                })
            } catch {
                /* ignore */
            }
        }
    }, [items, feed?.loaded, keywordStrings])

    const handleShortcuts = useCallback(
        (item: RSSItem, e: KeyboardEvent) => dispatch(itemShortcuts(item, e)),
        []
    )
    const handleMarkRead = useCallback(
        (item: RSSItem) => dispatch(markRead(item)),
        []
    )
    const handleContextMenu = useCallback(
        (fid: string, item: RSSItem, e) => dispatch(openItemMenu(item, fid, e)),
        []
    )
    const handleLoadMore = useCallback((f: RSSFeed) => {
        dispatch(loadMore(f))
    }, [])
    const handleShowItem = useCallback(
        (fid: string, item: RSSItem) => dispatch(showItem(fid, item)),
        []
    )

    const feedProps: FeedProps = {
        feed,
        viewType,
        viewConfigs,
        items,
        currentItem,
        sourceMap,
        filter,
        keywordStrings,
        shortcuts: handleShortcuts,
        markRead: handleMarkRead,
        contextMenu: handleContextMenu,
        loadMore: handleLoadMore,
        showItem: handleShowItem,
    }

    switch (viewType) {
        case ViewType.Cards:
            return <CardsFeed {...feedProps} />
        case ViewType.Magazine:
        case ViewType.Compact:
        case ViewType.List:
            return <ListFeed {...feedProps} />
    }
}
