import psutil
import time

def bytes_to_gb(value):
    return round(value / (1024 ** 3), 2)

while True:
    # Physical RAM
    mem = psutil.virtual_memory()
    # Swap / Virtual Memory
    swap = psutil.swap_memory()

    print(f"RAM Used: {bytes_to_gb(mem.used)} GB / {bytes_to_gb(mem.total)} GB "
          f"({mem.percent}%) | "
          f"Swap Used: {bytes_to_gb(swap.used)} GB / {bytes_to_gb(swap.total)} GB "
          f"({swap.percent}%)")

    time.sleep(5)  # refresh every 5 seconds
