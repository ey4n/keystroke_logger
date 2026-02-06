# ---
# Keystroke Dynamics & Stress Analysis
# Install: pip install pandas numpy scipy matplotlib seaborn
#
# HOW TO RUN (as participants grow, use separate cells and run only what you need):
#   CHUNK 1: Load data + compute metrics (always run first) → produces keystrokes, stress, metrics_df
#   CHUNK 2: Merge with stress → produces merged
#   CHUNK 3: Correlations (keystroke metrics vs stress) → run when you want associations
#   CHUNK 4: Guide to the statistics (read-only explanation)
#   CHUNK 5: Individual stats (by session → test_type) → set MAX_SESSIONS_TO_PRINT to limit output
#   CHUNK 6: Overall stats (by test_type: p10, mean, p90)
# ---

import os
import pandas as pd
import numpy as np
from scipy import stats

# Limit how many sessions to print in Individual stats (Section 5). Set to None to print all.
MAX_SESSIONS_TO_PRINT = 20

# =============================================================================
# CHUNK 1: LOAD DATA
# =============================================================================
# Paths to your CSV files (Deepnote: files are often under /work/)
KEYSTROKES_FILE = "./keystrokes.csv"
STRESS_FILE = "./stress_workload.csv"

keystrokes = pd.read_csv(KEYSTROKES_FILE)
stress = pd.read_csv(STRESS_FILE)


# Normalize column names (Supabase uses snake_case)
keystrokes.columns = [c.strip().lower() for c in keystrokes.columns]
stress.columns = [c.strip().lower() for c in stress.columns]

# Use correct timestamp column (your DB: pressed_at); handle mixed formats like your first code
ts_col = "pressed_at" if "pressed_at" in keystrokes.columns else "timestamp"
keystrokes["pressed_at"] = pd.to_datetime(keystrokes[ts_col], format="mixed")

# Required: session_id, test_type, event_type, key
for col in ["session_id", "test_type", "event_type", "key"]:
    if col not in keystrokes.columns:
        raise ValueError(f"keystrokes must have column '{col}'")

print("Keystrokes columns:", keystrokes.columns.tolist())
print("Stress columns:", stress.columns.tolist())
print("Loaded", len(keystrokes), "keystroke rows,", len(stress), "stress rows.")


# =============================================================================
# CHUNK 1 (continued): KEYSTROKE METRICS (per session × test_type, plus overall per session)
# =============================================================================

def _agg_row(sid, tt, grp, khd_s, iki_s):
    """Build one aggregate row for a group (used for per-test and per-session overall)."""
    times = grp['pressed_at_ms'].values
    duration_ms = times.max() - times.min() if len(times) >= 2 else 0
    n_events = len(grp)
    n_keydowns = (grp['event_type'] == 'keydown').sum()
    n_backspace = ((grp['event_type'] == 'keydown') & (grp['key'] == 'Backspace')).sum()
    pause_200 = (iki_s > 200).sum() if len(iki_s) else 0
    pause_500 = (iki_s > 500).sum() if len(iki_s) else 0
    return {
        'session_id': sid,
        'test_type': tt,
        'n_events': n_events,
        'n_keydowns': n_keydowns,
        'duration_sec': duration_ms / 1000.0,
        'mean_khd_ms': khd_s.mean() if len(khd_s) else np.nan,
        'sd_khd_ms': khd_s.std() if len(khd_s) else np.nan,
        'cv_khd': khd_s.std() / khd_s.mean() if len(khd_s) and khd_s.mean() > 0 else np.nan,
        'mean_iki_ms': iki_s.mean() if len(iki_s) else np.nan,
        'sd_iki_ms': iki_s.std() if len(iki_s) else np.nan,
        'cv_iki': iki_s.std() / iki_s.mean() if len(iki_s) and iki_s.mean() > 0 else np.nan,
        'pause_count_200ms': pause_200,
        'pause_count_500ms': pause_500,
        'backspace_count': n_backspace,
        'backspace_rate': n_backspace / n_keydowns if n_keydowns else 0,
        'cpm': (n_keydowns - n_backspace) / (duration_ms / 60000) if duration_ms > 0 else np.nan,
    }


