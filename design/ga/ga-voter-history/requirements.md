# Requests for Participation Score Algorithm

The goal is to load https://mvp.sos.ga.gov/s/voter-history-files - Voter History Data files into a Postgres database.

Afterwards, we will write instruct the VoterAI to generate queries that connects that will join the voter-history tables with the voter registration tables.

This data will be used by the VoterAI agent to run NLP-Query pipeline to answer relevant questions about voter participation data.

## Schema creation
Using the structure defined in the Voter History File Layout https://mvp.sos.ga.gov/s/voter-history-files, we will create the database tables.

Taken from the page.

| Column | Data                     | Length | Column Name          | Data Type      | Notes                                                                                                                                                                                                                                                            |
| :----- | :----------------------- | :----- | :------------------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | County Name (from CSV)   | -      | `county_name`        | `VARCHAR`      | Maps to CSV column "County Name". Used to lookup `county_code`.                                                                                                                                                                                                  |
| 1      | County Number            | 3      | `county_code`        | `VARCHAR(3)`   | Derived via lookup from `county_name` using `lib/voter/query/voter-lookup-values/county_code.ts`. Standard 3-digit FIPS code (e.g., 001, 275). Source: https://www2.census.gov/programs-surveys/decennial/2010/partners/pdf/FIPS_StateCounty_Code.pdf |
| 2      | Registration Number      | 8      | `registration_number`| `VARCHAR(8)`   | Maps to CSV column "Voter Registration Number".                                                                                                                                                                                                                  |
| 3      | Election Date            | 8      | `election_date`      | `DATE`         | Maps to CSV column "Election Date". Format MM/DD/YYYY.                                                                                                                                                                                                           |
| 4      | Election Type            | -      | `election_type`      | `VARCHAR`      | Maps to CSV column "Election Type".                                                                                                                                                                                                                              |
| 5      | Party                    | -      | `party`              | `VARCHAR`      | Maps to CSV column "Party".                                                                                                                                                                                                                                      |
| 6      | Ballot Style             | -      | `ballot_style`       | `VARCHAR`      | Maps to CSV column "Ballot Style". Added based on CSV header.                                                                                                                                                                                                    |
| 7      | Absentee Flag            | 1      | `absentee`           | `VARCHAR(1)`   | Maps to CSV column "Absentee". Stores 'Y' or 'N'.                                                                                                                                                                                                                |
| 8      | Provisional Flag         | 1      | `provisional`        | `VARCHAR(1)`   | Maps to CSV column "Provisional". Stores 'Y' or 'N'.                                                                                                                                                                                                             |
| 9      | Supplemental Flag        | 1      | `supplemental`       | `VARCHAR(1)`   | Maps to CSV column "Supplemental". Stores 'Y' or 'N'.                                                                                                                                                                                                            |

1. Create a migration script under `lib\ga-voter-history\migrations` to create the `GA_VOTER_HISTORY` database table using the schema defined above.
    * Include `created_at` and `updated_at` timestamp columns (`TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`).
    * **Unique Constraint:** Create a unique constraint on the combination of `registration_number` and `election_date`.
    * This script will run as an external task.

2. Create an ETL script/process to load all CSV files from the `lib\ga-voter-history\data` folder into the `GA_VOTER_HISTORY` table.
    * **ETL Inspiration:** Thoroughly review the existing ETL code in `lib\voter` for patterns related to CSV parsing, batching, database insertion/updates (upserts), and error handling in Node.js. Reuse relevant logic and structures.
    * **CSV Handling:**
        * Assume all CSVs have a header row identical to the sample provided and skip it during processing.
        * Map CSV columns to database columns as indicated in the schema table notes.
    * **County Code Lookup:** For each row, use the `county_name` from the CSV to look up the corresponding `county_code` using the mapping defined in `lib\voter\query\voter-lookup-values\county_code.ts`. Store both `county_name` (from CSV) and the derived `county_code` in the database.
    * **Data Transformation:**
        * Parse the `election_date` (MM/DD/YYYY) into the `DATE` format expected by PostgreSQL.
        * Store the 'Y'/'N' flags directly into the `absentee`, `provisional`, and `supplemental` columns (`VARCHAR(1)`).
    * **Batching & Upserts:** Load data in batches of 500 rows. Use an "upsert" mechanism (insert or update on conflict) based on the unique constraint (`registration_number`, `election_date`) to handle frequently updated source files.

## Loading rules
We are to make sure the script and insert and update existing records in batches to speed up insert.  These voter files are updated frequently so our code will need to adapt.