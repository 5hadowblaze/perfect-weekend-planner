import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ProfileOnboarding from "../ProfileOnboarding";

describe("ProfileOnboarding", () => {
  it("shows validation error when home city is empty", async () => {
    const user = userEvent.setup();
    render(<ProfileOnboarding onComplete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /start exploring/i }));

    expect(screen.getByText("Home city is required.")).toBeInTheDocument();
  });

  it("shows validation error for invalid budget", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProfileOnboarding onComplete={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("Austin, TX"),
      "Austin, TX",
    );
    await user.clear(screen.getByPlaceholderText("150"));
    await user.type(screen.getByPlaceholderText("150"), "0");
    await user.type(
      screen.getByPlaceholderText("Vegan, nut-free, halal…"),
      "vegan",
    );
    await user.click(screen.getByRole("button", { name: "Live music" }));

    fireEvent.submit(container.querySelector("form")!);

    expect(screen.getByText("Enter a valid weekend budget.")).toBeInTheDocument();
  });

  it("shows validation error when diet is missing", async () => {
    const user = userEvent.setup();
    render(<ProfileOnboarding onComplete={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("Austin, TX"),
      "Austin, TX",
    );
    await user.click(screen.getByRole("button", { name: "Outdoors" }));
    await user.click(screen.getByRole("button", { name: /start exploring/i }));

    expect(
      screen.getByText("Diet preferences help us filter restaurants."),
    ).toBeInTheDocument();
  });

  it("shows validation error when no activities are selected", async () => {
    const user = userEvent.setup();
    render(<ProfileOnboarding onComplete={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText("Austin, TX"),
      "Austin, TX",
    );
    await user.type(
      screen.getByPlaceholderText("Vegan, nut-free, halal…"),
      "vegan",
    );
    await user.click(screen.getByRole("button", { name: /start exploring/i }));

    expect(
      screen.getByText("Pick at least one activity interest."),
    ).toBeInTheDocument();
  });

  it("calls onComplete with a valid profile on successful submit", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileOnboarding onComplete={onComplete} />);

    await user.type(
      screen.getByPlaceholderText("Austin, TX"),
      "Austin, TX",
    );
    await user.clear(screen.getByPlaceholderText("150"));
    await user.type(screen.getByPlaceholderText("150"), "200");
    await user.type(
      screen.getByPlaceholderText("Vegan, nut-free, halal…"),
      "vegan",
    );
    await user.click(screen.getByRole("button", { name: "Live music" }));
    await user.type(
      screen.getByPlaceholderText("Wheelchair accessible venues…"),
      "wheelchair access",
    );
    await user.click(screen.getByRole("button", { name: /start exploring/i }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        homeCity: "Austin, TX",
        budget: 200,
        diet: "vegan",
        activities: "Live music",
        accessibility: "wheelchair access",
        onboardingComplete: true,
      }),
    );
  });

  it("pre-fills fields from initial profile", () => {
    render(
      <ProfileOnboarding
        onComplete={vi.fn()}
        initial={{
          homeCity: "Portland, OR",
          budget: 120,
          diet: "vegetarian",
          activities: "Markets",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Portland, OR")).toBeInTheDocument();
    expect(screen.getByDisplayValue("120")).toBeInTheDocument();
    expect(screen.getByDisplayValue("vegetarian")).toBeInTheDocument();
  });
});
