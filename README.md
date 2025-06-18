# Nameless Lab

This repository contains a simple script to analyze Amazon order history CSV or ZIP files.

## Usage

1. Install dependencies (requires Python 3.11+):
   ```bash
   pip install pandas
   ```
2. Run the script with your order history file:
   ```bash
   python amazon_order_analysis.py path/to/Your\ Orders.zip
   ```
   The script also accepts plain CSV files.

The script prints a preview of the cleaned data and a monthly spending summary.
