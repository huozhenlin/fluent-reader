import * as React from "react"
import { useMemo, useCallback } from "react"
import intl from "react-intl-universal"
import { Icon } from "@fluentui/react/lib/Icon"
import { Stack } from "@fluentui/react"
import { SourceGroup } from "../schema-types"
import { RSSSource } from "../scripts/models/source"
import { ALL, initFeeds } from "../scripts/models/feed"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { openGroupMenu } from "../scripts/models/app"
import { toggleGroupExpansion } from "../scripts/models/group"
import {
    selectAllArticles,
    selectSources,
} from "../scripts/models/page"

export type SourcesRailProps = {
    collapsed: boolean
    onToggleCollapse: () => void
}

export const SourcesRail: React.FC<SourcesRailProps> = ({
    collapsed,
    onToggleCollapse,
}) => {
    const dispatch = useAppDispatch()

    const status = useAppSelector(
        s => s.app.sourceInit && !s.app.settings.display
    )
    const selected = useAppSelector(s => s.app.menuKey)
    const sources = useAppSelector(s => s.sources)
    const rawGroups = useAppSelector(s => s.groups)
    const groups = useMemo(
        () => rawGroups.map((g, i) => ({ ...g, index: i })),
        [rawGroups]
    )

    const handleAllArticles = useCallback((init = false) => {
        dispatch(selectAllArticles(init))
        dispatch(initFeeds())
    }, [])
    const handleSelectSourceGroup = useCallback(
        (group: SourceGroup, menuKey: string) => {
            dispatch(selectSources(group.sids, menuKey, group.name))
            dispatch(initFeeds())
        },
        []
    )
    const handleSelectSource = useCallback((source: RSSSource) => {
        dispatch(selectSources([source.sid], "s-" + source.sid, source.name))
        dispatch(initFeeds())
    }, [])
    const handleGroupContextMenu = useCallback(
        (sids: number[], event: React.MouseEvent) => {
            dispatch(openGroupMenu(sids, event))
        },
        []
    )
    const handleToggleExpand = useCallback(
        (event: React.MouseEvent, groupIndex: number) => {
            event.stopPropagation()
            dispatch(toggleGroupExpansion(groupIndex))
        },
        []
    )

    const countOverflow = (count: number) =>
        count >= 1000 ? "999+" : String(count)

    const totalUnread = useMemo(
        () =>
            Object.values(sources)
                .filter(s => !s.hidden)
                .map(s => s.unreadCount)
                .reduce((a, b) => a + b, 0),
        [sources]
    )

    const onContext = (
        type: "s" | "g",
        index: number,
        event: React.MouseEvent
    ) => {
        event.preventDefault()
        let sids: number[]
        if (type === "s") {
            sids = [index]
        } else {
            sids = groups[index].sids
        }
        handleGroupContextMenu(sids, event)
    }

    const rowClass = (key: string) =>
        "sources-rail-row" + (selected === key ? " selected" : "")

    if (!status) {
        return null
    }

    return (
        <div
            className={
                "list-sources-rail" + (collapsed ? " collapsed" : "")
            }>
            <div className="sources-rail-inner">
                <div className="sources-rail-titlebar">
                    {!collapsed && (
                        <span className="sources-rail-col-title">
                            {intl.get("sourcesRail.subscriptionColumn")}
                        </span>
                    )}
                    <button
                        type="button"
                        className="sources-rail-toggle"
                        title={
                            collapsed
                                ? intl.get("sourcesRail.expand")
                                : intl.get("sourcesRail.collapse")
                        }
                        aria-expanded={!collapsed}
                        onClick={onToggleCollapse}>
                        <Icon
                            iconName={
                                collapsed ? "ChevronRight" : "ChevronLeft"
                            }
                        />
                    </button>
                </div>
                <div className="sources-rail-scroll" data-is-scrollable>
                <button
                    type="button"
                    className={rowClass(ALL)}
                    onClick={() => handleAllArticles(selected !== ALL)}>
                    <Icon
                        className="sources-rail-row-icon"
                        iconName="TextDocument"
                    />
                    <Stack className="sources-rail-row-text" grow>
                        <span className="sources-rail-row-title">
                            {intl.get("allArticles")}
                        </span>
                        <span className="sources-rail-row-sub">
                            {totalUnread > 0 ? countOverflow(totalUnread) : ""}
                        </span>
                    </Stack>
                </button>
                <p className="sources-rail-header">
                    {intl.get("sourcesRail.publishers")}
                </p>
                {groups
                    .filter(g => g.sids.length > 0)
                    .map(g => {
                        if (g.isMultiple) {
                            const groupSources = g.sids.map(sid => sources[sid])
                            const unread = groupSources
                                .map(s => s.unreadCount)
                                .reduce((a, b) => a + b, 0)
                            const menuKey = "g-" + g.index
                            return (
                                <div
                                    key={menuKey}
                                    className="sources-rail-group">
                                    <div className="sources-rail-group-header">
                                        <button
                                            type="button"
                                            className="sources-rail-expand"
                                            aria-expanded={g.expanded}
                                            title={intl.get("menu.expand")}
                                            onClick={e =>
                                                handleToggleExpand(e, g.index)
                                            }>
                                            <Icon
                                                iconName={
                                                    g.expanded
                                                        ? "ChevronDown"
                                                        : "ChevronRight"
                                                }
                                            />
                                        </button>
                                        <button
                                            type="button"
                                            className={
                                                rowClass(menuKey) +
                                                " sources-rail-inline"
                                            }
                                            onContextMenu={e =>
                                                onContext("g", g.index, e)
                                            }
                                            onClick={() =>
                                                handleSelectSourceGroup(
                                                    g,
                                                    menuKey
                                                )
                                            }>
                                            {collapsed && (
                                                <Icon
                                                    className="sources-rail-row-icon sources-rail-group-folder"
                                                    iconName="Folder"
                                                />
                                            )}
                                            <Stack
                                                className="sources-rail-row-text"
                                                grow>
                                                <span className="sources-rail-row-title">
                                                    {g.name}
                                                </span>
                                                <span className="sources-rail-row-sub">
                                                    {unread > 0
                                                        ? countOverflow(unread)
                                                        : ""}
                                                </span>
                                            </Stack>
                                        </button>
                                    </div>
                                    {g.expanded &&
                                        groupSources.map(s => {
                                            const sidKey = "s-" + s.sid
                                            return (
                                                <button
                                                    type="button"
                                                    key={sidKey}
                                                    className={
                                                        rowClass(sidKey) +
                                                        " nested"
                                                    }
                                                    onClick={() =>
                                                        handleSelectSource(s)
                                                    }
                                                    onContextMenu={e =>
                                                        onContext(
                                                            "s",
                                                            s.sid,
                                                            e
                                                        )
                                                    }>
                                                    {s.iconurl ? (
                                                        <img
                                                            className="sources-rail-favicon"
                                                            src={s.iconurl}
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <Icon
                                                            className="sources-rail-row-icon"
                                                            iconName="Rss"
                                                        />
                                                    )}
                                                    <Stack
                                                        className="sources-rail-row-text"
                                                        grow>
                                                        <span className="sources-rail-row-title">
                                                            {s.name}
                                                        </span>
                                                        <span className="sources-rail-row-sub">
                                                            {s.unreadCount > 0
                                                                ? countOverflow(
                                                                      s.unreadCount
                                                                  )
                                                                : ""}
                                                        </span>
                                                    </Stack>
                                                </button>
                                            )
                                        })}
                                </div>
                            )
                        }
                        const s = sources[g.sids[0]]
                        const sidKey = "s-" + s.sid
                        return (
                            <button
                                type="button"
                                key={sidKey}
                                className={rowClass(sidKey)}
                                onClick={() => handleSelectSource(s)}
                                onContextMenu={e => onContext("s", s.sid, e)}>
                                {s.iconurl ? (
                                    <img
                                        className="sources-rail-favicon"
                                        src={s.iconurl}
                                        alt=""
                                    />
                                ) : (
                                    <Icon
                                        className="sources-rail-row-icon"
                                        iconName="Rss"
                                    />
                                )}
                                <Stack className="sources-rail-row-text" grow>
                                    <span className="sources-rail-row-title">
                                        {s.name}
                                    </span>
                                    <span className="sources-rail-row-sub">
                                        {s.unreadCount > 0
                                            ? countOverflow(s.unreadCount)
                                            : ""}
                                    </span>
                                </Stack>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default SourcesRail
