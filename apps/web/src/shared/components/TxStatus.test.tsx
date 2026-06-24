import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TxStatus } from "./TxStatus"

vi.mock("@/app/config/network", () => ({
  explorerTxUrl: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
}))

const TX_HASH = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"

describe("TxStatus", () => {
  it("renders the pending state with a visible status label", () => {
    render(<TxStatus state={{ status: "pending" }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Waiting for confirmation…")
    expect(screen.getByText("Waiting for confirmation…")).toBeVisible()
  })

  it("renders the success state with hash and explorer link", () => {
    render(<TxStatus state={{ status: "success", hash: TX_HASH }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Transaction confirmed")
    expect(screen.getByText("Transaction confirmed")).toBeVisible()
    expect(screen.getByText(TX_HASH)).toBeVisible()

    const explorerLink = screen.getByRole("link", { name: "View on Stellar Expert →" })
    expect(explorerLink).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`,
    )
    expect(explorerLink).toHaveAttribute("target", "_blank")
    expect(explorerLink).toHaveAttribute("rel", "noreferrer")
  })

  it("renders success without hash details when the transaction hash is missing", () => {
    render(<TxStatus state={{ status: "success" }} />)

    expect(screen.getByText("Transaction confirmed")).toBeVisible()
    expect(screen.queryByRole("link", { name: "View on Stellar Expert →" })).not.toBeInTheDocument()
  })

  it("renders success without hash details when the transaction hash is blank", () => {
    render(<TxStatus state={{ status: "success", hash: "   " }} />)

    expect(screen.getByText("Transaction confirmed")).toBeVisible()
    expect(screen.queryByRole("link", { name: "View on Stellar Expert →" })).not.toBeInTheDocument()
  })

  it("renders the failed state with a parsed contract error message", () => {
    render(<TxStatus state={{ status: "failed", error: "INSUFFICIENT_COLLATERAL" }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-live", "polite")
    expect(status).toHaveTextContent("Insufficient collateral for this position.")
    expect(screen.getByText("Insufficient collateral for this position.")).toBeVisible()
    expect(status).toHaveClass("text-destructive")
  })

  it("renders the failed state with a wallet rejection message", () => {
    render(<TxStatus state={{ status: "failed", error: new Error("user declined") }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("Transaction was rejected in your wallet.")
    expect(screen.getByText("Transaction was rejected in your wallet.")).toBeVisible()
  })

  it("renders the failed state with a fallback message for unknown errors", () => {
    render(<TxStatus state={{ status: "failed", error: "something unexpected" }} />)

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("Transaction failed. Please try again.")
    expect(screen.getByText("Transaction failed. Please try again.")).toBeVisible()
  })
})
