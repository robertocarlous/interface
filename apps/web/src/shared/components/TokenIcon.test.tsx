import "@testing-library/jest-dom"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TokenIcon, normalizeTokenSymbol } from "./TokenIcon"

const CDN_BASE = "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color"

// Mirrors FAUCET_TOKENS / TOKENS after the T-prefix strip used in faucet and trade UIs.
const FAUCET_DISPLAY_SYMBOLS = ["USDC", "WBTC", "ETH", "XLM"] as const
const TRADING_DISPLAY_SYMBOLS = ["USDC", "WBTC", "ETH", "XLM"] as const
const UNPREFIXED_TEST_SYMBOLS = ["TWBTC", "TETH", "TXLM", "TUSDC"] as const

function cdnSrcForSymbol(symbol: string) {
  return `${CDN_BASE}/${normalizeTokenSymbol(symbol).toLowerCase()}.svg`
}

describe("normalizeTokenSymbol", () => {
  it("maps test-prefixed and wrapped symbols to CDN keys", () => {
    expect(normalizeTokenSymbol("TWBTC")).toBe("BTC")
    expect(normalizeTokenSymbol("twbtc")).toBe("BTC")
    expect(normalizeTokenSymbol("WBTC")).toBe("BTC")
    expect(normalizeTokenSymbol("TUSDC")).toBe("USDC")
    expect(normalizeTokenSymbol("txlm")).toBe("XLM")
  })

  it("leaves unknown symbols uppercased without aliasing", () => {
    expect(normalizeTokenSymbol("glv")).toBe("GLV")
    expect(normalizeTokenSymbol("UNKNOWN")).toBe("UNKNOWN")
  })
})

describe("TokenIcon", () => {
  describe("known faucet and trading symbols", () => {
    it.each(FAUCET_DISPLAY_SYMBOLS)("renders CDN image for faucet display symbol %s", (displaySymbol) => {
      render(<TokenIcon symbol={displaySymbol} />)

      const icon = screen.getByRole("img", { name: `${displaySymbol} token icon` })
      expect(icon).toBeInTheDocument()

      const img = screen.getByAltText(`${displaySymbol} icon`)
      expect(img).toHaveAttribute("src", cdnSrcForSymbol(displaySymbol))
    })

    it.each(TRADING_DISPLAY_SYMBOLS)("renders CDN image for trading display symbol %s", (displaySymbol) => {
      render(<TokenIcon symbol={displaySymbol} />)

      expect(screen.getByRole("img", { name: `${displaySymbol} token icon` })).toBeInTheDocument()
      expect(screen.getByAltText(`${displaySymbol} icon`)).toHaveAttribute(
        "src",
        cdnSrcForSymbol(displaySymbol),
      )
    })

    it.each(UNPREFIXED_TEST_SYMBOLS)("renders CDN image when passed unprefixed test symbol %s", (symbol) => {
      render(<TokenIcon symbol={symbol} />)

      expect(screen.getByRole("img", { name: `${symbol} token icon` })).toBeInTheDocument()
      expect(screen.getByAltText(`${symbol} icon`)).toHaveAttribute("src", cdnSrcForSymbol(symbol))
    })
  })

  describe("unknown and lowercase symbols", () => {
    it("shows stable initials for unknown symbols", () => {
      const { rerender } = render(<TokenIcon symbol="UNKNOWN" />)

      expect(screen.getByRole("img", { name: "UNKNOWN token icon" })).toHaveTextContent("UN")
      expect(screen.queryByAltText(/icon$/)).not.toBeInTheDocument()

      rerender(<TokenIcon symbol="UNKNOWN" />)
      expect(screen.getByRole("img", { name: "UNKNOWN token icon" })).toHaveTextContent("UN")
    })

    it("normalizes lowercase symbols to the same CDN image as uppercase", () => {
      render(<TokenIcon symbol="eth" />)

      expect(screen.getByRole("img", { name: "eth token icon" })).toBeInTheDocument()
      expect(screen.getByAltText("eth icon")).toHaveAttribute("src", `${CDN_BASE}/eth.svg`)
    })

    it("shows stable initials for lowercase unknown symbols", () => {
      render(<TokenIcon symbol="abc" />)

      const icon = screen.getByRole("img", { name: "abc token icon" })
      expect(icon).toHaveTextContent("AB")
      expect(icon).toHaveClass("bg-muted/60", "text-muted-foreground", "ring-border")
    })

    it("uses themed placeholder colors for known non-CDN symbols", () => {
      render(<TokenIcon symbol="GLV" />)

      const icon = screen.getByRole("img", { name: "GLV token icon" })
      expect(icon).toHaveTextContent("GL")
      expect(icon).toHaveClass("bg-teal-500/15", "text-teal-400", "ring-teal-500/25")
    })
  })

  describe("accessible image and text behavior", () => {
    it("exposes an accessible label on the icon container", () => {
      render(<TokenIcon symbol="USDC" />)
      expect(screen.getByRole("img", { name: "USDC token icon" })).toBeInTheDocument()
    })

    it("falls back to initials with accessible labeling when the CDN image fails", () => {
      render(<TokenIcon symbol="BTC" />)

      const img = screen.getByAltText("BTC icon")
      fireEvent.error(img)

      const icon = screen.getByRole("img", { name: "BTC token icon" })
      expect(screen.queryByAltText("BTC icon")).not.toBeInTheDocument()
      expect(icon).toHaveTextContent("BT")
    })
  })
})
