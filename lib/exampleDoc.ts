/** Real excerpt used on the landing page to show what SpecForge actually outputs. Not lorem ipsum. */
export const EXAMPLE_SPEC_MD = `## Overview

PlantPal helps apartment renters track watering schedules for their houseplants and get reminders before leaves start dropping. Users photograph each plant on day one; PlantPal identifies the species and sets a starting watering interval the user can adjust.

## Features

### Plant identification
Acceptance criteria: user uploads a photo, receives a species match with >80% confidence within 5 seconds, and can manually override the species if the match is wrong.

### Watering reminders
Acceptance criteria: push notification fires at the configured interval; user can mark "watered today" from the notification without opening the app; missed waterings show a red badge on the plant card after 24 hours overdue.

### Care log
Acceptance criteria: every watering, fertilizing, and repotting event is timestamped and shown in a reverse-chronological list per plant.

## Data Model

**Plant** — id, userId, species, nickname, photoUrl, wateringIntervalDays, lastWateredAt, potSizeCm

**CareEvent** — id, plantId, type (watered | fertilized | repotted), occurredAt, note

## Edge Cases & Error States

- Photo upload fails or times out: show retry button, keep the plant creation form populated.
- Species identification returns no match: fall back to a manual species search field.
- User deletes a plant with care history: confirm with a dialog naming the plant, then cascade-delete its CareEvents.
`;

export const EXAMPLE_TASKS_MD = `## Milestone 1 — Project setup & data model

- [ ] 1.1 Scaffold the app with a Plant and CareEvent table matching the fields in spec.md's Data Model.
- [ ] 1.2 Build the plant creation form: photo upload, nickname, initial watering interval.
- [ ] 1.3 Wire photo upload to a species-identification API; store the returned species + confidence on the Plant record.

**Human checkpoint:** create a plant with a real photo, confirm species + fields are saved correctly.

## Milestone 2 — Care tracking

- [ ] 2.1 Build the plant card list view showing nickname, photo, and days-until-next-watering.
- [ ] 2.2 Add "mark as watered" action that updates lastWateredAt and logs a CareEvent.
- [ ] 2.3 Add fertilize/repot logging, each creating a CareEvent with the right type.
- [ ] 2.4 Build the reverse-chronological care log view per plant.

**Human checkpoint:** log a full watering → fertilizing → repotting cycle for one plant and confirm the care log shows all three events in order.

## Milestone 3 — Reminders & edge cases

- [ ] 3.1 Schedule a push reminder at each plant's watering interval.
- [ ] 3.2 Add the red "overdue" badge after 24 hours past due.
- [ ] 3.3 Implement the photo-upload-failure retry flow (form stays populated).
- [ ] 3.4 Implement the manual species-search fallback when identification returns no match.
- [ ] 3.5 Implement the delete-plant confirmation dialog with cascading CareEvent deletion.

**Human checkpoint:** trigger each edge case on purpose (kill the network mid-upload, delete a plant with history) and confirm the app behaves as specced.
`;

export const EXAMPLE_AGENTS_MD = `## Core Rules

1. **Verify every milestone yourself before asking for human review.** Never mark a task done because "the code looks right" — run the app, exercise the flow, and confirm the behavior matches spec.md.
2. Work through tasks.md in milestone order; don't start Milestone 2 work before Milestone 1's human checkpoint passes.
3. Keep photo uploads and species-identification calls server-side — never expose the identification API key to the client.

## Milestone Verification Checklist

- [ ] Plant and CareEvent records match the exact fields in spec.md's Data Model.
- [ ] A plant created with a real photo shows a species match and a sensible starting watering interval.
- [ ] Marking "watered today" updates lastWateredAt and appears in the care log immediately.
- [ ] The overdue badge appears exactly at 24 hours past the watering interval, not before.
- [ ] Deleting a plant with care history shows the confirmation dialog and removes its CareEvents.
- [ ] No API keys are hardcoded — everything comes from environment variables.
`;
