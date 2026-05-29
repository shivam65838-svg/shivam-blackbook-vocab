import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const tabIcons = {
  home: require('../assets/images/tabIcons/home.png'),
  vocabulary: require('../assets/images/tabIcons/explore.png'),
  quiz: require('../assets/images/tabIcons/explore.png'),
  revision: require('../assets/images/tabIcons/explore.png'),
  settings: require('../assets/images/tabIcons/explore.png'),
};

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.accent}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcons.home} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vocabulary">
        <NativeTabs.Trigger.Label>Vocabulary</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcons.vocabulary} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quiz">
        <NativeTabs.Trigger.Label>Quiz</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcons.quiz} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="revision">
        <NativeTabs.Trigger.Label>Revision</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcons.revision} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcons.settings} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
