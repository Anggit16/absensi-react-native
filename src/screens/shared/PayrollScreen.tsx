import { ChevronLeft, ChevronRight, Coins, Info, Percent, Wallet } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InfoNote } from '../../components/common/Feedback';
import { ScreenHeader, IconButton } from '../../components/common/Header';
import { BottomSheet } from '../../components/common/Modal';
import { Screen } from '../../components/common/Screen';
import { SearchField } from '../../components/common/SearchField';
import { SegmentedTabs } from '../../components/common/SegmentedTabs';
import { SectionHeader } from '../../components/common/Section';
import { StatCard } from '../../components/common/StatCard';
import { DEMO_PAYROLL_RULES, ROLE_LABEL } from '../../constants';
import { useApp, useSessionUser } from '../../store/AppProvider';
import { colors, radius, spacing } from '../../theme';
import type { PayrollRow } from '../../types';
import { currentPeriod, formatPeriod, formatPeriodRange, shiftPeriod } from '../../utils/date';
import { formatCurrency } from '../../utils/format';
import { computeHrdPayrollRow, computePayrollRow, summarizePayroll } from '../../utils/payroll';
import { useAppNavigation } from '../../navigation/types';

export function PayrollScreen({ showBack = false }: { showBack?: boolean }) {
  const user = useSessionUser();
  const navigation = useAppNavigation();
  const { users, company, attendances, submissions, getRoleForUser, getCompensation, getRole, getLocationForUser } =
    useApp();

  const [period, setPeriod] = useState(currentPeriod());
  const [filter, setFilter] = useState<'ALL' | 'EMPLOYEE' | 'HRD'>('ALL');
  const [search, setSearch] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  const isEmployee = user.role === 'EMPLOYEE';
  const canFilter = !isEmployee;

  const rows = useMemo<PayrollRow[]>(() => {
    const employeeRows = users
      .filter((item) => item.role === 'EMPLOYEE' && item.status === 'ACTIVE')
      .map((item) => {
        const role = getRoleForUser(item);
        if (!role) return null;
        return computePayrollRow({
          user: item,
          role,
          attendances,
          submissions,
          company,
          period,
        });
      })
      .filter((row): row is PayrollRow => Boolean(row));

    const hrdRows = users
      .filter((item) => item.role === 'HRD' && item.status === 'ACTIVE')
      .map((item) => {
        const compensation = getCompensation(item.id);
        if (!compensation) return null;
        return computeHrdPayrollRow(item, compensation, company, period);
      })
      .filter((row): row is PayrollRow => Boolean(row));

    if (isEmployee) {
      return employeeRows.filter((row) => row.userId === user.id);
    }

    const combined = filter === 'EMPLOYEE' ? employeeRows : filter === 'HRD' ? hrdRows : [...employeeRows, ...hrdRows];
    return combined
      .filter((row) =>
        search.trim()
          ? row.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            row.employeeCode.toLowerCase().includes(search.trim().toLowerCase())
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    attendances,
    company,
    filter,
    getCompensation,
    getRoleForUser,
    isEmployee,
    period,
    search,
    submissions,
    user.id,
    users,
  ]);

  const summary = useMemo(() => summarizePayroll(rows), [rows]);
  const myRow = isEmployee ? rows[0] : undefined;
  const myRole = getRoleForUser(user);
  const myLocation = getLocationForUser(user);
  const nextDisabled = period >= currentPeriod();

  const openDetail = (row: PayrollRow) => {
    navigation.navigate('PayrollDetail', { userId: row.userId, period });
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Payroll"
          subtitle={`${formatPeriodRange(period)} · data simulasi`}
          onBack={showBack ? () => navigation.goBack() : undefined}
          onMenu={showBack ? undefined : () => navigation.navigate('Menu')}
          right={
            canFilter ? (
              <IconButton
                icon={Info}
                accessibilityLabel="Aturan perhitungan payroll demo"
                onPress={() => setRulesOpen(true)}
                backgroundColor={colors.surface}
                color={colors.primary}
                style={styles.bordered}
              />
            ) : undefined
          }
        />
      }
    >
      <Card padded={false} style={styles.periodCard}>
        <Pressable
          onPress={() => setPeriod((value) => shiftPeriod(value, -1))}
          accessibilityLabel="Periode sebelumnya"
          style={styles.periodButton}
        >
          <ChevronLeft size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.periodLabel}>
          <AppText variant="caption">Periode penggajian</AppText>
          <AppText variant="subtitle">{formatPeriod(period)}</AppText>
        </View>
        <Pressable
          onPress={() => setPeriod((value) => shiftPeriod(value, 1))}
          disabled={nextDisabled}
          accessibilityLabel="Periode berikutnya"
          style={[styles.periodButton, { opacity: nextDisabled ? 0.35 : 1 }]}
        >
          <ChevronRight size={18} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
      </Card>

      {isEmployee && myRow ? (
        <>
          <Card tone="dark" style={styles.heroCard}>
            <View style={styles.rowBetween}>
              <View style={styles.heroText}>
                <AppText style={styles.heroEyebrow}>AKUMULASI GAJI {formatPeriod(period).toUpperCase()}</AppText>
                <AppText style={styles.heroValue}>{formatCurrency(myRow.grossEarned)}</AppText>
                <AppText style={styles.heroHint}>
                  {myRow.presentDays} hari hadir · {myRow.lateDays} terlambat
                </AppText>
              </View>
              <View style={styles.heroIcon}>
                <Wallet size={22} color={colors.accent} strokeWidth={2} />
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.rowBetween}>
              <View>
                <AppText style={styles.heroEyebrow}>PROYEKSI BULAN INI</AppText>
                <AppText style={styles.heroProjection}>{formatCurrency(myRow.projectedGross)}</AppText>
              </View>
              <Badge label="Simulasi" tone="dark" />
            </View>
          </Card>

          <View style={styles.statRow}>
            <StatCard
              label="Gaji pokok harian"
              value={formatCurrency(myRow.dailyBaseSalary)}
              icon={Coins}
              tone="primary"
            />
            <StatCard
              label="Tunjangan harian"
              value={formatCurrency(myRow.transportPerDay + myRow.mealPerDay)}
              icon={Wallet}
              tone="info"
            />
            <StatCard
              label="Denda telat"
              value={formatCurrency(myRow.lateDeduction)}
              icon={Percent}
              tone="warning"
            />
          </View>

          <Card style={{ marginTop: spacing.md }}>
            <AppText variant="subtitle">Rincian komponen</AppText>
            <PayrollBreakdown row={myRow} />
            <Button
              label="Lihat rincian per hari"
              variant="secondary"
              size="sm"
              onPress={() => openDetail(myRow)}
              style={{ marginTop: spacing.md }}
            />
          </Card>

          <InfoNote
            style={{ marginTop: spacing.md }}
            icon={Info}
            tone="warning"
            title="Nilai penggajian masih simulasi"
            body="Angka dihitung dari data absensi mock dan komponen role. Belum memperhitungkan pajak, BPJS, atau potongan resmi lainnya."
          />

          <Card style={{ marginTop: spacing.md }}>
            <AppText variant="caption" style={styles.metaLabel}>
              ROLE & LOKASI
            </AppText>
            <AppText variant="body">{myRole?.name ?? '-'}</AppText>
            <AppText variant="caption">
              {myLocation?.name ?? '-'} · {ROLE_LABEL[user.role]} · {user.employeeCode}
            </AppText>
          </Card>
        </>
      ) : (
        <>
          <Card tone="dark" style={styles.heroCard}>
            <View style={styles.rowBetween}>
              <View style={styles.heroText}>
                <AppText style={styles.heroEyebrow}>TOTAL PAYROLL {formatPeriod(period).toUpperCase()}</AppText>
                <AppText style={styles.heroValue}>{formatCurrency(summary.total)}</AppText>
                <AppText style={styles.heroHint}>
                  {summary.headcount} penerima · {summary.presentDays} hari hadir
                </AppText>
              </View>
              <View style={styles.heroIcon}>
                <Wallet size={22} color={colors.accent} strokeWidth={2} />
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroFooterRow}>
              <View>
                <AppText style={styles.heroEyebrow}>PROYEKSI JIKA PENUH</AppText>
                <AppText style={styles.heroProjection}>{formatCurrency(summary.projectedTotal)}</AppText>
              </View>
              <View style={styles.heroSplit}>
                <AppText style={styles.heroMiniLabel}>Karyawan</AppText>
                <AppText style={styles.heroMiniValue}>{formatCurrency(summary.employeeTotal)}</AppText>
                <AppText style={styles.heroMiniLabel}>HRD</AppText>
                <AppText style={styles.heroMiniValue}>{formatCurrency(summary.hrdTotal)}</AppText>
              </View>
            </View>
          </Card>

          <View style={styles.statRow}>
            <StatCard label="Tunjangan" value={formatCurrency(summary.transportTotal + summary.mealTotal)} icon={Coins} tone="info" />
            <StatCard label="Denda telat" value={formatCurrency(summary.lateDeductionTotal)} icon={Percent} tone="warning" />
          </View>

          <SectionHeader title="Daftar payroll" subtitle="Ketuk baris untuk melihat rincian" />
          <SegmentedTabs
            options={[
              { value: 'ALL', label: 'Semua', count: users.filter((item) => item.status === 'ACTIVE' && item.role !== 'OWNER').length },
              { value: 'EMPLOYEE', label: 'Karyawan' },
              { value: 'HRD', label: 'HRD' },
            ]}
            value={filter}
            onChange={(value) => setFilter(value as 'ALL' | 'EMPLOYEE' | 'HRD')}
          />
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau kode karyawan"
            style={{ marginTop: spacing.md }}
          />
          <View style={styles.list}>
            {rows.map((row) => (
              <PayrollRowItem key={`${row.userId}-${row.period}`} row={row} onPress={() => openDetail(row)} />
            ))}
            {rows.length === 0 ? (
              <AppText variant="small" align="center" style={styles.empty}>
                Tidak ada data payroll pada filter ini.
              </AppText>
            ) : null}
          </View>

          <InfoNote
            style={{ marginTop: spacing.md }}
            icon={Info}
            tone="warning"
            title="Data simulasi"
            body="Nilai payroll dihitung dari mock attendance dan komponen role. Gunakan ikon info di atas untuk melihat aturan perhitungan demo."
          />
        </>
      )}

      <BottomSheet visible={rulesOpen} onClose={() => setRulesOpen(false)} title="Aturan payroll demo" subtitle={`Periode ${formatPeriod(period)}`}>
        {DEMO_PAYROLL_RULES.map((rule, index) => (
          <View key={rule} style={styles.ruleRow}>
            <View style={styles.ruleNumber}>
              <AppText style={styles.ruleNumberText}>{index + 1}</AppText>
            </View>
            <AppText variant="small" style={styles.ruleText}>
              {rule}
            </AppText>
          </View>
        ))}
        <InfoNote
          icon={Info}
          tone="neutral"
          body="Rumus ini disederhanakan untuk demo frontend. Perhitungan produksi (pajak, BPJS, lembur, hari libur) harus divalidasi tim payroll dan backend."
        />
      </BottomSheet>
    </Screen>
  );
}

