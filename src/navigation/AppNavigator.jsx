import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

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
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        {placeholderScreens.map((name) => (
          <Stack.Screen key={name} name={name} component={PlaceholderScreen} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
