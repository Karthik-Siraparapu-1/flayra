import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatListScreen from '../screens/Main/ChatListScreen';
import ChatRoomScreen from '../screens/Main/ChatRoomScreen';

const Stack = createNativeStackNavigator();

export default function ChatStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