def compute_keystroke_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute key hold duration (KHD), inter-key interval (IKI), pauses, and derived stats.
    Returns metrics (1) by session_id and test_type (free, timed, multitasking) and
    (2) by session_id with test_type='overall' (all tests in that session combined).
    df must have: session_id, test_type, pressed_at, event_type, key.
    """
    df = df.sort_values(['session_id', 'test_type', 'pressed_at']).reset_index(drop=True)
    df['pressed_at_ms'] = df['pressed_at'].astype(np.int64) // 10**6

    khd_list = []
    session_test = []
    key_list = []

    for (sid, tt), grp in df.groupby(['session_id', 'test_type']):
        grp = grp.sort_values('pressed_at').reset_index(drop=True)
        keys = grp['key'].values
        times = grp['pressed_at_ms'].values
        evts = grp['event_type'].values
        i = 0
        while i < len(grp) - 1:
            if evts[i] == 'keydown':
                key = keys[i]
                t_down = times[i]
                j = i + 1
                while j < len(grp):
                    if evts[j] == 'keyup' and keys[j] == key:
                        khd_ms = times[j] - t_down
                        if 0 < khd_ms < 2000:
                            khd_list.append(khd_ms)
                            session_test.append((sid, tt))
                            key_list.append(key)
                        break
                    if evts[j] == 'keydown' and keys[j] == key:
                        break
                    j += 1
            i += 1

    iki_list = []
    for (sid, tt), grp in df.groupby(['session_id', 'test_type']):
        grp = grp.sort_values('pressed_at').reset_index(drop=True)
        times = grp['pressed_at_ms'].values
        evts = grp['event_type'].values
        last_keyup_time = None
        for i in range(len(grp)):
            if evts[i] == 'keyup':
                last_keyup_time = times[i]
            elif evts[i] == 'keydown' and last_keyup_time is not None:
                iki_ms = times[i] - last_keyup_time
                if 0 < iki_ms < 5000:
                    iki_list.append((sid, tt, iki_ms))
                last_keyup_time = None

    khd_df = pd.DataFrame({
        'session_id': [x[0] for x in session_test],
        'test_type': [x[1] for x in session_test],
        'khd_ms': khd_list,
        'key': key_list,
    }) if khd_list else pd.DataFrame(columns=['session_id', 'test_type', 'khd_ms', 'key'])

    iki_df = pd.DataFrame(
        [{'session_id': x[0], 'test_type': x[1], 'iki_ms': x[2]} for x in iki_list]
    ) if iki_list else pd.DataFrame(columns=['session_id', 'test_type', 'iki_ms'])

    # --- Per test type (free, timed, multitasking) ---
    agg = []
    for (sid, tt), grp in df.groupby(['session_id', 'test_type']):
        khd_s = khd_df[(khd_df['session_id'] == sid) & (khd_df['test_type'] == tt)]['khd_ms']
        iki_s = iki_df[(iki_df['session_id'] == sid) & (iki_df['test_type'] == tt)]['iki_ms']
        agg.append(_agg_row(sid, tt, grp, khd_s, iki_s))

    # --- Overall per session_id (all tests in that session combined) ---
    for sid in df['session_id'].unique():
        grp_all = df[df['session_id'] == sid].sort_values('pressed_at').reset_index(drop=True)
        keys = grp_all['key'].values
        times = grp_all['pressed_at_ms'].values
        evts = grp_all['event_type'].values
        khd_overall = []
        iki_overall = []
        i = 0
        while i < len(grp_all) - 1:
            if evts[i] == 'keydown':
                key = keys[i]
                t_down = times[i]
                j = i + 1
                while j < len(grp_all):
                    if evts[j] == 'keyup' and keys[j] == key:
                        khd_ms = times[j] - t_down
                        if 0 < khd_ms < 2000:
                            khd_overall.append(khd_ms)
                        break
                    if evts[j] == 'keydown' and keys[j] == key:
                        break
                    j += 1
            i += 1
        last_keyup_time = None
        for i in range(len(grp_all)):
            if evts[i] == 'keyup':
                last_keyup_time = times[i]
            elif evts[i] == 'keydown' and last_keyup_time is not None:
                iki_ms = times[i] - last_keyup_time
                if 0 < iki_ms < 5000:
                    iki_overall.append(iki_ms)
                last_keyup_time = None
        khd_s = pd.Series(khd_overall)
        iki_s = pd.Series(iki_overall)
        agg.append(_agg_row(sid, 'overall', grp_all, khd_s, iki_s))

    return pd.DataFrame(agg)


def compute_keystroke_metrics_by_field(df: pd.DataFrame) -> pd.DataFrame:
    """
    Per-question / per-field metrics.
    One row per (session_id, test_type, field_name), for non-null field_name.
    Uses the same ideas as compute_keystroke_metrics but scoped to each field/question.
    """
    if "field_name" not in df.columns:
        print("No 'field_name' column in keystrokes; skipping per-field metrics.")
        return pd.DataFrame()

    # Ensure we have ms timestamps from CHUNK 1
    if "pressed_at_ms" not in df.columns:
        df = df.copy()
        df["pressed_at_ms"] = df["pressed_at"].astype(np.int64) // 10**6

    # Test-level start times so we can get "hesitation" before a given field starts
    test_start_ms = (
        df.groupby(["session_id", "test_type"])["pressed_at_ms"]
        .min()
        .to_dict()
    )

    rows = []
    # Group by field/question within each session × test_type
    for (sid, tt, field), grp in df.groupby(["session_id", "test_type", "field_name"]):
        # Skip empty / missing field names
        if pd.isna(field) or (isinstance(field, str) and field.strip() == ""):
            continue

        grp = grp.sort_values("pressed_at").reset_index(drop=True)
        times = grp["pressed_at_ms"].values
        evts = grp["event_type"].values
        keys = grp["key"].values

        if len(grp) == 0:
            continue

        # Key-hold durations (KHD) within this field
        khd_vals = []
        i = 0
        while i < len(grp) - 1:
            if evts[i] == "keydown":
                key = keys[i]
                t_down = times[i]
                j = i + 1
                while j < len(grp):
                    if evts[j] == "keyup" and keys[j] == key:
                        khd_ms = times[j] - t_down
                        if 0 < khd_ms < 2000:
                            khd_vals.append(khd_ms)
                        break
                    if evts[j] == "keydown" and keys[j] == key:
                        break
                    j += 1
            i += 1

        # Inter-key intervals (IKI) within this field
        iki_vals = []
        last_keyup_time = None
        for idx in range(len(grp)):
            if evts[idx] == "keyup":
                last_keyup_time = times[idx]
            elif evts[idx] == "keydown" and last_keyup_time is not None:
                iki_ms = times[idx] - last_keyup_time
                if 0 < iki_ms < 5000:
                    iki_vals.append(iki_ms)
                last_keyup_time = None

        duration_ms = times.max() - times.min() if len(times) >= 2 else 0
        n_events = len(grp)
        n_keydowns = (grp["event_type"] == "keydown").sum()
        n_backspace = ((grp["event_type"] == "keydown") & (grp["key"] == "Backspace")).sum()

        iki_arr = np.array(iki_vals) if len(iki_vals) else np.array([])

        pause_200 = (iki_arr > 200).sum() if iki_arr.size else 0
        pause_500 = (iki_arr > 500).sum() if iki_arr.size else 0

        # Hesitation: how long after test start did this field see its first key?
        test_start = test_start_ms.get((sid, tt), times.min())
        first_key_latency_ms = times.min() - test_start

        row = {
            "session_id": sid,
            "test_type": tt,
            "field_name": field,
            "n_events": n_events,
            "n_keydowns": n_keydowns,
            "duration_sec": duration_ms / 1000.0,
            "mean_khd_ms": np.mean(khd_vals) if khd_vals else np.nan,
            "sd_khd_ms": np.std(khd_vals) if khd_vals else np.nan,
            "cv_khd": (np.std(khd_vals) / np.mean(khd_vals)) if khd_vals and np.mean(khd_vals) > 0 else np.nan,
            "mean_iki_ms": iki_arr.mean() if iki_arr.size else np.nan,
            "sd_iki_ms": iki_arr.std() if iki_arr.size else np.nan,
            "cv_iki": (iki_arr.std() / iki_arr.mean()) if iki_arr.size and iki_arr.mean() > 0 else np.nan,
            "pause_count_200ms": pause_200,
            "pause_count_500ms": pause_500,
            "backspace_count": n_backspace,
            "backspace_rate": n_backspace / n_keydowns if n_keydowns else 0,
            "cpm": (n_keydowns - n_backspace) / (duration_ms / 60000) if duration_ms > 0 else np.nan,
            "first_key_latency_ms": first_key_latency_ms,
        }
        rows.append(row)

    if not rows:
        print("No per-field metrics computed (no non-empty field_name values).")
        return pd.DataFrame()

    return pd.DataFrame(rows)


# Run metrics
metrics_df = compute_keystroke_metrics(keystrokes)
print("Keystroke metrics (per session × test_type):")
print(metrics_df.head(10))

per_field_metrics_df = compute_keystroke_metrics_by_field(keystrokes)
if not per_field_metrics_df.empty:
    print("\nPer-field / per-question keystroke metrics (first 20 rows):")
    print(per_field_metrics_df.head(20))

# --- END CHUNK 1. Run this cell first. Then run CHUNK 2, 3, 5, or 6 as needed. ---


# =============================================================================
# CHUNK 2: MERGE WITH STRESS/WORKLOAD
# =============================================================================
stress_cols = ['session_id', 'test_type', 'stress_level', 'mental_demand']
rushed_col = next((c for c in stress.columns if 'rushed' in c.lower()), None)
if rushed_col:
    stress_cols.append(rushed_col)
concentration_col = next((c for c in stress.columns if 'concentration' in c), None)
if concentration_col:
    stress_cols = stress_cols + [concentration_col]
stress_sub = stress[[c for c in stress_cols if c in stress.columns]].copy()
if concentration_col and concentration_col in stress_sub.columns:
    stress_sub['concentration'] = stress_sub[concentration_col]
elif 'concentration' not in stress_sub.columns:
    stress_sub['concentration'] = np.nan

# Left merge: keep all metrics (including test_type='overall'); stress cols are NaN for 'overall'
merged = metrics_df.merge(
    stress_sub,
    on=['session_id', 'test_type'],
    how='left'
)
print("\nMerged (keystroke metrics + stress). test_type='overall' = session total (no stress row).")
print(merged.head(12))

# --- END CHUNK 2. Requires CHUNK 1. ---


# =============================================================================
# CHUNK 3: CORRELATIONS (keystroke metrics vs stress/workload)
# =============================================================================
def safe_corr(x, y):
    mask = ~(x.isna() | y.isna())
    if mask.sum() < 3:
        return np.nan, np.nan
    r, p = stats.pearsonr(x[mask], y[mask])
    return r, p

outcomes = [c for c in ['stress_level', 'mental_demand', 'rushed_feeling', 'rushed_feel', 'concentration', 'concentration_difficulty'] if c in merged.columns]
outcomes = list(dict.fromkeys(outcomes))  # keep order, no dupes
predictors = ['mean_iki_ms', 'sd_iki_ms', 'mean_khd_ms', 'sd_khd_ms', 'cv_iki', 'cv_khd', 'pause_count_500ms', 'backspace_rate', 'cpm']

# Correlations only for per-test rows (stress is reported per test, not for 'overall')
merged_per_test = merged[merged['test_type'] != 'overall']
print("\n--- Correlations (r, p-value) with stress/workload [per-test only] ---")
for out in outcomes:
    if out not in merged_per_test.columns:
        continue
    print(f"\n{out}:")
    for pred in predictors:
        if pred not in merged_per_test.columns:
            continue
        r, p = safe_corr(merged_per_test[pred], merged_per_test[out])
        print(f"  {pred}: r = {r:.3f}, p = {p:.4f}")

# --- END CHUNK 3. Requires CHUNK 1 and 2. ---


# =============================================================================
# CHUNK 4: GUIDE TO THE STATISTICS (what the tables above mean)
# =============================================================================
_guide = """
BEFORE INDIVIDUAL STATS, YOU GET:

