"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash } from "@phosphor-icons/react";
import { apiFetch, ApiError } from "@/api/client";
import type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationResponse,
  ApplicationStatus,
} from "@/api/types";
import { PaperPanel, paperInputClass } from "@/components/ui/paper-panel";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  formatShortDate,
  latestNextStep,
} from "@/lib/applications";
import { getAccessToken } from "@/lib/session";

const EVENT_TYPES: ApplicationEventType[] = [
  "NOTE",
  "NEXT_STEP",
  "INTERVIEW",
  "RESPONSE",
];

const EVENT_LABELS: Record<ApplicationEventType, string> = {
  NOTE: "Note",
  NEXT_STEP: "Next step",
  INTERVIEW: "Interview",
  RESPONSE: "Response",
  STATUS_CHANGE: "Status change",
};

export function StatusAndEvents({ app }: { app: ApplicationResponse }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(app.status as ApplicationStatus);
  const [eventType, setEventType] = useState<ApplicationEventType>("NOTE");
  const [content, setContent] = useState("");
  const [contactName, setContactName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const nextStep = latestNextStep(app.events);

  const statusMutation = useMutation({
    mutationFn: async (next: ApplicationStatus) => {
      const token = await getAccessToken();
      const body: Record<string, string> = { status: next };
      if (next === "APPLIED" && !app.appliedAt) {
        body.appliedAt = new Date().toISOString();
      }
      return apiFetch<ApplicationResponse>(`/applications/${app.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["application", app.id],
        (old: ApplicationResponse | undefined) => ({
          ...data,
          events: data.events ?? old?.events,
        }),
      );
      void queryClient.invalidateQueries({ queryKey: ["application", app.id] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      track(AnalyticsEvents.application_status_changed, {
        applicationId: app.id,
        status: data.status,
      });
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return apiFetch<ApplicationEvent>(`/applications/${app.id}/events`, {
        method: "POST",
        token,
        body: JSON.stringify({
          eventType,
          content: content.trim(),
          occurredAt: new Date().toISOString(),
          ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
        }),
      });
    },
    onSuccess: () => {
      setContent("");
      setContactName("");
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ["application", app.id] });
      track(AnalyticsEvents.event_added, {
        applicationId: app.id,
        eventType,
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : "Could not add event.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const token = await getAccessToken();
      return apiFetch<{ deleted: boolean }>(
        `/applications/${app.id}/events/${eventId}`,
        { method: "DELETE", token },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["application", app.id] });
      track(AnalyticsEvents.event_deleted, { applicationId: app.id });
    },
  });

  function onAddEvent(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setFormError("Write a short note for the event.");
      return;
    }
    addEventMutation.mutate();
  }

  const events = app.events ?? [];

  return (
    <div className="space-y-6">
      {nextStep ? (
        <PaperPanel className="border-guava-pink/25 bg-guava-pink/5 p-4 md:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-guava-pink">
            Next step
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {nextStep.content}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatShortDate(nextStep.occurredAt)}
            {nextStep.contactName ? ` · ${nextStep.contactName}` : ""}
          </p>
        </PaperPanel>
      ) : null}

      <PaperPanel className="border-guava-green/15 p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-tight">Status</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className={paperInputClass}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={
              statusMutation.isPending || status === app.status
            }
            onClick={() => statusMutation.mutate(status)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {statusMutation.isPending ? "Saving…" : "Update status"}
          </button>
        </div>
        {statusMutation.isError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {statusMutation.error instanceof ApiError
              ? statusMutation.error.message
              : "Could not update status."}
          </p>
        ) : null}
      </PaperPanel>

      <PaperPanel className="border-guava-pink/15 p-5 md:p-6">
        <h2 className="text-base font-semibold tracking-tight">Timeline</h2>

        <form onSubmit={onAddEvent} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-[10rem_1fr]">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Type</span>
              <select
                value={eventType}
                onChange={(e) =>
                  setEventType(e.target.value as ApplicationEventType)
                }
                className={paperInputClass}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Contact (optional)</span>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={paperInputClass}
                maxLength={200}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Details</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${paperInputClass} min-h-[4.5rem] resize-y`}
              maxLength={10_000}
              required
            />
          </label>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={addEventMutation.isPending}
            className="rounded-xl border border-guava-green/25 bg-white px-4 py-2.5 text-sm font-medium hover:border-guava-green/45 disabled:opacity-50"
          >
            {addEventMutation.isPending ? "Adding…" : "Add event"}
          </button>
        </form>

        {events.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No events yet. Log interviews, responses, and next steps here.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-guava-green/10 border-t border-guava-green/10">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {EVENT_LABELS[ev.eventType] ?? ev.eventType}
                    {" · "}
                    {formatShortDate(ev.occurredAt)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{ev.content}</p>
                  {ev.contactName ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ev.contactName}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Delete event"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(ev.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash className="size-4" weight="bold" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PaperPanel>
    </div>
  );
}
