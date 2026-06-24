import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { useState } from "react"
import { NumberInput } from "./NumberInput"

type WrapperProps = {
  defaultValue: string
  usdValue?: number | null
  onMax?: () => void
}

function Wrapper({ defaultValue, usdValue, onMax }: WrapperProps) {
  const [value, setValue] = useState(defaultValue)
  return (
    <NumberInput
      value={value}
      onValueChange={setValue}
      usdValue={usdValue}
      onMax={onMax}
    />
  )
}

describe("NumberInput", () => {
  it("renders current value and USD equivalent", () => {
    render(<NumberInput value="1.23" onValueChange={vi.fn()} usdValue={12.3} />)

    expect(screen.getByRole("textbox")).toHaveValue("1.23")
    expect(screen.getByText("$12.30")).toBeInTheDocument()
  })

  describe("accessibility", () => {
    it("exposes a textbox role for the decimal input", () => {
      render(<NumberInput value="" onValueChange={vi.fn()} aria-label="Amount" />)

      const input = screen.getByRole("textbox", { name: "Amount" })
      expect(input).toHaveAttribute("inputMode", "decimal")
      expect(input).toHaveAttribute("pattern", "[0-9]*([.][0-9]*)?")
    })

    it("reflects the disabled state on the textbox", () => {
      render(<NumberInput value="5" onValueChange={vi.fn()} disabled aria-label="Amount" />)

      expect(screen.getByRole("textbox", { name: "Amount" })).toBeDisabled()
    })

    it("does not render a MAX button when no handler is provided", () => {
      render(<NumberInput value="" onValueChange={vi.fn()} />)

      expect(screen.queryByRole("button", { name: "MAX" })).not.toBeInTheDocument()
    })

    it("renders a MAX button when a handler is provided", () => {
      render(<NumberInput value="" onValueChange={vi.fn()} onMax={vi.fn()} />)

      expect(screen.getByRole("button", { name: "MAX" })).toBeEnabled()
    })

    it("uses a custom MAX button label when provided", () => {
      render(
        <NumberInput
          value=""
          onValueChange={vi.fn()}
          onMax={vi.fn()}
          maxButtonLabel="Use all"
        />,
      )

      expect(screen.getByRole("button", { name: "Use all" })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "MAX" })).not.toBeInTheDocument()
    })
  })

  describe("keyboard editing", () => {
    it("calls onValueChange for valid decimal input and ignores invalid characters", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="" />)

      const input = screen.getByRole("textbox")
      await user.type(input, "12.34")

      expect(input).toHaveValue("12.34")
      await user.type(input, "a")
      expect(input).toHaveValue("12.34")
    })

    it("supports backspace editing", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="12.34" />)

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.keyboard("{Backspace}")

      expect(input).toHaveValue("12.3")
    })

    it("replaces the current value when the user selects all and types", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="9.99" />)

      const input = screen.getByRole("textbox")
      await user.tripleClick(input)
      await user.keyboard("4.2")

      expect(input).toHaveValue("4.2")
    })

    it("does not update the value when keyboard input is invalid", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="1" />)

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.keyboard("e")

      expect(input).toHaveValue("1")
    })
  })

  describe("paste behavior", () => {
    it("accepts valid decimal paste values", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="" />)

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.paste("42.5")

      expect(input).toHaveValue("42.5")
    })

    it("rejects pasted values with invalid characters", async () => {
      const user = userEvent.setup()
      render(<Wrapper defaultValue="3.14" />)

      const input = screen.getByRole("textbox")
      await user.click(input)
      await user.paste("12abc.34")

      expect(input).toHaveValue("3.14")
    })
  })

  it("fires the max button when provided", async () => {
    const user = userEvent.setup()
    const onMax = vi.fn()
    render(<NumberInput value="" onValueChange={vi.fn()} onMax={onMax} />)

    await user.click(screen.getByRole("button", { name: "MAX" }))
    expect(onMax).toHaveBeenCalledTimes(1)
  })
})
