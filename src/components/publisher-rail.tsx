import * as React from "react"
import { useCallback } from "react"
import intl from "react-intl-universal"
import { Stack } from "@fluentui/react"
import { SOURCE } from "../scripts/models/feed"
import { ViewType } from "../schema-types"
import { useAppSelector, useAppDispatch } from "../scripts/reducer"
import { selectPublisher } from "../scripts/models/page"
import { selectPublisherRows } from "../scripts/selectors/publisher-rail"
import { PUBLISHER_KEY_MY_FOLLOWING } from "../scripts/models/publisher-filter"
import { PublisherAvatar } from "./utils/publisher-avatar"

export const PublisherRail: React.FC = () => {
    const dispatch = useAppDispatch()
    const viewType = useAppSelector(s => s.page.viewType)
    const feedId = useAppSelector(s => s.page.feedId)
    const publisherKey = useAppSelector(s => s.page.publisherKey)
    const feed = useAppSelector(s => s.feeds[SOURCE])
    const rows = useAppSelector(selectPublisherRows)

    const onPick = useCallback(
        (key: string | null) => {
            dispatch(selectPublisher(key))
        },
        [dispatch]
    )

    if (viewType !== ViewType.List || feedId !== SOURCE || !feed) {
        return null
    }

    return (
        <div className="list-publisher-rail">
            <div className="publisher-rail-inner">
                <div className="publisher-rail-titlebar">
                    <span className="publisher-rail-col-title">
                        {intl.get("publisherRail.columnTitle")}
                    </span>
                </div>
                <div className="publisher-rail-scroll" data-is-scrollable>
                    {!feed.loaded
                        ? null
                        : rows.map(row => (
                              <button
                                  type="button"
                                  key={
                                      row.key === null
                                          ? "__all__"
                                          : row.key === PUBLISHER_KEY_MY_FOLLOWING
                                            ? "__my_following__"
                                            : row.key === ""
                                              ? "__empty__"
                                              : row.key
                                  }
                                  className={
                                      "publisher-rail-row" +
                                      (publisherKey === row.key
                                          ? " selected"
                                          : "") +
                                      (row.key === null ? " all-row" : "") +
                                      (row.key === PUBLISHER_KEY_MY_FOLLOWING
                                          ? " my-following-row"
                                          : "") +
                                      (row.unread > 0 ? " has-unread" : "")
                                  }
                                  onClick={() => onPick(row.key)}>
                                  <PublisherAvatar
                                      label={row.label}
                                      avatarUrl={row.avatarUrl}
                                  />
                                  <Stack
                                      className="publisher-rail-row-text"
                                      grow>
                                      <span className="publisher-rail-row-title">
                                          {row.label}
                                      </span>
                                      <span className="publisher-rail-row-sub">
                                          {row.unread > 0 ? (
                                              <>
                                                  <span className="publisher-rail-unread-num">
                                                      {row.unread}
                                                  </span>
                                                  <span className="publisher-rail-unread-suffix">
                                                      {intl.get(
                                                          "publisherRail.unreadSuffix"
                                                      )}
                                                  </span>
                                              </>
                                          ) : (
                                              <span className="publisher-rail-all-read">
                                                  {intl.get(
                                                      "publisherRail.allRead"
                                                  )}
                                              </span>
                                          )}
                                      </span>
                                  </Stack>
                              </button>
                          ))}
                </div>
            </div>
        </div>
    )
}

export default PublisherRail
