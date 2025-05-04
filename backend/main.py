from dataloading.api import *
from dataloading.dataloader import DataLoader

def main():
    db = DB()
    db.connect('dataloading/db.env')
    loaded_rela = ['net_0_friends', 'net_1_influential', 'net_2_feedback', 'net_3_moretime','net_4_advice', 'net_5_disrespect', 'net_affiliation']
    loaded_sheet = ["participants", "affiliations", "survey_data"]
    # loaded_sheet2 = ["responses"]
    dl = DataLoader(db, folder = 'data',loaded_sheet = loaded_sheet
                    , loaded_relationship= loaded_rela)
    df = dl.load_test_data("Student Survey - Jan.xlsx")
    dl.agent_sample_load()
    
if __name__ == "__main__":
    main()
