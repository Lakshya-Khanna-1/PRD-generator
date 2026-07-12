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
