"use client";

import { useState } from "react";
import { PhoneCall, CircleCheck, StickyNote, TriangleAlert, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/primitives";
import { PromiseDialog } from "./PromiseDialog";
import { NoteDialog } from "./NoteDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { recordPromise, recordDispute, recordCease, addNote } from "@/lib/store";
import { toast } from "@/lib/toast";
import { money } from "@/lib/format";
import type { Debtor } from "@/lib/types";

interface Props {
  account: Debtor;
  onStartCall: () => void;
}

export function ActionBar({ account, onStartCall }: Props) {
  const [promiseOpen, setPromiseOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [ceaseOpen, setCeaseOpen] = useState(false);

  const callDisabled = account.status === "cease" || account.status === "paid";
  const callReason =
    account.status === "cease"
      ? "Do not contact — cease request on file"
      : account.status === "paid"
        ? "Account is resolved"
        : null;

  const handlePromise = (amount: number, date: string, planId: string | null) => {
    const confirmation = recordPromise(account.accountId, { amount, date, planId });
    setPromiseOpen(false);
    toast.success("Promise logged", `${money(amount)} on ${date} · ${confirmation}`);
  };

  const handleNote = (text: string) => {
    addNote(account.accountId, text);
    setNoteOpen(false);
    toast.success("Note saved");
  };

  const handleDispute = (reason?: string) => {
    recordDispute(account.accountId, reason ? `${reason} ` : "Debt disputed. ");
    setDisputeOpen(false);
    toast.warning("Account marked disputed", "Collection paused. Validation queued.");
  };

  const handleCease = () => {
    recordCease(account.accountId);
    setCeaseOpen(false);
    toast.warning("Cease-contact honored", "Do not contact this account.");
  };

  return (
    <>
      <div className="card px-4 py-3 flex flex-wrap items-center gap-2">
        {/* Primary */}
        {callReason ? (
          <Tooltip label={callReason}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PhoneCall className="size-4" />}
              disabled
              aria-disabled="true"
              aria-describedby="call-disabled-reason"
            >
              Call now
            </Button>
            <span id="call-disabled-reason" className="sr-only">
              {callReason}
            </span>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PhoneCall className="size-4" />}
            onClick={onStartCall}
          >
            Call now
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CircleCheck className="size-4" />}
          onClick={() => setPromiseOpen(true)}
        >
          Log promise to pay
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<StickyNote className="size-4" />}
          onClick={() => setNoteOpen(true)}
        >
          Add note
        </Button>

        {/* Separator + destructive */}
        <div className="h-6 w-px bg-border mx-1 hidden sm:block" aria-hidden />

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<TriangleAlert className="size-4 text-warning-ink" />}
          className="text-warning-ink hover:bg-warning-soft"
          onClick={() => setDisputeOpen(true)}
          disabled={account.status === "dispute"}
        >
          Mark disputed
        </Button>

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<PhoneOff className="size-4 text-danger-ink" />}
          className="text-danger-ink hover:bg-danger-soft"
          onClick={() => setCeaseOpen(true)}
          disabled={account.status === "cease"}
        >
          Honor cease
        </Button>
      </div>

      <PromiseDialog
        open={promiseOpen}
        defaultAmount={account.minimumPayment}
        onClose={() => setPromiseOpen(false)}
        onSubmit={handlePromise}
      />

      <NoteDialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        onSubmit={handleNote}
      />

      <ConfirmDialog
        open={disputeOpen}
        title="Mark account as disputed?"
        description="Collection activity will pause immediately and a written debt validation will be mailed (FDCPA §1692g). This cannot be undone."
        reasonLabel="Dispute reason"
        reasonPlaceholder='e.g. "I already paid this" or "This is not my debt"'
        confirmLabel="Mark disputed"
        variant="warning"
        onClose={() => setDisputeOpen(false)}
        onConfirm={handleDispute}
      />

      <ConfirmDialog
        open={ceaseOpen}
        title="Honor cease-communication request?"
        description="All outbound contact with this debtor will stop permanently. This action is logged and cannot be undone (FDCPA §1692c(c))."
        confirmLabel="Honor cease"
        variant="danger"
        onClose={() => setCeaseOpen(false)}
        onConfirm={handleCease}
      />
    </>
  );
}
