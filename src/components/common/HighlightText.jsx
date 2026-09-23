import React from "react"

/**
 * Escapes regex special characters safely
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Reusable text highlighting component.
 * Highlights matching tokens within `text` using styled `<mark>` elements.
 *
 * @param {string|number} text - The raw text to display
 * @param {string} highlight - The query or phrase to highlight
 * @param {string} className - Optional custom class name for the <mark> tag
 */
export function HighlightText({ text, highlight, className = "" }) {
  if (text === undefined || text === null) return null
  const strText = String(text)

  if (!highlight || typeof highlight !== "string" || !highlight.trim()) {
    return <>{strText}</>
  }

  // Extract individual keywords/tokens, ignoring whitespace
  const tokens = highlight
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp)

  if (tokens.length === 0) {
    return <>{strText}</>
  }

  try {
    const regex = new RegExp(`(${tokens.join("|")})`, "gi")
    const parts = strText.split(regex)

    return (
      <>
        {parts.map((part, i) => {
          const isMatch = tokens.some(
            (token) => part.toLowerCase() === token.toLowerCase()
          )

          if (isMatch) {
            return (
              <mark
                key={i}
                className={`bg-amber-200/90 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 font-semibold px-0.5 rounded-[2px] shadow-2xs ${className}`}
              >
                {part}
              </mark>
            )
          }
          return <React.Fragment key={i}>{part}</React.Fragment>
        })}
      </>
    )
  } catch (err) {
    console.warn("HighlightText regex error:", err)
    return <>{strText}</>
  }
}

export default HighlightText
