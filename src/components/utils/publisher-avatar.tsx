import * as React from "react"
import { useState, useCallback, useEffect } from "react"

/** Stable hue 0–359 from label (same name → same color). */
export function hueFromPublisherLabel(label: string): number {
    let h = 2166136261
    for (let i = 0; i < label.length; i++) {
        h ^= label.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return Math.abs(h) % 360
}

/** First display character (skip leading brackets / spaces). */
export function initialFromPublisherLabel(label: string): string {
    const t = label.trim()
    if (!t) {
        return "?"
    }
    const chars = [...t]
    let i = 0
    while (
        i < chars.length &&
        /[（(【[﹝\s\u3000]/.test(chars[i])
    ) {
        i++
    }
    return chars[i] || "?"
}

type PublisherAvatarProps = {
    label: string
    avatarUrl?: string
}

/**
 * Circular avatar: remote image when valid; otherwise first character of label on colored disk.
 */
export const PublisherAvatar: React.FC<PublisherAvatarProps> = ({
    label,
    avatarUrl,
}) => {
    const [imgFailed, setImgFailed] = useState(false)
    useEffect(() => {
        setImgFailed(false)
    }, [avatarUrl, label])
    const onImgError = useCallback(() => {
        setImgFailed(true)
    }, [])
    const hue = hueFromPublisherLabel(label)
    const initial = initialFromPublisherLabel(label)
    const showImg = Boolean(avatarUrl && !imgFailed)

    return (
        <span className="publisher-rail-avatar-wrap">
            {showImg ? (
                <img
                    className="publisher-rail-avatar"
                    src={avatarUrl}
                    alt=""
                    onError={onImgError}
                />
            ) : (
                <span
                    className="publisher-rail-initial"
                    style={{
                        backgroundColor: `hsl(${hue}, 52%, 46%)`,
                    }}
                    aria-hidden>
                    {initial}
                </span>
            )}
        </span>
    )
}
