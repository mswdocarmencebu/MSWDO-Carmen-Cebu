import React, { useState, useEffect, useRef } from "react"
import { resolveAvatarUrl } from "@/services/avatarService"

/**
 * Universal UserAvatar component.
 * Displays profile photo if one exists (from Supabase Storage or profile metadata);
 * falls back cleanly to the initials circle if no photo is available or if the image fails to load.
 *
 * Re-renders ONLY when:
 *   - props change (user/avatarUrl/name/email)
 *   - a "mswdo_avatar_updated" event fires (i.e. a photo was just uploaded)
 * Does NOT listen to raw "storage" events to avoid infinite refresh loops.
 */
export function UserAvatar({
  user,
  avatarUrl: explicitAvatarUrl,
  initials = "?",
  name = "",
  email = "",
  size = "size-8",
  className = "",
  fallbackClassName = "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300",
}) {
  const [imgError, setImgError]     = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState(() =>
    explicitAvatarUrl || resolveAvatarUrl(user || { name, email })
  )

  // Keep a stable ref to avoid stale closures in event listener
  const propsRef = useRef({ user, explicitAvatarUrl, name, email })
  propsRef.current = { user, explicitAvatarUrl, name, email }

  // Re-resolve when props change
  useEffect(() => {
    const url = explicitAvatarUrl || resolveAvatarUrl(user || { name, email })
    setImgError(false)
    setResolvedUrl(url)
  }, [user, explicitAvatarUrl, name, email])

  // Re-resolve ONLY on mswdo_avatar_updated (fired by registerUserAvatar after an upload)
  // NOT on "storage" — that fires on every localStorage write and causes loops
  useEffect(() => {
    const handleAvatarUpdate = () => {
      const { user: u, explicitAvatarUrl: eu, name: n, email: em } = propsRef.current
      const url = eu || resolveAvatarUrl(u || { name: n, email: em })
      setImgError(false)
      setResolvedUrl(url)
    }
    window.addEventListener("mswdo_avatar_updated", handleAvatarUpdate)
    return () => window.removeEventListener("mswdo_avatar_updated", handleAvatarUpdate)
  }, []) // empty deps — listener is stable, reads from ref

  const showImage = Boolean(resolvedUrl) && !imgError

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase overflow-hidden border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs select-none ${
        showImage ? "bg-zinc-100 dark:bg-zinc-800" : fallbackClassName
      } ${className}`}
    >
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={name || "Profile"}
          className="size-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export default UserAvatar
