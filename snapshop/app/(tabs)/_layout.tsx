import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../constants/theme';
import { StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : Colors.white,
          borderTopWidth: 1,
          borderTopColor: isDark ? colors.border : Colors.border,
          height: Platform.OS === 'ios' ? 85 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: isDark ? colors.accent : Colors.primary,
        tabBarInactiveTintColor: isDark ? colors.gray : Colors.gray,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'bag' : 'bag-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
