# Obtain a YouTube API key

## Required Steps

1. Go to https://console.cloud.google.com.
1. Sign in or select whatever account you would like. Billing information will not be required, so it can be any Google account.
1. Go to https://console.cloud.google.com/apis/credentials and create a test project (or use an existing one).
1. After creating the test project, click "Create Credentials" and select "API Key". If you got lost after creating the test project, just revisit the URL https://console.cloud.google.com/apis/credentials.
1. Copy the value and enter this into Twitch Lurker.
1. Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com and enable this API.

## Optional Steps

If you would like to restrict usage on your API key to only the functionality required for Twitch Lurker, you can follow the steps below.

1. Go to "Edit" the API key. You can click the prompt on the modal that appears when you create the API key, or you can click the three dots under "Actions" beside your API key at https://console.cloud.google.com/apis/credentials.
1. Under "API Restrictions", select "Restrict key" and then select "YouTube Data API v3" as the only API.
1. Under "Set an application restriction", select "Websites".
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
      ```
      moz-extension://16d79fb8-833d-4010-ba40-e3f44269606a
      ```
1. Click save.
