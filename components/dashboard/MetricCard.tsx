'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export type MetricCardVariant = 'emerald' | 'lime' | 'white';

interface MetricCardProps {
  title: string;
  description: string;
  value: string;
  changePercent: number;
  variant?: MetricCardVariant;
  icon?: React.ReactNode;
  isExpense?: boolean;
}

export function MetricCard({
  title,
  description,
  value,
  changePercent,
  variant = 'white',
  icon,
  isExpense = false,
}: MetricCardProps) {
  const isPositive = changePercent >= 0;
  // For expense, a reduction is good
  const isGood = isExpense ? !isPositive : isPositive;

  if (variant === 'emerald') {
    return (
      <div className="bg-[#00875A] text-white p-6 rounded-3xl border-2 border-[#00744D] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs font-semibold text-emerald-100 mt-0.5">
                {description}
              </p>
            </div>
          </div>

          {/* Huge Display Number */}
          <div className="mt-5 text-3xl sm:text-4xl font-black text-white tracking-tight">
            {value}
          </div>
        </div>

        {/* Change Badge */}
        <div className="mt-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-white/25 border border-white/30 text-white font-extrabold text-xs px-2.5 py-1 rounded-full">
            {isPositive ? <ArrowUp className="w-3.5 h-3.5 stroke-[3]" /> : <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{isPositive ? `+${changePercent.toLocaleString('id-ID')}%` : `${changePercent.toLocaleString('id-ID')}%`}</span>
          </span>
          <span className="text-xs font-semibold text-emerald-100">dari kemarin</span>
        </div>
      </div>
    );
  }

  if (variant === 'lime') {
    return (
      <div className="bg-[#ECFDF5] text-emerald-950 p-6 rounded-3xl border-2 border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-emerald-950 leading-tight">
                {title}
              </h3>
              <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">
                {description}
              </p>
            </div>
          </div>

          {/* Huge Display Number */}
          <div className="mt-5 text-3xl sm:text-4xl font-black text-emerald-900 tracking-tight">
            {value}
          </div>
        </div>

        {/* Change Badge */}
        <div className="mt-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-emerald-200/80 border border-emerald-300 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-full">
            {isPositive ? <ArrowUp className="w-3.5 h-3.5 stroke-[3]" /> : <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{isPositive ? `+${changePercent.toLocaleString('id-ID')}%` : `${changePercent.toLocaleString('id-ID')}%`}</span>
          </span>
          <span className="text-xs font-semibold text-emerald-800/70">dari kemarin</span>
        </div>
      </div>
    );
  }

  // White Card
  return (
    <div className="bg-white text-slate-900 p-6 rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        {/* Huge Display Number */}
        <div className="mt-5 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {value}
        </div>
      </div>

      {/* Change Badge */}
      <div className="mt-5 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 font-extrabold text-xs px-2.5 py-1 rounded-full border ${
            isGood
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isExpense ? (
            <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
          ) : isPositive ? (
            <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
          )}
          <span>{isPositive ? `+${changePercent.toLocaleString('id-ID')}%` : `${changePercent.toLocaleString('id-ID')}%`}</span>
        </span>
        <span className="text-xs font-bold text-slate-500">dari kemarin</span>
      </div>
    </div>
  );
}
