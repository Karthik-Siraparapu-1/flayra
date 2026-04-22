import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { COLORS, SHADOWS } from '../theme/designSystem';

import DiscoverScreen from '../screens/Main/DiscoverScreen';
import MapScreen from '../screens/Main/MapScreen';
import ChatStackNavigator from './ChatStackNavigator';
import ProfileScreen from '../screens/Main/ProfileScreen';
import ReelsScreen from '../screens/Main/ReelsScreen';
import RankingsScreen from '../screens/Main/RankingsScreen';
import ReelsUploadScreen from '../screens/Main/ReelsUploadScreen';
import RandomCallScreen from '../screens/Main/RandomCallScreen';
import CommunityStackNavigator from './CommunityStackNavigator';
import { SIZES } from '../theme/designSystem';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Reels') iconName = focused ? 'play-circle' : 'play-circle-outline';
          else if (route.name === 'Discover') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Chats') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Rankings') iconName = focused ? 'trophy' : 'trophy-outline';

          return <Icon name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarShowLabel: false,
        tabBarStyle: { 
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          height: 65,
          borderRadius: SIZES.radiusLarge,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.95)',
          borderTopWidth: 0,
          ...SHADOWS.medium,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={{ flex: 1, borderRadius: 25, overflow: 'hidden' }} />
          ) : null
        ),
        headerShown: false
      })}
    >
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Chats" component={ChatStackNavigator} />
      <Tab.Screen name="Rankings" component={RankingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainTabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          presentation: 'transparentModal',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="ReelsUpload" 
        component={ReelsUploadScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="RandomCall" 
        component={RandomCallScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
