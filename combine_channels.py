# This tool combines the .csv output from nuclearFociCounter. For example, if there are 10 micrographs, the output from each micrograph is combined into one file.
# Input: CSV files containing foci and GFP results
# Output: Merged CSV

import pandas as pd
import glob

# Step 1: Collect all the file paths for each category
rpa_files = glob.glob(r'path_to_foci_results\*RPA_foci_results.csv')
rad51_files = glob.glob(r'path_to_foci_results\*RAD51_foci_results.csv')
gfp_files = glob.glob(r'path_to_foci_results\*GFP_Status_results.csv')

# Step 2: Function to read, combine, and number files, then rename columns
def combine_files(file_list, label):
    combined_df = pd.DataFrame()
    
    for i, file in enumerate(file_list):
        df = pd.read_csv(file)
        # Rename the columns with appropriate labels
        df.rename(columns={
            'Slice': f'{label}-Slice',
            'Count': f'{label}-Count',
            'Total Area': f'{label}-Total Area',
            'Average Size': f'{label}-Average Size',
            '%Area': f'{label}-%Area'
        }, inplace=True)
        df[f'{label}-Slice'] = [f'{label}-{str(j+1).zfill(3)}' for j in range(len(df))]
        df['Source_File'] = file.split('/')[-1]  # Add filename column
        combined_df = pd.concat([combined_df, df], ignore_index=True)
    
    return combined_df

# Step 3: Combine all files in each category
rpa_combined = combine_files(rpa_files, 'RPA')
rad51_combined = combine_files(rad51_files, 'RAD51')
gfp_combined = combine_files(gfp_files, 'GFP')

# Step 4: Merge the combined DataFrames from each category
merged_df = pd.concat([gfp_combined, rpa_combined, rad51_combined], axis=1)

# Export the merged dataframe to a CSV file with appropriate column headers
merged_df.to_csv(r'path_to_foci_results\final_merged_table.csv', index=False)

# Extract rows where GFP-Count is 1
gfp_count_1 = merged_df[merged_df['GFP-Count'] == 1]

# Extract rows where GFP-Count is 0
gfp_count_0 = merged_df[merged_df['GFP-Count'] == 0]

# Save the extracted data to separate CSV files
gfp_count_1.to_csv(r'path_to_foci_results\gfp_count_1.csv', index=False)
gfp_count_0.to_csv(r'path_to_foci_results\gfp_count_0.csv', index=False)

# Display the first few rows of the merged dataframe
print(merged_df.head())