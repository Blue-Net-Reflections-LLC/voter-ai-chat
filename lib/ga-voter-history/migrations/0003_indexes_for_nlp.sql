        CREATE INDEX idx_ga_hist_type_reg_date 
        ON GA_VOTER_HISTORY (election_type, registration_number, election_date); 

        