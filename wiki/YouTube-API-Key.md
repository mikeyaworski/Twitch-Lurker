# Obtain a YouTube API key

## Required Steps

1. Go to https://console.cloud.google.com.
1. Sign in or select whatever account you would like. Billing information will not be required, so it can be any Google account.
1. Go to https://console.cloud.google.com/apis/credentials and create a test project (or use an existing one).
1. Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com and click "Enable" (this enables the YouTube Data API v3).
1. Go back to https://console.cloud.google.com/apis/credentials, click "Create Credentials" and select "API Key".
    1. Fill out the "Name" field
    1. Under "Select API Restrictions", select only "YouTube Data API v3"
    1. Click "Create"
1. Copy the value and enter this into Twitch Lurker.

## Optional Steps

If you would like to restrict usage on your API key to only the functionality required for Twitch Lurker, you can follow the steps below.

1. Go to Edit the API key at https://console.cloud.google.com/apis/credentials by clicking on the API key name, or "Edit API Key" under "Actions".
1. This should already be done, but if not, ensure that under "Selected APIs", the only API selected is "YouTube Data API v3".
1. Under "Application restrictions", select "Websites".
1. Click "Add" to add a website. For the value, it depends on which browser you are using. Use the following value depending on your browser (or just add all of them to be flexible):
    - Chrome:
      ```
      chrome-extension://fkjghajhfjamfjcmdkbangbeogbagnjf
      ```
    - Edge:
      ```
      extension://fkjghajhfjamfjcmdkbangbeogbagnjf
      ```
    - Firefox:
      
      You will need to find the addon's internal UUID (unique to every installation, so I cannot generalize it here for you).
      
      You can find it at `about:debugging#/runtime/this-firefox`. Look for Twitch Lurker and copy the "Internal UUID".
      ```
      moz-extension://...
      ```
      Example:
      ```
      moz-extension://16d79fb8-833d-4010-ba40-e3f44269606a
      ```
2. Click save.
