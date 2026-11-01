import { useMemo } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  /** `screen` membuka tab tertentu dari layar stack, mis. `navigate('Main', { screen: 'Payroll' })`. */
  Main: { screen?: keyof TabParamList } | undefined;
  Menu: undefined;
  HrdList: undefined;
  HrdForm: { userId?: string } | undefined;
  HrdDetail: { userId: string };
  HrdCompensation: { userId: string };
  EmployeeList: undefined;
  EmployeeForm: { userId?: string } | undefined;
  EmployeeDetail: { userId: string };
  RoleList: undefined;
  RoleForm: { roleId?: string } | undefined;
  LocationList: undefined;
  LocationForm: { locationId?: string } | undefined;
  LeaveAllocation: undefined;
  LeaveAllocationDetail: { userId: string };
  AttendanceMonitoring: undefined;
  AttendanceHistory: undefined;
  SubmissionCreate: undefined;
  SubmissionDetail: { submissionId: string };
  PayrollDetail: { userId: string; period: string };
  CompanySettings: undefined;
  EditProfile: undefined;
  PrintPreview: { submissionId: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Submissions: undefined;
  Approvals: undefined;
  Payroll: undefined;
  Profile: undefined;
  Monitoring: undefined;
};

export type AppParamList = RootStackParamList & TabParamList;

export type AppNavigation = NativeStackNavigationProp<AppParamList>;

const TAB_ROUTES: (keyof TabParamList)[] = [
  'Dashboard',
  'Attendance',
  'Submissions',
  'Approvals',
  'Payroll',
  'Profile',
  'Monitoring',
];

/**
 * Navigasi aplikasi dengan pengalihan otomatis ke tab.
 *
 * Layar yang dipasang pada root stack (mis. detail karyawan, menu, monitoring)
 * perlu membuka layar tab (mis. Payroll, Approvals). Karena tab berada di dalam
 * route `Main`, `navigate('Payroll')` dari root stack tidak akan ditemukan.
 * Hook ini mengarahkannya menjadi `navigate('Main', { screen: 'Payroll' })`.
 */
export function useAppNavigation() {
  const navigation = useNavigation<AppNavigation>();

  return useMemo(() => {
    const navigate = (name: string, params?: object) => {
      const routeNames: string[] = navigation.getState()?.routeNames ?? [];
      const isNestedTab =
        TAB_ROUTES.includes(name as keyof TabParamList) && !routeNames.includes(name);
      const dispatchNavigate = navigation.navigate as unknown as (
        target: string,
        targetParams?: object,
      ) => void;

      if (isNestedTab) {
        dispatchNavigate('Main', { screen: name });
        return;
      }
      dispatchNavigate(name, params);
    };

    return { ...navigation, navigate } as unknown as AppNavigation;
  }, [navigation]);
}
