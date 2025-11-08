# Keystroke Dynamics Data Collection System
Built with Next.js and Supabase.

## Quick Start

### Installation & Running

```
npm install
npm run dev
```

## Data Collection Guide

1. **Begin a Test Session**
   - A unique session ID is automatically generated when you load the page
   - This session ID tracks all your keystrokes for the current session

2. **Start Typing**
   - All keystrokes (key presses and releases) are captured automatically
   - Each keystroke is tagged with:
     - Session ID
     - Test type (free, timed, multitasking)
     - Field name (which question you're answering)
     - Timestamp and timing metrics

3. **Review Your Data** 
   - Click **"Show All Data"** to see captured keystrokes in real-time

4. **Save Your Data** **PLEASE SAVE BEFORE YOU SWITCH OUT**
   - Click **"Save to Supabase"** to save your data to the database
   - **PLEASE SAVE BEFORE SWITCHING TESTS OR RELOADING** sorry this is a bad design on my end i will fix it soon

5. **Switch Tests**
   - Select a different test type from the test selector
   - **Do not reload the page in order to retain your session id** another slightly bad design sorry


### TLDR
> **🚨 If you reload the page, all unsaved data will be lost and a new session will start.**


## 🗄️ Database Schema

Data is stored in Supabase with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Auto-generated unique identifier |
| `key` | text | The key pressed (e.g., "a", "Enter") |
| `pressed_at` | timestamp | When the key was pressed |
| `session_id` | uuid | Unique session identifier |
| `test_type` | text | Type of test (free, timed, multitasking) |
| `event_type` | text | "keydown" or "keyup" |
| `device_info` | text | Browser user agent string |
| `form_snapshot` | jsonb | Form state at time of keystroke |
| `field_name` | text | Which field was being filled (e.g., "email", "morningRoutine") |
| `meta` | jsonb | Additional metadata (key code, elapsed time, challenge ID) |

## Things that are still wonky  
- multitasking test -> save the time when the challenge is given so that we can monitor if there is a difference at that specific time
- sorry the reloading thing may be quite annoying lawl
- the stupid questions... will change soon
