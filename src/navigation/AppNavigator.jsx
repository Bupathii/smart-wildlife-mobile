import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors } from '../theme/glass';

const Stack = createNativeStackNavigator();

const placeholderScreens = [
  'RangerDashboard',
  'AssignedPatrols',
  'PatrolDetails',
  'ActivePatrol',
  'MarkWaypoint',
  'EndPatrolSummary',
  'ReportIncident',
  'IncidentConfirmation',
  'AnimalTracking',
  'AnimalDetails',
  'Alerts',
  'AlertDetails',
  'Profile',
  'SyncStatus',
];

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: colors.gradient[1] },
          headerTintColor: colors.white,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        {placeholderScreens.map((name) => (
          <Stack.Screen key={name} name={name} component={PlaceholderScreen} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
