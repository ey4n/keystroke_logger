# Keystroke stress analysis

## Metrics computed

| Metric | Definition | Why it matters for stress |
|--------|------------|---------------------------|
| **Key hold duration (KHD)** | Time from keydown to keyup (same key) | Longer or more variable hold times often indicate hesitation or tension. |
| **Inter-key interval (IKI)** | Time from keyup of one key to keydown of the next | Slower or more variable IKI can reflect cognitive load or stress. |
| **KHD/IKI variability (SD, CV)** | Standard deviation and coefficient of variation | Stress often increases variability more than mean. |
| **Pause count** | Number of gaps > 200 ms or > 500 ms between keystrokes | More/longer pauses can indicate hesitation or distraction. |
| **Backspace rate** | Backspace keydowns / total keydowns | Higher correction rate often associated with stress or uncertainty. |
| **CPM** | (Keydowns − backspaces) / (duration in minutes) | Approximate typing speed; can drop or become more variable under stress. |

## Data needed

- **keystrokes**: `session_id`, `test_type`, `pressed_at`, `event_type` (keydown/keyup), `key`
- **stress_workload**: `session_id`, `test_type`, `stress_level`, `mental_demand`, `rushed_feel`, (concentration column)

## Export from Supabase

1. **keystrokes**: Table Editor → keystrokes → Export as CSV.
2. **stress_workload**: Table Editor → stress_workload → Export as CSV.

Save as `keystrokes.csv` and `stress_workload.csv` in the `analysis/` folder (or set paths in the script).

## Run in Jupyter

1. `pip install pandas numpy scipy matplotlib seaborn`
2. Open `keystroke_stress_analysis.py` in Jupyter (or copy cells into a notebook).
3. Set CSV paths in section 1 (or use Supabase client).
4. Run all cells.

## Optional: load directly from Supabase in Python

```python
import os
from supabase import create_client
import pandas as pd

url = os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY", "YOUR_ANON_KEY")
client = create_client(url, key)

keystrokes = pd.DataFrame(client.table("keystrokes").select("*").execute().data)
stress = pd.DataFrame(client.table("stress_workload").select("*").execute().data)
keystrokes["pressed_at"] = pd.to_datetime(keystrokes["pressed_at"])
```

## Other metrics you could collect (future)

- **Per-field metrics**: Aggregate by `field_name` (e.g. transcription vs open-ended) to see which tasks correlate most with stress.
- **First-key latency**: Time from field focus (or question shown) to first keydown in that field.
- **Consent/covariates**: Join with `consent_data` on `session_id` for time_of_day, sleep, caffeine, mood_baseline.
- **Within-session baseline**: Compare free-typing (baseline) vs timed/multitasking for the same `session_id`.
