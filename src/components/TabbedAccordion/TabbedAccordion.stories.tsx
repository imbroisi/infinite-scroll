import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";

import TabbedAccordion from "./TabbedAccordion";
import type { TabConfig } from "./tabbedAccordion.types";

type StoryArgs = {
  /** Number of tabs (wrapper remounts when this changes). */
  tabCount: number;
  /** Synthetic rows per tab for scroll/sticky testing. */
  itemsPerTab: number;
  /** Max rows shown per tab; `0` means no cap (show all generated rows). */
  maxItems: number;
};

function buildTabs({
  tabCount,
  itemsPerTab,
  maxItems,
}: StoryArgs): TabConfig[] {
  const cap = maxItems > 0 ? maxItems : undefined;
  return Array.from({ length: tabCount }, (_, i) => ({
    label: `Tab ${i + 1}`,
    row: Array.from(
      { length: itemsPerTab },
      (_, j) => `Section ${i + 1} · Row ${j + 1}`,
    ),
    ...(cap != null ? { maxItems: cap } : {}),
  }));
}

function ScrollShell(args: StoryArgs) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabs = buildTabs(args);
  const remountKey = `${args.tabCount}-${args.itemsPerTab}-${args.maxItems}`;

  return (
    <div
      style={{
        boxSizing: "border-box",
        height: 700,
        width: "min(560px, calc(100vw - 48px))",
        padding: 12,
        border: "1px solid #f97316",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0b0b10",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowX: "hidden",
          overflowY: "auto",
          overflowAnchor: "none",
          isolation: "isolate",
          background: "#121218",
        }}
      >
        <TabbedAccordion
          key={remountKey}
          scrollContainerRef={scrollRef}
          tabs={tabs}
        />
      </div>
    </div>
  );
}

const meta: Meta<StoryArgs> = {
  title: "TabbedAccordion",
  parameters: {
    layout: "centered",
    backgrounds: { default: "app" },
    docs: {
      description: {
        component:
          "Scroll container matches the app shell: only the inner panel scrolls. Adjust tab count and row count to stress sticky headers and programmatic scroll.",
      },
    },
  },
  argTypes: {
    tabCount: {
      control: { type: "range", min: 1, max: 8, step: 1 },
    },
    itemsPerTab: {
      control: { type: "range", min: 5, max: 80, step: 5 },
    },
    maxItems: {
      control: { type: "number", min: 0 },
    },
  },
  args: {
    tabCount: 3,
    itemsPerTab: 25,
    maxItems: 0,
  },
  render: (args) => <ScrollShell {...args} />,
};

export default meta;

type Story = StoryObj<Meta<StoryArgs>>;

/** Change **tabCount**, **itemsPerTab**, and **maxItems** in Controls to validate sticky without running the full app. */
export const ControlledTabs: Story = {
  name: "Sticky scroll (controlled data)",
};