1) KEYSTROKE METRICS (per session × test_type)
   - What it is: One row per (session_id, test_type). Each row = one participant doing one test
     (e.g. free, timed, multitasking), with computed keystroke metrics for that test only.
   - Columns: mean_khd_ms (key hold duration), mean_iki_ms (gap between keys), sd_iki_ms/cv_iki
     (variability), pause_count_200ms/500ms (long gaps), backspace_rate, cpm (typing speed), etc.
   - What it refers to: How that person typed during that specific test.
   - What you can deduce: Compare rows across test_type (e.g. same session: free vs timed) to see
     if typing got slower or more variable under timed/multitasking. No stress yet—just keystrokes.

2) MERGED (keystroke metrics + stress)
   - What it is: metrics_df joined with stress_workload on (session_id, test_type). So each row
     has keystroke metrics + self-reported stress (stress_level, mental_demand, etc.) for that test.
   - Duplicates: If you see the same (session_id, test_type) twice with different stress values,
     it means that participant submitted the stress form more than once for that test (e.g. two
     submissions). You may want to keep one per (session_id, test_type) (e.g. latest) to avoid
     double-counting in correlations.
   - What you can deduce: Which keystroke patterns co-occur with higher/lower stress (descriptive).
   - test_type='overall' rows have no stress (stress is per test); they’re for session-level
     keystroke summary only.

