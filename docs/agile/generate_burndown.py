"""Generate docs/agile/burndown_chart.png from the sprint burndown tables.

Run:  python docs/agile/generate_burndown.py
Requires: pip install matplotlib
"""

from pathlib import Path

import matplotlib.pyplot as plt

SPRINT_DATA = {
    "Sprint 2 - Speech-to-Text & Virtual Assistant": {
        "ideal": [22, 19, 17, 14, 11, 8, 5, 0],
        "actual": [22, 21, 18, 15, 13, 9, 5, 0],
    },
    "Sprint 3 - Testing & Finalization": {
        "ideal": [16, 14, 12, 10, 8, 6, 3, 0],
        "actual": [16, 15, 13, 11, 9, 7, 4, 0],
    },
}

OUTPUT = Path(__file__).resolve().parent / "burndown_chart.png"


def main() -> None:
    days = list(range(1, 9))
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    for ax, (title, data) in zip(axes, SPRINT_DATA.items()):
        ax.plot(days, data["ideal"], linestyle="--", marker="o", color="#94a3b8", label="Ideal")
        ax.plot(days, data["actual"], linestyle="-", marker="s", color="#4f46e5", label="Actual")
        ax.set_title(title, fontsize=11, fontweight="bold")
        ax.set_xlabel("Working Day")
        ax.set_ylabel("Remaining Story Points")
        ax.set_xticks(days)
        ax.set_ylim(0, max(data["ideal"]) + 3)
        ax.grid(True, linestyle=":", alpha=0.6)
        ax.legend()

    fig.suptitle("Sprint Burndown Chart", fontsize=14, fontweight="bold")
    fig.tight_layout(rect=(0, 0, 1, 0.95))
    fig.savefig(OUTPUT, dpi=150)
    print(f"Saved {OUTPUT}")


if __name__ == "__main__":
    main()
