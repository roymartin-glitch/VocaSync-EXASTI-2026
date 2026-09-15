import {
  Profile,
  DashboardMetrics,
  TrendDayData,
  AIInsight,
  ProductAnalysisItem,
  Transaction,
  Experiment
} from '@/types';
import { DEMO_PRODUCTS, DEMO_TRANSACTIONS, DEMO_DASHBOARD_METRICS, DEMO_TREND_DATA, DEMO_PRIMARY_INSIGHT, DEMO_EXPERIMENTS } from './demo-data';

export const mockProfile: Profile = {
  id: 'user-001',
  business_name: 'Kios Berkah Sayur',
  owner_name: 'Pak Budi',
  business_type: 'pasar',
  margin_alert_threshold: 20,
};

export const mockDashboardMetrics: DashboardMetrics = DEMO_DASHBOARD_METRICS;

export const mockTrendData: TrendDayData[] = DEMO_TREND_DATA;

export const mockInsights: AIInsight[] = [DEMO_PRIMARY_INSIGHT];

export const mockProducts: ProductAnalysisItem[] = [...DEMO_PRODUCTS];

export const mockTransactions: Transaction[] = [...DEMO_TRANSACTIONS];

export const mockExperiments: Experiment[] = [...DEMO_EXPERIMENTS];

