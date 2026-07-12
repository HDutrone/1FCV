import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Heart, CirclePlus as PlusCircle, MessageCircle, User, House } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { isPublisher } from '@/lib/types';

function TabIcon({ icon, label, focused }: { icon: React.ReactNode; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconContainer}>
      {icon}
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', gap: 2, paddingTop: 4, width: 64 },
  label: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary, textAlign: 'center' },
  labelFocused: { color: Colors.primary, fontWeight: '700' },
});

export default function TabsLayout() {
  const { profile } = useAuth();
  const canPublish = profile ? isPublisher(profile.role) : false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={<House size={22} color={focused ? Colors.primary : Colors.textTertiary} strokeWidth={focused ? 2.5 : 2} />}
              label="Accueil"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={<Heart size={22} color={focused ? Colors.primary : Colors.textTertiary} strokeWidth={focused ? 2.5 : 2} />}
              label="Favoris"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          tabBarStyle: canPublish ? undefined : { display: 'none' },
          href: canPublish ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: canPublish ? Colors.primary : Colors.textTertiary,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: -18,
                  shadowColor: canPublish ? Colors.primary : '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
                }}>
                  <PlusCircle size={24} color={Colors.textInverse} strokeWidth={2} />
                </View>
              }
              label="Publier"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={<MessageCircle size={22} color={focused ? Colors.primary : Colors.textTertiary} strokeWidth={focused ? 2.5 : 2} />}
              label="Messages"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon={<User size={22} color={focused ? Colors.primary : Colors.textTertiary} strokeWidth={focused ? 2.5 : 2} />}
              label="Profil"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
