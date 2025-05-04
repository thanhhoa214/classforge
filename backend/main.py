from dataloading.api import *
from dataloading.dataloader import DataLoader

def main():
    db = DB()
    db.connect('db.env')
    loaded_rela = ['net_0_friends', 'net_1_influential', 'net_2_feedback', 'net_3_moretime','net_4_advice', 'net_5_disrespect', 'net_affiliation_0_schoolactivit']
    loaded_sheet = ["participants", "affiliations", "survey_data"]
    # loaded_sheet2 = ["responses"]
    dl = DataLoader(db, folder = 'data',loaded_sheet = loaded_sheet
                    , loaded_relationship= loaded_rela)
    df = dl.load_test_data("test_data_load.xlsx")

    
if __name__ == "__main__":
    main()
