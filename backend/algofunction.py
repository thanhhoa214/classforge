from algorithm.execution import execute_algorithm
from dataloading.api import DB
from dataloading.dataloader import DataLoader


def run_algorithm(save_data = True):
    db = DB()
    db.connect('dataloading/db.env')
    loaded_rela = ['net_0_friends', 'net_1_influential', 'net_2_feedback', 'net_3_moretime','net_4_advice', 'net_5_disrespect', 'net_affiliation']
    loaded_sheet = ["participants", "affiliations", "survey_data"]
    dl = DataLoader(db, folder = 'data',loaded_sheet = loaded_sheet
                    , loaded_relationship= loaded_rela)

    df_output_dict = dl.get_data_from_survey()

    df_SNA, Y_pred_df, predicted_link_df = execute_algorithm(df_output_dict, False, False)

    df_SNA["Participant_ID"] = df_SNA.index
    Y_pred_df["Participant_ID"] = Y_pred_df.index

    push_data_dict = {
        "df": df_SNA,
        "Y_pred_df": Y_pred_df,
        "predicted_links": predicted_link_df
    }

    if save_data:
        dl.create_agent_data(push_data_dict)

if __name__ == "__main__":
    run_algorithm()