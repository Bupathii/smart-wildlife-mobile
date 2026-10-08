import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';
import IncidentConfirmationScreen from '../screens/IncidentConfirmationScreen';
import MyIncidentReportsScreen from '../screens/MyIncidentReportsScreen';
import { colors } from '../theme/glass';

const Stack = createNativeStackNavigator();

const placeholderScreens = [
  'RangerDashboard',
  'AssignedPatrols',
  'PatrolDetails',
  'ActivePatrol',
  'MarkWaypoint',
  'EndPatrolSummary',
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
        <Stack.Screen
          name="ReportIncident"
          component={ReportIncidentScreen}
          options={{ title: 'Report Incident' }}
        />
        <Stack.Screen
          name="IncidentConfirmation"
          component={IncidentConfirmationScreen}
          options={{ title: 'Report Status', headerBackVisible: false }}
        />
        <Stack.Screen
          name="MyIncidentReports"
          component={MyIncidentReportsScreen}
          options={{ title: 'My Reports' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
