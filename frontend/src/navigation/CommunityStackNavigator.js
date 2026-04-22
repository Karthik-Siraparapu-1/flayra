import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityListScreen from '../screens/Main/CommunityListScreen';
import CommunityDetailScreen from '../screens/Main/CommunityDetailScreen';
import CreateCommunityScreen from '../screens/Main/CreateCommunityScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityList" component={CommunityListScreen} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
    </Stack.Navigator>
  );
}
