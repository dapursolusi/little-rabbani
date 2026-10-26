import {
  BookOpen01Icon,
  Calendar02Icon,
  CalendarUserIcon,
  ClipboardIcon,
  Clock01Icon,
  DashboardSquare01Icon,
  DatabaseSettingIcon,
  File01Icon,
  File02Icon,
  Folder01Icon,
  HierarchyCircle03Icon,
  NoteIcon,
  Settings01Icon,
  Settings04Icon,
  TimeQuarterPassIcon,
  UserMultipleIcon,
  WorkIcon,
} from '@hugeicons/core-free-icons';
import { IconSvgElement } from '@hugeicons/react';

export interface School {
  name: string;
  logo: IconSvgElement;
  plan: string;
}

interface BaseNavItem {
  slug: string;
  title: string;
  label?: string;
  icon?: React.ReactNode | IconSvgElement;
  roles?: string[];
}

interface LeafNavItem extends BaseNavItem {
  href: string;
  isActive?: never;
  subItems?: never; // Explicitly forbids subItems when href exists
}

interface ParentNavItem extends BaseNavItem {
  href?: never; // Explicitly forbids href when subItems exist
  isActive?: boolean;
  subItems: {
    title: string;
    href: string;
    icon?: React.ReactNode | IconSvgElement;
    roles?: string[];
  }[];
}

export type SidebarNavItem = LeafNavItem | ParentNavItem;

const schools = [
  {
    name: 'Little Rabbani',
    logo: DashboardSquare01Icon,
    plan: 'Owner',
  },
];

const navGroups: SidebarNavItem[] = [
  {
    slug: 'dashboard',
    label: '',
    title: 'Dashboard',
    href: '/dashboard',
    icon: DashboardSquare01Icon,
  },
  {
    slug: 'master-data',
    title: 'Master Data',
    icon: DatabaseSettingIcon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Murid',
        href: '/dashboard/kid',
        icon: UserMultipleIcon,
        roles: ['owner'],
      },

      {
        title: 'Registrasi Batch',
        href: '/dashboard/registration',
        icon: CalendarUserIcon,
        roles: ['owner'],
      },
      {
        title: 'Aktivitas',
        href: '/dashboard/activity',
        icon: Folder01Icon,
        roles: ['owner'],
      },
      {
        title: 'Kurikulum',
        href: '/dashboard/curriculum',
        icon: BookOpen01Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'operational',
    title: 'Operasional',
    icon: WorkIcon,
    subItems: [
      {
        title: 'Jadwal',
        href: '/dashboard/calendar',
        icon: Clock01Icon,
        roles: ['owner', 'teacher'],
      },
      {
        title: 'DCR / Observasi Kelas',
        href: '/dashboard/daily',
        icon: ClipboardIcon,
        roles: ['owner', 'teacher'],
      },
    ],
  },
  {
    slug: 'reports',
    title: 'Laporan',
    icon: NoteIcon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Laporan Wali Murid',
        href: '/dashboard/report/daily',
        icon: File02Icon,
        roles: ['owner'],
      },
      {
        title: 'Laporan Bulanan',
        href: '/dashboard/report/month',
        icon: File01Icon,
        roles: ['owner'],
      },
      {
        title: 'Laporan Triwulanan',
        href: '/dashboard/report/quarterly',
        icon: File01Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'configuration',
    title: 'Konfigurasi',
    icon: Settings04Icon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Batch',
        href: '/dashboard/term',
        icon: Calendar02Icon,
        roles: ['owner'],
      },
      {
        title: 'Sesi Kelas',
        href: '/dashboard/class-session',
        icon: TimeQuarterPassIcon,
        roles: ['owner'],
      },
      {
        title: 'Tema & Subtema',
        href: '/dashboard/theme',
        icon: HierarchyCircle03Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'system',
    label: 'Sistem',
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings01Icon,
    roles: ['owner'],
  },
];

export { navGroups, schools };
