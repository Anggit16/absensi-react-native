import {
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../store/AppProvider';
import { RoleTabs } from './Tabs';
import type { RootStackParamList } from './types';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { MenuScreen } from '../screens/shared/MenuScreen';
import { CompanySettingsScreen } from '../screens/shared/CompanySettingsScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { PayrollDetailScreen } from '../screens/shared/PayrollDetailScreen';
import { PrintPreviewScreen } from '../screens/shared/PrintPreviewScreen';
import { SubmissionDetailScreen } from '../screens/shared/SubmissionDetailScreen';
import { AttendanceHistoryScreen } from '../screens/employee/AttendanceHistoryScreen';
import { SubmissionCreateScreen } from '../screens/employee/SubmissionCreateScreen';
import { AttendanceMonitoringScreen } from '../screens/hrd/AttendanceMonitoringScreen';
import { EmployeeDetailScreen } from '../screens/hrd/EmployeeDetailScreen';
import { EmployeeFormScreen } from '../screens/hrd/EmployeeFormScreen';
import { EmployeeListScreen } from '../screens/hrd/EmployeeListScreen';
import { LeaveAllocationDetailScreen } from '../screens/hrd/LeaveAllocationDetailScreen';
import { LeaveAllocationScreen } from '../screens/hrd/LeaveAllocationScreen';
import { LocationFormScreen } from '../screens/hrd/LocationFormScreen';
import { LocationListScreen } from '../screens/hrd/LocationListScreen';
import { RoleFormScreen } from '../screens/hrd/RoleFormScreen';
import { RoleListScreen } from '../screens/hrd/RoleListScreen';
import { HrdCompensationScreen } from '../screens/owner/HrdCompensationScreen';
import { HrdDetailScreen } from '../screens/owner/HrdDetailScreen';
import { HrdFormScreen } from '../screens/owner/HrdFormScreen';
import { HrdListScreen } from '../screens/owner/HrdListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: NavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

function AttendanceMonitoringStackScreen() {
  return <AttendanceMonitoringScreen showBack />;
}

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right' as const,
};

export function RootNavigator() {
  const { sessionUser, isRestoring } = useApp();

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        {!sessionUser ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={RoleTabs} />
            <Stack.Screen name="Menu" component={MenuScreen} />

            <Stack.Screen name="HrdList" component={HrdListScreen} />
            <Stack.Screen name="HrdForm" component={HrdFormScreen} />
            <Stack.Screen name="HrdDetail" component={HrdDetailScreen} />
            <Stack.Screen name="HrdCompensation" component={HrdCompensationScreen} />

            <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
            <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
            <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />

            <Stack.Screen name="RoleList" component={RoleListScreen} />
            <Stack.Screen name="RoleForm" component={RoleFormScreen} />
            <Stack.Screen name="LocationList" component={LocationListScreen} />
            <Stack.Screen name="LocationForm" component={LocationFormScreen} />

            <Stack.Screen name="LeaveAllocation" component={LeaveAllocationScreen} />
            <Stack.Screen
              name="LeaveAllocationDetail"
              component={LeaveAllocationDetailScreen}
            />

            <Stack.Screen
              name="AttendanceMonitoring"
              component={AttendanceMonitoringStackScreen}
            />
            <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />

            <Stack.Screen name="SubmissionCreate" component={SubmissionCreateScreen} />
            <Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen} />

            <Stack.Screen name="PayrollDetail" component={PayrollDetailScreen} />
            <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrintPreview" component={PrintPreviewScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