3) CORRELATIONS (r, p-value)
   - What it is: Pearson r between each keystroke metric and each stress outcome, using per-test
     rows only (one row per session per test, stress reported per test).
   - r: Strength and direction (-1 to +1). e.g. cv_iki vs stress_level r=0.64 → more variable
     typing tends to go with higher stress. Negative r (e.g. cpm vs stress) → faster typing
     tends to go with lower stress.
   - p-value: Probability that such an r would appear by chance if there were no real association.
     p < 0.05 often used as “significant”; e.g. cv_iki vs stress_level p=0.008 suggests the
     association is unlikely due to chance.
   - What you can deduce: Which keystroke metrics are promising candidates to predict or reflect
     stress (e.g. cv_iki, cpm). Not causation—just association. With few participants (e.g. n=16
     stress rows), results can be unstable; interpret with caution until you have more data.
   - Is it effective? Correlations are a simple, effective first step to see which metrics
     relate to stress. For formal inference (confidence intervals, regression) you’d add more
     analysis later.
"""
print(_guide)

# --- END CHUNK 4. Run anytime to re-read the guide. ---

# =============================================================================
# CHUNK 5: INDIVIDUAL STATS (by session_id → test_type → metrics). Limit output with MAX_SESSIONS_TO_PRINT
# =============================================================================
metric_cols = [
    'n_events', 'n_keydowns', 'duration_sec',
    'mean_khd_ms', 'sd_khd_ms', 'cv_khd',
    'mean_iki_ms', 'sd_iki_ms', 'cv_iki',
    'pause_count_200ms', 'pause_count_500ms',
    'backspace_count', 'backspace_rate', 'cpm',
]
stress_cols_display = ['stress_level', 'mental_demand', 'rushed_feeling', 'concentration_difficulty']
display_cols = [c for c in metric_cols if c in metrics_df.columns]

session_ids = merged['session_id'].unique()
if MAX_SESSIONS_TO_PRINT is not None:
    session_ids = session_ids[:MAX_SESSIONS_TO_PRINT]
    print(f"\n(Showing first {len(session_ids)} sessions; set MAX_SESSIONS_TO_PRINT = None to show all.)")
print("\n" + "=" * 60)
print("INDIVIDUAL STATS (by session_id → test_type → metrics)")
print("=" * 60)
for sid in session_ids:
    sess = merged[merged['session_id'] == sid]
    # Show session total row once (short id)
    sid_short = str(sid)[:8] + "..." if len(str(sid)) > 8 else sid
    print(f"\nsession_id: {sid_short}")
    for _, row in sess.iterrows():
        tt = row['test_type']
        print(f"  test_type: {tt}")
        for col in display_cols:
            val = row.get(col, np.nan)
            if pd.isna(val):
                continue
            if isinstance(val, (int, np.integer)):
                print(f"    {col}: {val}")
            else:
                print(f"    {col}: {val:.2f}")
        for col in stress_cols_display:
            if col in row.index and pd.notna(row.get(col)):
                print(f"    {col}: {row[col]}")
    print()

# --- END CHUNK 5. Requires CHUNK 1 and 2. Increase MAX_SESSIONS_TO_PRINT or set None for full list. ---


# =============================================================================
# CHUNK 6: OVERALL STATS (by test_type: 10th %ile, mean, 90th %ile)
# =============================================================================
numeric_metrics = [
    'mean_khd_ms', 'sd_khd_ms', 'cv_khd',
    'mean_iki_ms', 'sd_iki_ms', 'cv_iki',
    'pause_count_200ms', 'pause_count_500ms',
    'backspace_rate', 'cpm', 'duration_sec', 'n_keydowns',
]
numeric_metrics = [c for c in numeric_metrics if c in metrics_df.columns]

overall_stats = []
for tt in metrics_df['test_type'].unique():
    m = metrics_df[metrics_df['test_type'] == tt]
    for col in numeric_metrics:
        overall_stats.append({
            'test_type': tt,
            'metric': col,
            'p10': m[col].quantile(0.10),
            'mean': m[col].mean(),
            'p90': m[col].quantile(0.90),
        })

overall_df = pd.DataFrame(overall_stats)
print("\n" + "=" * 60)
print("OVERALL STATS (by test_type: 10th %ile, mean, 90th %ile)")
print("=" * 60)
for tt in overall_df['test_type'].unique():
    t = overall_df[overall_df['test_type'] == tt]
    print(f"\n--- {tt} (n = {len(metrics_df[metrics_df['test_type'] == tt])} sessions) ---")
    for _, row in t.iterrows():
        print(f"  {row['metric']}: p10 = {row['p10']:.2f}, mean = {row['mean']:.2f}, p90 = {row['p90']:.2f}")

# --- END CHUNK 6. Requires CHUNK 1. ---


# =============================================================================
# CHUNK 7: PER-FIELD / PER-QUESTION STATS (across all users)
# =============================================================================
# This chunk summarises per-field metrics (from per_field_metrics_df) across all sessions,
# grouped by test_type and field_name. It lets you see which question types tend to be
# slower, more variable, or more error-prone across the whole dataset.

if "per_field_metrics_df" in globals() and not per_field_metrics_df.empty:
    field_numeric_metrics = [
        "mean_khd_ms", "sd_khd_ms", "cv_khd",
        "mean_iki_ms", "sd_iki_ms", "cv_iki",
        "pause_count_200ms", "pause_count_500ms",
        "backspace_rate", "cpm",
        "first_key_latency_ms",
    ]
    field_numeric_metrics = [c for c in field_numeric_metrics if c in per_field_metrics_df.columns]

    field_stats_rows = []
    for (tt, fname), grp in per_field_metrics_df.groupby(["test_type", "field_name"]):
        for col in field_numeric_metrics:
            vals = grp[col].dropna()
            if vals.empty:
                continue
            field_stats_rows.append({
                "test_type": tt,
                "field_name": fname,
                "metric": col,
                "p10": vals.quantile(0.10),
                "mean": vals.mean(),
                "p90": vals.quantile(0.90),
                "n_rows": len(vals),
            })

    if field_stats_rows:
        field_stats_df = pd.DataFrame(field_stats_rows)
        print("\n" + "=" * 60)
        print("PER-FIELD / PER-QUESTION STATS (across all sessions)")
        print("=" * 60)
        for (tt, fname), grp in field_stats_df.groupby(["test_type", "field_name"]):
            fname_disp = fname if isinstance(fname, str) else str(fname)
            print(f"\n--- test_type = {tt}, field_name = {fname_disp} ---")
            for _, row in grp.iterrows():
                print(
                    f"  {row['metric']}: "
                    f"p10 = {row['p10']:.2f}, "
                    f"mean = {row['mean']:.2f}, "
                    f"p90 = {row['p90']:.2f} "
                    f"(n = {int(row['n_rows'])})"
                )
    else:
        print("\nNo numeric per-field metrics to summarise in CHUNK 7.")
else:
    print("\nper_field_metrics_df not available or empty; run CHUNK 1 first to build it.")


# =============================================================================
# OPTIONAL: SIMPLE VISUALIZATIONS (uncomment if you have matplotlib/seaborn)
# =============================================================================
# import matplotlib.pyplot as plt
# import seaborn as sns
#
# fig, axes = plt.subplots(2, 2, figsize=(10, 8))
# sns.boxplot(data=merged, x='test_type', y='mean_iki_ms', ax=axes[0,0])
# axes[0,0].set_title('Mean IKI by test type')
# sns.boxplot(data=merged, x='test_type', y='stress_level', ax=axes[0,1])
# axes[0,1].set_title('Stress level by test type')
# sns.scatterplot(data=merged, x='mean_iki_ms', y='stress_level', hue='test_type', ax=axes[1,0])
# axes[1,0].set_title('Stress vs Mean IKI')
# sns.scatterplot(data=merged, x='sd_iki_ms', y='rushed_feel', hue='test_type', ax=axes[1,1])
# axes[1,1].set_title('Rushed feel vs IKI variability')
# plt.tight_layout()
# plt.show()


# =============================================================================
# METRICS REFERENCE & ADDITIONAL METRICS TO COLLECT
# =============================================================================
"""
KEYSTROKE METRICS USED:
- mean_khd_ms, sd_khd_ms, cv_khd: key hold duration (keydown→keyup). Stress often ↑ variability.
- mean_iki_ms, sd_iki_ms, cv_iki: inter-key interval (keyup→next keydown). Stress can ↑ mean or ↑ variability.
- pause_count_200ms, pause_count_500ms: number of long gaps. More pauses can indicate hesitation/stress.
- backspace_rate: corrections. Often ↑ under stress.
- cpm: characters per minute (approx). Can ↓ under stress or show more variability.

ADDITIONAL METRICS YOU COULD COLLECT (app or DB):
- Per-field breakdown: aggregate by field_name to see which tasks (e.g. transcription vs open-ended) show most stress.
- First-key latency: time from focus/display to first keydown in a field (hesitation).
- Key repeat rate: same key keydown twice without keyup (long hold).
- Mouse/touch: time to first click, click latency (if you add mouse tracking).
- Baseline vs task: compare free-typing (baseline) to timed/multitasking within same session_id.
- Time-of-day / sleep / caffeine from consent_data: join on session_id for covariates.
"""
