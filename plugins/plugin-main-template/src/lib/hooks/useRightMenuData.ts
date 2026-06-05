import { pluginLoader, ExtensionContribution, RightMenuItemProps } from '@temp-workspace/plugin-loader';

export interface RightMenuTab {
  label: string;
  icon?: string;
  contribution: ExtensionContribution<'main-template:right-menu'>;
}

export const useRightMenuData = () => {
  const contributions = pluginLoader.getExtensions('main-template:right-menu');

  if (contributions.length === 0) {
    return { tabs: [], triggerIcon: '📋' };
  }

  const tabs: RightMenuTab[] = contributions.map((c) => {
    const props = c.metadata as RightMenuItemProps | undefined;
    return {
      label: props?.tabName ?? 'Tab',
      icon: props?.tabIcon,
      contribution: c,
    };
  });

  const triggerIcon =
    (contributions[0]?.metadata as RightMenuItemProps | undefined)?.tabIcon ??
    '📋';

  return { tabs, triggerIcon };
};