export function PayrollRowItem({ row, onPress }: { row: PayrollRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Payroll ${row.name}, ${formatCurrency(row.grossEarned)}`}
      style={({ pressed }) => [styles.rowCard, { opacity: pressed ? 0.75 : 1 }]}
    >
      <Avatar name={row.name} size={40} />
      <View style={styles.rowText}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {row.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1}>
          {row.roleName} · {row.employeeCode}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {row.kind === 'HRD' ? 'Gaji bulanan tetap' : `${row.presentDays} hari hadir · ${row.lateDays} telat`}
        </AppText>
      </View>
      <View style={styles.rowAmount}>
        <AppText variant="bodyStrong" style={{ textAlign: 'right' }}>
          {formatCurrency(row.grossEarned)}
        </AppText>
        <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export function PayrollBreakdown({ row }: { row: PayrollRow }) {
  return (
    <View style={styles.breakdown}>
      <BreakdownLine
        label="Gaji pokok"
        hint={row.kind === 'HRD' ? 'Bulanan tetap' : `${formatCurrency(row.dailyBaseSalary)} × ${row.presentDays} hari`}
        value={formatCurrency(row.dailyBaseSalary * row.presentDays)}
      />
      <BreakdownLine label="Tunjangan transportasi" hint={`${formatCurrency(row.transportPerDay)} / hari`} value={formatCurrency(row.transportTotal)} />
      <BreakdownLine label="Tunjangan makan" hint={`${formatCurrency(row.mealPerDay)} / hari`} value={formatCurrency(row.mealTotal)} />
      {row.fixedAllowance > 0 ? (
        <BreakdownLine label="Tunjangan jabatan" value={formatCurrency(row.fixedAllowance)} />
      ) : null}
      {row.otherDeduction > 0 ? (
        <BreakdownLine label="Potongan BPJS" value={`- ${formatCurrency(row.otherDeduction)}`} tone="danger" />
      ) : null}
      <BreakdownLine
        label="Denda keterlambatan"
        hint={`${row.lateMinutes} menit`}
        value={`- ${formatCurrency(row.lateDeduction)}`}
        tone={row.lateDeduction > 0 ? 'warning' : 'default'}
      />
      {row.unpaidLeaveDays > 0 ? (
        <BreakdownLine
          label="Cuti tanpa gaji"
          hint={`${row.unpaidLeaveDays} hari`}
          value={`- ${formatCurrency(row.unpaidLeaveDeduction)}`}
          tone="danger"
        />
      ) : null}
      {row.permissionDays > 0 ? (
        <BreakdownLine
          label="Potongan izin pribadi"
          hint={`${row.permissionDays} hari`}
          value={`- ${formatCurrency(row.permissionDeduction)}`}
          tone="danger"
        />
      ) : null}
      <View style={styles.breakdownTotal}>
        <AppText variant="bodyStrong">Total diterima (demo)</AppText>
        <AppText variant="bodyStrong" color={colors.accentDark}>
          {formatCurrency(row.grossEarned)}
        </AppText>
      </View>
    </View>
  );
}

function BreakdownLine({
  label,
  hint,
  value,
  tone = 'default',
}: {
  label: string;
  hint?: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabel}>
        <AppText variant="small" style={{ color: colors.textSecondary }}>
          {label}
        </AppText>
        {hint ? <AppText variant="caption">{hint}</AppText> : null}
      </View>
      <AppText
        variant="small"
        style={{
          fontWeight: '700',
          color: tone === 'danger' ? colors.dangerDark : tone === 'warning' ? colors.warningDark : colors.text,
        }}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bordered: { borderWidth: 1, borderColor: colors.border },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  periodButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  periodLabel: { alignItems: 'center', gap: 1 },
  heroCard: { gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  heroEyebrow: { fontSize: 10, letterSpacing: 0.8, fontWeight: '700', color: colors.textOnDarkMuted },
  heroValue: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  heroHint: { fontSize: 11.5, color: colors.textOnDarkMuted },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: { height: 1, backgroundColor: 'rgba(248,250,252,0.14)' },
  heroProjection: { fontSize: 16, fontWeight: '700', color: colors.white, fontVariant: ['tabular-nums'] },
  heroFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md },
  heroSplit: { alignItems: 'flex-end' },
  heroMiniLabel: { fontSize: 10, color: colors.textOnDarkMuted },
  heroMiniValue: { fontSize: 12, fontWeight: '700', color: colors.textOnDark, fontVariant: ['tabular-nums'] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  list: { gap: spacing.sm, marginTop: spacing.md },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, gap: 1 },
  rowAmount: { alignItems: 'flex-end', gap: 2 },
  metaLabel: { color: colors.textMuted, fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
  empty: { paddingVertical: spacing.xl, color: colors.textMuted },
  breakdown: { marginTop: spacing.sm, gap: 2 },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  breakdownLabel: { flex: 1 },
  breakdownTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  ruleRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  ruleNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  ruleText: { flex: 1, lineHeight: 19, color: colors.textSecondary },
});
