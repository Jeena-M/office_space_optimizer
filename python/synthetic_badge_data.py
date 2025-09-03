# synthetic_badge_data.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Parameters
num_employees = 20
start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 8, 1)

employees = [f"E-{i+1:03d}" for i in range(num_employees)]
departments = ["Engineering", "HR", "Marketing", "Sales", "Finance"]
desk_codes = [f"D-{i+1:02d}" for i in range(num_employees)]

dates = pd.date_range(start_date, end_date)

data = []
for emp_id, desk_code in zip(employees, desk_codes):
    dept = random.choice(departments)
    # Random attendance probability for employee
    prob = random.uniform(0.2, 0.9)  # Some mostly remote, some mostly in-person
    for date in dates:
        if np.random.rand() < prob:
            data.append([emp_id, desk_code, date.strftime("%Y-%m-%d"), dept])

df = pd.DataFrame(data, columns=["employee_id", "desk_code", "date", "department"])
df.to_csv("synthetic_badge_data.csv", index=False)
print("Synthetic badge data saved to synthetic_badge_data.csv")
