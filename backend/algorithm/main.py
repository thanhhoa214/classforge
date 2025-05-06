from execution import execute_algorithm
from concurrent.futures import ThreadPoolExecutor
from algorithm.utils import set_seed
set_seed(42)
def main():
    file_name = 'test_data_1.xlsx'

    print("Starting algorithm execution...")
    with ThreadPoolExecutor() as executor:
        executor.submit(execute_algorithm, file_name)
        print("Algorithm executed successfully.")
    
if __name__ == "__main__":
    main()
