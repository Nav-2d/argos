import {
  Tab as AriakitTab,
  TabList,
  TabPanel,
  TabProps,
  useTabState,
} from "ariakit/tab";
import { forwardRef, memo } from "react";

import { checkIsBuildEmpty } from "@/containers/Build";
import { FragmentType, graphql, useFragment } from "@/gql";
import { HotkeyTooltip } from "@/ui/HotkeyTooltip";

import { BuildDiffList } from "./BuildDiffList";
import { useBuildHotkey } from "./BuildHotkeys";
import { BuildInfos } from "./BuildInfos";

const Tab = forwardRef<HTMLButtonElement, TabProps>((props, ref) => {
  return (
    <AriakitTab
      ref={ref}
      className="cursor-default px-2 text-sm font-medium leading-10 text-low transition hover:text aria-selected:text"
      {...props}
    />
  );
});

export const BuildFragment = graphql(`
  fragment BuildSidebar_Build on Build {
    ...BuildInfos_Build
    stats {
      total
    }
  }
`);

export const BuildSidebar = memo(
  (props: {
    githubRepoUrl: string | null;
    build: FragmentType<typeof BuildFragment>;
  }) => {
    const build = useFragment(BuildFragment, props.build);
    const tab = useTabState({
      defaultSelectedId:
        build && checkIsBuildEmpty(build) ? "info" : "screenshots",
    });
    const hotkey = useBuildHotkey(
      "toggleSidebarPanel",
      () => {
        tab.setSelectedId(tab.next());
      },
      { preventDefault: true },
    );
    return (
      <div className="group/sidebar flex w-[295px] shrink-0 flex-col border-r">
        <TabList
          state={tab}
          aria-label="Build details"
          className="flex shrink-0 border-b px-2"
        >
          <HotkeyTooltip
            keys={hotkey.displayKeys}
            description="Screenshots"
            keysEnabled={tab.selectedId !== "screenshots"}
          >
            <Tab id="screenshots" state={tab}>
              Screenshots
            </Tab>
          </HotkeyTooltip>
          <HotkeyTooltip
            keys={hotkey.displayKeys}
            description="Info"
            keysEnabled={tab.selectedId !== "info"}
          >
            <Tab id="info" state={tab}>
              Info
            </Tab>
          </HotkeyTooltip>
        </TabList>

        <TabPanel
          state={tab}
          tabId="screenshots"
          focusable={false}
          className="flex min-h-0 flex-1 flex-col"
        >
          <BuildDiffList />
        </TabPanel>

        <TabPanel
          state={tab}
          tabId="info"
          className="flex-1 p-4"
          focusable={false}
        >
          <BuildInfos build={build} githubRepoUrl={props.githubRepoUrl} />
        </TabPanel>
      </div>
    );
  },
);
