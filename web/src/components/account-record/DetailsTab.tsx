"use client";

import { Lock, MailIcon, Phone, BadgeCheck, Star } from "lucide-react";
import { KeyValue, SectionLabel, Divider } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/Badge";
import { prettyPhone } from "@/lib/format";
import { RelTime } from "@/components/ui/RelTime";
import { PAYMENT_OPTIONS } from "@/lib/data";
import type { Debtor } from "@/lib/types";

interface Props {
  account: Debtor;
}

export function DetailsTab({ account }: Props) {
  return (
    <div className="px-5 py-5 space-y-6">
      {/* Contact */}
      <section>
        <SectionLabel className="mb-3">Contact information</SectionLabel>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <KeyValue
            label={
              <span className="flex items-center gap-1">
                <Phone className="size-3" aria-hidden /> Phone
              </span>
            }
            value={<span className="tnum">{prettyPhone(account.phone)}</span>}
          />
          {account.email && (
            <KeyValue
              label={
                <span className="flex items-center gap-1">
                  <MailIcon className="size-3" aria-hidden /> Email
                </span>
              }
              value={account.email}
            />
          )}
          <KeyValue label="Best time to call" value={account.bestTime ?? "—"} />
          <KeyValue
            label="Language"
            value={
              <Badge tone="neutral">
                {account.language === "ES" ? "Español" : "English"}
              </Badge>
            }
          />
          <KeyValue
            label="Last contact"
            value={<RelTime iso={account.lastContactISO} />}
          />
          <KeyValue label="Original creditor" value={account.originalCreditor} />
        </dl>
      </section>

      <Divider />

      {/* Identity verification */}
      <section>
        <SectionLabel className="mb-3">Right-party verification</SectionLabel>
        <div className="flex items-start gap-3 rounded-xl bg-[#f8f9fb] border border-border p-4">
          <span
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef0f5] text-subtle"
            aria-hidden
          >
            <Lock className="size-4" />
          </span>
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-xs text-subtle">
              Masked values shown — raw data is never stored in this operator view. Identity verified live on the call via{" "}
              <span className="font-mono text-primary">verify_identity</span>.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
              <KeyValue label="Date of birth" value={<span className="font-mono tnum">{account.identityMask.dob}</span>} />
              <KeyValue label="SSN last 4" value={<span className="font-mono tnum">{account.identityMask.ssnLast4}</span>} />
            </dl>
          </div>
        </div>
      </section>

      <Divider />

      {/* Resolution options */}
      <section>
        <SectionLabel className="mb-3">Resolution options</SectionLabel>
        <ul className="space-y-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <li key={opt.id} className="flex items-start gap-3 rounded-lg border border-border p-3.5">
              <span
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${opt.managerApproved ? "bg-warning-soft text-warning-ink" : "bg-success-soft text-success-ink"}`}
                aria-hidden
              >
                {opt.managerApproved ? (
                  <Star className="size-3.5" />
                ) : (
                  <BadgeCheck className="size-3.5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  {opt.managerApproved && (
                    <Badge tone="warning" className="text-[10px] py-0">
                      Manager-approved
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted">{opt.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
