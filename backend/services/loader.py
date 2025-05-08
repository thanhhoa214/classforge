from fastapi import Depends
from .db import get_db
from dataloading.dataloader import DataLoader
from typing import Optional

_loader:  Optional[DataLoader] = None

def get_loader() -> DataLoader:
    global _loader
    if _loader is None:
        db = get_db()
        loaded_rela = ['net_0_friends', 'net_1_influential', 'net_2_feedback', 'net_3_moretime','net_4_advice', 'net_5_disrespect', 'net_affiliation']
        loaded_sheet = ["participants", "affiliations", "survey_data"]
        _loader = DataLoader(db, folder = 'data',loaded_sheet = loaded_sheet
                             , loaded_relationship= loaded_rela)
    return _loader