"use client";

import React from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateStorecheckSql, SqlValidationIssue } from '../../lib/storecheckSqlValidator';

interface SqlValidationAlertsProps {
  sql: string | null | undefined;
  onFixSql?: (fixedSql: string) => void;
  className?: string;
}

export default function SqlValidationAlerts({ sql, onFixSql, className = "" }: SqlValidationAlertsProps) {
  if (!sql || !sql.trim()) return null;

  const issues = validateStorecheckSql(sql);

  if (issues.length === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1.5 px-2 py-1 bg-emerald-50/60 border border-emerald-200/50 rounded ${className}`}>
        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
        <span>Sintaxis compatible con Portal Storecheck</span>
      </div>
    );
  }

  const handleFix = (issue: SqlValidationIssue) => {
    if (issue.fixedSql && onFixSql) {
      onFixSql(issue.fixedSql);
      toast.success(`Corrección aplicada: ${issue.title}`);
    }
  };

  return (
    <div className={`space-y-1.5 mt-2 ${className}`}>
      {issues.map((issue) => {
        const isError = issue.type === 'error';
        const isWarning = issue.type === 'warning';

        const containerClasses = isError
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : isWarning
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-blue-50 border-blue-200 text-blue-900";

        const icon = isError ? (
          <AlertOctagon size={14} className="text-rose-600 shrink-0 mt-0.5" />
        ) : isWarning ? (
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        );

        return (
          <div
            key={issue.id}
            className={`flex items-start justify-between gap-3 p-2.5 rounded-md border text-xs leading-relaxed shadow-xs ${containerClasses}`}
          >
            <div className="flex items-start gap-2 flex-1">
              {icon}
              <div className="space-y-0.5">
                <span className="font-semibold block">{issue.title}</span>
                <p className="text-[11px] opacity-90">{issue.message}</p>
              </div>
            </div>

            {issue.canAutoFix && issue.fixedSql && onFixSql && (
              <button
                type="button"
                onClick={() => handleFix(issue)}
                className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded transition-colors shadow-2xs ${
                  isError
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
                title="Aplicar corrección automática recomendada"
              >
                <Wand2 size={12} />
                <span>{issue.fixLabel || "Auto-corregir"}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
