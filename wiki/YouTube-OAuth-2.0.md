# Create OAuth 2.0 Credentials

These are a list of steps to get a client ID and client secret which lets you sign into your YouTube account on Twitch Lurker. This is free, easy to do and only needs to be done once. If you do not feel comfortable storing your client secret unencrypted on your local computer, then do not use this method.

1. Go to https://console.cloud.google.com.
1. Sign in or select whatever account you would like. Billing information will not be required, so it can be any Google account.
1. Go to https://console.cloud.google.com/apis/credentials and create a test project (or use an existing one).
1. Go to https://console.cloud.google.com/apis/credentials/consent.
    1. Select "External" and click "Create".
    1. Enter the required fields marked with an asterisk, using whatever values you wish. Click "Save and Continue".
    1. On the Scopes screen, you can skip all inputs and just click "Save and Continue".
    1. On the Test users screen, add the email of the YouTube account you will be connecting. Save and Continue. Then click "Back to Dashboard".
1. Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com and enable this API.
1. Go to https://console.cloud.google.com/apis/credentials.
    1. Click "Create Credentials" and select "OAuth client ID".
    1. Set Application type to "Web application".
    1. Name it whatever you wish.
    1. Under "Authorized redirect URIs", add the following two (one is for Chromium browsers and the other is for Firefox):
        - `https://fkjghajhfjamfjcmdkbangbeogbagnjf.chromiumapp.org/`
        - `https://b509854f7aa0b39f10edd018047ebfda80d81c5c.extensions.allizom.org/`
    1. Copy the "Client ID" and "Client Secret" values and enter these into Twitch Lurker.
