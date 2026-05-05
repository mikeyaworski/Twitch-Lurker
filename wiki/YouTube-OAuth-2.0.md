# Create OAuth 2.0 Credentials

These are a list of steps to get a client ID and client secret which lets you sign into your YouTube account on Twitch Lurker. This is free, easy to do and only needs to be done once. If you do not feel comfortable storing your client secret unencrypted on your local computer, then do not use this method.

1. Go to https://console.cloud.google.com.
1. Sign in or select whatever account you would like. Billing information will not be required, so it can be any Google account.
1. Go to https://console.cloud.google.com/apis/credentials and create a test project (or use an existing one).
1. Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com and enable this API.
1. Go to https://console.cloud.google.com/apis/credentials/consent.
    1. The UI has changed here over the years, but generally you want to create an "External" application and go through the process for that.
1. Go to https://console.cloud.google.com/auth/audience.
    1. Add test users. Enter the email addresses of the YouTube accounts you will be logging in with on Twitch Lurker.
1. Go to https://console.cloud.google.com/auth/overview.
    1. Click "Create OAuth Client".
    1. Set Application type to "Web application".
    1. Name it whatever you wish.
    1. Under "Authorized redirect URIs", add the following two (one is for Chromium browsers and the other is for Firefox):
        - `https://fkjghajhfjamfjcmdkbangbeogbagnjf.chromiumapp.org/`
        - `https://b509854f7aa0b39f10edd018047ebfda80d81c5c.extensions.allizom.org/`
    1. Copy the "Client ID" and "Client Secret" values and enter these into Twitch Lurker.
