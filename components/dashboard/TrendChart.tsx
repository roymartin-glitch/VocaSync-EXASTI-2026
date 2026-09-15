import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendDayData } from '@/types';

interface TrendChartProps {
  data: TrendDayData[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      const jt = (val / 1000000).toFixed(1).replace('.0', '').replace('.', ',');
      return `${jt}jt`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}k`;
    }
    return val.toString();
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenseVal = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      return (
        <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xl text-xs space-y-1.5 font-bold">
          <p className="text-slate-900 font-black text-sm">{label}</p>
          <div className="flex items-center justify-between gap-4 text-[#00875A]">
            <span>Uang Masuk:</span>
            <span className="font-extrabold">Rp{incomeVal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#EA580C]">
            <span>Uang Keluar:</span>
            <span className="font-extrabold">Rp{expenseVal.toLocaleString('id-ID')}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Renderer for capsule pill bar for Income (Green) - Consistent uniform #00875A across all bars
  const renderIncomePill = (props: any) => {
    const { x, y, width, height } = props;
    if (!height || height <= 0) return null;

    const visualHeight = Math.max(height, 14);
    const visualY = y - (visualHeight - height);
    const radius = Math.min(width / 2, visualHeight / 2);

    return (
      <g>
        {/* Base Green Pill - Consistent solid #00875A */}
        <rect
          x={x}
          y={visualY}
          width={width}
          height={visualHeight}
          rx={radius}
          ry={radius}
          fill="#00875A"
        />
        {/* Diagonal striped texture overlay */}
        <rect
          x={x}
          y={visualY}
          width={width}
          height={visualHeight}
          rx={radius}
          ry={radius}
          fill="url(#stripes-green)"
        />
      </g>
    );
  };

  // Renderer for capsule pill bar for Expense (Warm Orange)
  const renderExpensePill = (props: any) => {
    const { x, y, width, height } = props;
    if (!height || height <= 0) return null;

    const visualHeight = Math.max(height, 14);
    const visualY = y - (visualHeight - height);
    const radius = Math.min(width / 2, visualHeight / 2);

    return (
      <g>
        {/* Base Orange Pill */}
        <rect
          x={x}
          y={visualY}
          width={width}
          height={visualHeight}
          rx={radius}
          ry={radius}
          fill="#EA580C"
        />
        {/* Diagonal striped texture overlay */}
        <rect
          x={x}
          y={visualY}
          width={width}
          height={visualHeight}
          rx={radius}
          ry={radius}
          fill="url(#stripes-orange)"
        />
      </g>
    );
  };

  if (!isMounted) {
    return (
      <div className="h-64 bg-slate-50/50 rounded-3xl flex items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
        Memuat data grafik...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Legend: Uang Masuk (Hijau) vs Uang Keluar (Oranye) */}
      <div className="flex items-center gap-6 text-xs font-bold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#00875A]" />
          <span>Uang Masuk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#EA580C]" />
          <span>Uang Keluar</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 18, right: 10, left: -20, bottom: 0 }}
            barGap={4}
          >
            {/* SVG Defs for Diagonal Stripes Texture */}
            <defs>
              {/* Green Stripes for Income (Uniform across all bars) */}
              <pattern
                id="stripes-green"
                width={8}
                height={8}
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#005A3C"
                  strokeWidth="2.2"
                  strokeOpacity="0.4"
                />
              </pattern>

              {/* Orange Stripes for Expense (Uniform across all bars) */}
              <pattern
                id="stripes-orange"
                width={8}
                height={8}
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#9A3412"
                  strokeWidth="2"
                  strokeOpacity="0.35"
                />
              </pattern>
            </defs>

            {/* Subtle horizontal dashed grid lines */}
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#E6ECE9"
            />

            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: data.length > 14 ? 10 : 12, fontWeight: 800 }}
              dy={10}
              interval={data.length > 14 ? (data.length > 31 ? 6 : 4) : 0}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
              tickFormatter={formatCurrency}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.4)', radius: 12 }}
            />

            <Bar
              dataKey="income"
              name="Uang Masuk"
              shape={renderIncomePill}
              maxBarSize={data.length > 14 ? (data.length > 31 ? 6 : 10) : 22}
            />

            <Bar
              dataKey="expense"
              name="Uang Keluar"
              shape={renderExpensePill}
              maxBarSize={data.length > 14 ? (data.length > 31 ? 6 : 10) : 22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
