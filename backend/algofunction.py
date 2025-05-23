from algorithm.execution import execute_algorithm
from algorithm.exe_academic import execute_academic_algorithm
from algorithm.exe_mental import execute_mental_algorithm
from algorithm.exe_social import execute_social_algorithm
from dataloading.api import DB
from dataloading.dataloader import DataLoader
from services.db import get_db
from services.loader import get_loader


def run_algorithm(option = "balanced", save_data = True):
    dl = get_loader()

    df_output_dict = dl.get_data_from_survey()

    if option == "academic":
        df_SNA, Y_pred_df, predicted_link_df = execute_academic_algorithm(df_output_dict, False, False)
    elif option == "mental":
        df_SNA, Y_pred_df, predicted_link_df = execute_mental_algorithm(df_output_dict, False, False)
    elif option == "social":
        df_SNA, Y_pred_df, predicted_link_df = execute_social_algorithm(df_output_dict, False, False)
    else:
        df_SNA, Y_pred_df, predicted_link_df = execute_algorithm(df_output_dict, False, False)
    df_SNA["Participant_ID"] = df_SNA.index
    Y_pred_df["Participant_ID"] = Y_pred_df.index

    push_data_dict = {
        "df": df_SNA,
        "Y_pred_df": Y_pred_df,
        "predicted_links": predicted_link_df
    }

    if save_data:
        last_run_id = dl.create_agent_data(push_data_dict)
        dl.update_last_process_run(process_run_id=last_run_id)
        return last_run_id
    
    return None


if __name__ == "__main__":
    pass
    # run_algorithm(save_data=False)
    