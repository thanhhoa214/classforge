# projectDataLoader
Data loading for Final Project

# 1. Docker compose up
main..py python file already have function for initial loading data file.
    This file will be run directly when using docker compose up and will add data to the neo4j docker database

# 2. Incase of data already reside inside neo4j database.
 Please run the following command on neo4j query to delete all the data
`
    MATCH (n)
    DETACH DELETE n
`

# 3. What data will be loaded?
1. Initila data file in dataloading/data/test_data_load.xslx
2. 3 files resemble agent output data in dataloading/data/test_df folder

