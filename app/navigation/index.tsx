import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import NewPostScreen from '../screens/post/NewPostScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ModerationScreen from '../screens/admin/ModerationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ headerShown: true, title: 'Post' }}
          />
          <Stack.Screen
            name="NewPost"
            component={NewPostScreen}
            options={{ headerShown: true, title: 'Novo post' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Configurações' }}
          />
          <Stack.Screen
            name="Admin"
            component={DashboardScreen}
            options={{ headerShown: true, title: 'Painel admin' }}
          />
          <Stack.Screen
            name="Moderation"
            component={ModerationScreen}
            options={{ headerShown: true, title: 'Moderação' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
