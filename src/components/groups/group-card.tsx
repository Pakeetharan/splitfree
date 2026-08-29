"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { formatDate, formatAmount, formatRelativeTime } from "@/lib/utils";

interface GroupCardProps {
  group: {
    _id: string;
    name: string;
    description: string | null;
    currency: string;
    memberCount?: number;
    createdAt: string;
    myBalance?: number; // cents — positive = owed to you, negative = you owe
    lastActivityAt?: string | null;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  const balance = group.myBalance ?? 0;
  return (
    <Link href={`/dashboard/groups/${group._id}`}>
      <Card className="h-full transition-colors hover:border-gray-300 hover:shadow-sm dark:hover:border-gray-600">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{group.name}</CardTitle>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {group.currency}
            </span>
          </div>
          {group.description && (
            <CardDescription className="line-clamp-1">
              {group.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-text-muted">
              {group.memberCount !== undefined && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {group.memberCount}
                </span>
              )}
              <span className="text-xs">{formatDate(group.createdAt)}</span>
              {group.lastActivityAt && (
                <span className="text-xs">
                  · Active {formatRelativeTime(group.lastActivityAt)}
                </span>
              )}
            </div>
            {balance !== 0 && (
              <span
                className={`text-sm font-semibold ${
                  balance > 0
                    ? "text-positive"
                    : "text-negative"
                }`}
              >
                {balance > 0 ? "+" : "−"}{" "}
                {formatAmount(Math.abs(balance), group.currency)}
              </span>
            )}
            {balance === 0 &&
              group.memberCount !== undefined &&
              group.memberCount > 1 && (
                <span className="text-xs text-text-muted">
                  Settled
                </span>
              )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
