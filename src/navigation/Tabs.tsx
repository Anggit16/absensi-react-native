import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ClipboardList,
  Fingerprint,
  Home,
  ListChecks,
  ScanFace,
  User,
  Wallet,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';
import { useSessionUser } from '../store/AppProvider';
import { EmployeeDashboardScreen } from '../screens/employee/EmployeeDashboardScreen';
import { AttendanceScreen } from '../screens/employee/AttendanceScreen';
import { SubmissionListScreen } from '../screens/employee/SubmissionListScreen';
import { OwnerDashboardScreen } from '../screens/owner/OwnerDashboardScreen';
import { HrdDashboardScreen } from '../screens/hrd/HrdDashboardScreen';
import { ApprovalInboxScreen } from '../screens/shared/ApprovalInboxScreen';
import { PayrollScreen } from '../screens/shared/PayrollScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { AttendanceMonitoringScreen } from '../screens/hrd/AttendanceMonitoringScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const baseOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' as const },
  tabBarItemStyle: { paddingVertical: 2 },
  tabBarHideOnKeyboard: true,
};

function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: typeof Home;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={19} color={focused ? colors.primary : color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export function OwnerTabs() {
  return (
    <Tab.Navigator screenOptions={baseOptions}>
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Home} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalInboxScreen}
        options={{
          title: 'Persetujuan',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ListChecks} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{
          title: 'Payroll',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Wallet} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={User} focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function HrdTabs() {
  return (
    <Tab.Navigator screenOptions={baseOptions}>
      <Tab.Screen
        name="Dashboard"
        component={HrdDashboardScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Home} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Monitoring"
        component={AttendanceMonitoringScreen}
        options={{
          title: 'Absensi',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ScanFace} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Approvals"
        component={ApprovalInboxScreen}
        options={{
          title: 'Persetujuan',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ListChecks} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{
          title: 'Payroll',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Wallet} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={User} focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function EmployeeTabs() {
  return (
    <Tab.Navigator screenOptions={baseOptions}>
      <Tab.Screen
        name="Dashboard"
        component={EmployeeDashboardScreen}
        options={{
          title: 'Beranda',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Home} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Absensi',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={Fingerprint} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Submissions"
        component={SubmissionListScreen}
        options={{
          title: 'Pengajuan',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon icon={ClipboardList} focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{
          title: 'Payroll',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Wallet} focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={User} focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RoleTabs() {
  const user = useSessionUser();
  if (user.role === 'OWNER') return <OwnerTabs />;
  if (user.role === 'HRD') return <HrdTabs />;
  return <EmployeeTabs />;
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 34,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.accentSoft },
});
