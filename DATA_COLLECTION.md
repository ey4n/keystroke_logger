# Frontend Overview

This document describes the main website in the `frontend/` folder.

## Purpose

The frontend is a Next.js application used to run keystroke-based research tasks, collect consent and session metadata, capture typing behavior, save data to Supabase, and request stress predictions from the model API.

## Main Responsibilities

- Show the consent flow before participants start a session.
- Create and persist a session ID in `sessionStorage`.
- Run multiple test modes such as free typing, timed typing, multitasking, and colour-based tasks.
- Capture detailed keystroke events during typing.
- Save keystrokes, form snapshots, workload responses, timings, and consent data.
- Compute stress-related typing metrics from captured events.
- Send prediction requests to the backend model API.

## Main Flow

1. The user opens the site.
2. The app creates or restores a session ID.
3. The consent form is shown first.
4. After consent, the user enters the main test container.
5. The user completes one or more tests.
6. Keystroke data and related form data are saved.
7. For prediction-enabled tests, the frontend compares the current test against the free-typing baseline and calls the model API.

## Key Pages and Components

Entry point:

- `frontend/src/app/page.tsx`

This page:

- initializes the session ID
- restores consent from `sessionStorage`
- saves consent data to Supabase
- routes the user into the test container

Main container:

- `frontend/src/components/TestContainer.tsx`

This component:

- manages the active test
- displays the session ID
- handles session reset
- coordinates test data collection
- shows the post-test data display

Test components:

- `frontend/src/components/tests/Free.tsx`
- `frontend/src/components/tests/TimedTest.tsx`
- `frontend/src/components/tests/MultitaskingTest.tsx`
- `frontend/src/components/tests/Colour.tsx`

Supporting UI:

- `frontend/src/components/ConsentForm.tsx`
- `frontend/src/components/KeystrokeDataDisplay.tsx`
- `frontend/src/components/TestSelector.tsx`
- `frontend/src/components/StressWorkloadForm.tsx`
- `frontend/src/components/WellnessBaselineForm.tsx`

## Keystroke Logging

Core hook:

- `frontend/src/hooks/useKeystrokeLogger.ts`

The keystroke logger captures:

- `keydown` and `keyup` events
- key value and code
- timestamps
- session ID
- active field name
- active challenge ID
- elapsed time since session start
- device information

It also includes a mobile fallback for virtual keyboards that do not emit standard key events.

## Metrics and Prediction

Stress metrics are derived from keystroke events in:

- `frontend/src/utils/stressMetrics.ts`

The frontend prediction flow is implemented in:

- `frontend/src/services/stressPrediction.ts`

Prediction logic:

- fetches the participant's free-typing baseline
- computes current metrics for timed or multitasking tests
- builds a feature payload with baseline values and change values
- requests predictions from both the `baseline` and `change_only` models

## Data Saving

Supabase-related services live in:

- `frontend/src/services/saveKeystrokes.ts`
- `frontend/src/services/saveFormSnapshot.ts`
- `frontend/src/services/saveStressWorkload.ts`
- `frontend/src/services/saveTimings.ts`
- `frontend/src/services/saveConsent.ts`
- `frontend/src/services/saveLeaderboard.ts`
- `frontend/src/services/supabaseClient.ts`

Main saved data types include:

- keystroke events
- form snapshots
- workload or stress survey responses
- timing data
- consent data

## API Integration

The frontend uses a local proxy route:

- `frontend/src/app/api/stress-predict/route.ts`

This route forwards prediction requests to the model service and helps avoid browser CORS issues.

Environment variables used by the frontend include:

- `STRESS_MODEL_API_URL`
- `NEXT_PUBLIC_STRESS_MODEL_API_URL`

If no direct public model URL is set in the browser, the site uses the local `/api/stress-predict` proxy.

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Default local app URL:

- `http://localhost:3000`

## Summary

The frontend is the participant-facing research website. It handles consent, session tracking, test flow, keystroke capture, Supabase persistence, and communication with the stress prediction backend.
