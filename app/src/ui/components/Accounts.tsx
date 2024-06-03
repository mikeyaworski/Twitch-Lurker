import { useState } from 'react';
import browser from 'webextension-polyfill';
import { Box, Button, Card, CardActions, CardContent, TextField, Typography, Link, Skeleton } from '@mui/material';
import {
  AccountType,
  Login,
  MessageType,
  OriginType,
  YouTubeOAuthCredentials,
} from 'src/types';
import {
  YOUTUBE_API_KEY_DOCUMENTATION,
  YOUTUBE_OAUTH_CREDENTIALS_DOCUMENTATION,
  ORIGINS,
} from 'src/app-constants';
import { useHandleOpenLink } from 'src/ui/hooks';
import { useStorage } from 'src/ui/stores/Storage';
import BackWrapper from './Router/BackWrapper';

function logout(accountType: AccountType) {
  browser.runtime.sendMessage({ type: MessageType.LOGOUT, accountType });
}

function login(accountType: AccountType.TWITCH | AccountType.YOUTUBE | AccountType.KICK) {
  const messageTypeMap = {
    [AccountType.TWITCH]: MessageType.LOGIN_TWITCH,
    [AccountType.YOUTUBE]: MessageType.LOGIN_YOUTUBE,
    [AccountType.KICK]: MessageType.LOGIN_KICK,
  };
  // TODO: When auto opening tabs works for Kick, enable the permission request here as well
  switch (accountType) {
    case AccountType.TWITCH: {
      // Due to a bug in Firefox where the permissions request is hidden behind the extension popup,
      // do not wait for the permission request to be completed before attempting to log in.
      browser.permissions.request({
        origins: ORIGINS[OriginType.TWITCH],
      });
      break;
    }
    case AccountType.YOUTUBE: {
      browser.permissions.request({
        origins: ORIGINS[OriginType.YOUTUBE],
      });
      break;
    }
    default: break;
  }
  browser.runtime.sendMessage({ type: messageTypeMap[accountType] });
}

interface CardSkeletonProps {
  title: string,
}

function CardSkeleton({ title }: CardSkeletonProps) {
  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {title}
        </Typography>
        <Skeleton variant="text" height="0.875rem" width="50%" animation="pulse" />
      </CardContent>
      <CardActions>
        <Button variant="contained" size="small" color="primary" disabled>
          ...
        </Button>
      </CardActions>
    </Card>
  );
}

interface CardInputProps {
  inputs: {
    label: string,
    name: string,
    defaultValue: string,
  }[],
  onSubmit: React.FormEventHandler<HTMLFormElement>,
  onCancel: () => void,
}

function CardInput({ inputs, onSubmit, onCancel }: CardInputProps) {
  return (
    <form
      onSubmit={e => {
        onSubmit(e);
        onCancel();
      }}
    >
      <Box display="flex" flexDirection="column" gap={1} mt={1}>
        {inputs.map(input => (
          <TextField
            key={input.name}
            name={input.name}
            label={input.label}
            defaultValue={input.defaultValue}
            variant="outlined"
            size="small"
            fullWidth
          />
        ))}
      </Box>
      <Box display="flex" gap={0.75} mt={1}>
        <Button type="submit" variant="contained" color="primary" size="small">
          Save
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </Box>
    </form>
  );
}

interface CardProps {
  accountType: AccountType,
}

function AccountCard({ accountType }: CardProps) {
  const loading = useStorage(store => store.loading);
  const storage = useStorage(store => store.storage);
  const setStorage = useStorage(store => store.setStorage);
  const [youtubeApiKeyInputOpen, setYouTubeApiKeyInputOpen] = useState(false);
  const [youtubeClientIdInputOpen, setYouTubeOAuthCredentialsInputOpen] = useState(false);

  const openYouTubeApiKeyDocumentation = useHandleOpenLink(YOUTUBE_API_KEY_DOCUMENTATION, true);
  const openYouTubeOAuthCredentialsDocumentation = useHandleOpenLink(YOUTUBE_OAUTH_CREDENTIALS_DOCUMENTATION, true);

  const account = storage.logins.find(login => login.type === accountType);
  const oauthCredentials = storage.logins.find((login): login is YouTubeOAuthCredentials => login.type === AccountType.YOUTUBE_OAUTH_CREDENTIALS);

  const getOnSubmitLoginProperty = (type: AccountType): React.FormEventHandler<HTMLFormElement> => e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLogin: Partial<Login> = {
      type,
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of formData.entries()) {
      // Trust that the form was created properly
      // @ts-expect-error
      newLogin[key] = value;
    }
    const hasEmptyValue = Object.values(newLogin).some(value => !value);
    if (!hasEmptyValue) {
      if (newLogin) {
        const newLogins = Array.from(storage.logins);
        const existingApiKeyLoginIdx = storage.logins.findIndex(login => login.type === type);
        if (existingApiKeyLoginIdx < 0) {
          newLogins.push(newLogin as Login);
        } else {
          newLogins.splice(existingApiKeyLoginIdx, 1, newLogin as Login);
        }
        setStorage({
          logins: newLogins,
        });
      }
    }
  };

  const title = (() => {
    switch (accountType) {
      case AccountType.TWITCH: {
        return 'Twitch';
      }
      case AccountType.YOUTUBE: {
        return 'YouTube';
      }
      case AccountType.YOUTUBE_API_KEY: {
        return 'YouTube API Key';
      }
      case AccountType.KICK: {
        return 'Kick';
      }
      default: {
        return '';
      }
    }
  })();

  let loginName: string | undefined;
  if (account && 'username' in account) loginName = `@${account.username}`;
  else if (account && 'email' in account) loginName = account.email;

  let buttons: React.ReactNode = null;
  let secondaryText: React.ReactNode = '';
  switch (accountType) {
    case AccountType.TWITCH: {
      buttons = account ? (
        <Button variant="contained" size="small" color="primary" onClick={() => logout(accountType)}>
          Log Out
        </Button>
      ) : (
        <Button variant="contained" size="small" color="primary" onClick={() => login(accountType)}>
          Log In
        </Button>
      );
      secondaryText = !account
        ? 'Not logged in'
        : loginName
          ? `Logged in as ${loginName}`
          : 'Logged in';
      break;
    }
    case AccountType.YOUTUBE: {
      const clientIdLogin = storage.logins.find(l => l.type === AccountType.YOUTUBE_OAUTH_CREDENTIALS);
      if (!youtubeClientIdInputOpen) {
        buttons = (!clientIdLogin && !account)
          ? (
            <>
              <Button variant="contained" size="small" color="primary" onClick={() => login(accountType)}>
                Log In
              </Button>
              <Button variant="contained" size="small" color="primary" onClick={() => setYouTubeOAuthCredentialsInputOpen(true)}>
                Override Credentials
              </Button>
            </>
          ) : account ? (
            <Button variant="contained" size="small" color="primary" onClick={() => logout(accountType)}>
              Log Out
            </Button>
          ) : (
            <>
              <Button variant="contained" size="small" color="primary" onClick={() => login(accountType)}>
                Log In
              </Button>
              <Button variant="contained" size="small" color="primary" onClick={() => logout(AccountType.YOUTUBE_OAUTH_CREDENTIALS)}>
                Remove Credentials Override
              </Button>
              <Button variant="contained" size="small" color="primary" onClick={() => setYouTubeOAuthCredentialsInputOpen(true)}>
                Update Credentials Override
              </Button>
            </>
          );
      }
      const loginText = !account
        ? 'Not logged in'
        : loginName
          ? `Logged in as ${loginName}`
          : 'Logged in';
      secondaryText = (
        <>
          {loginText}
          <br />
          <br />
          You may optionally provide your own app credentials.
          {' '}
          Instructions to do so are
          {' '}
          <Link
            href={YOUTUBE_OAUTH_CREDENTIALS_DOCUMENTATION}
            color="textPrimary"
            onClick={openYouTubeOAuthCredentialsDocumentation}
          >
            here
          </Link>
          .
        </>
      );
      break;
    }
    case AccountType.YOUTUBE_API_KEY: {
      if (!youtubeApiKeyInputOpen) {
        buttons = account ? (
          <>
            <Button variant="contained" size="small" color="primary" onClick={() => logout(accountType)}>
              Remove API Key
            </Button>
            <Button variant="contained" size="small" color="primary" onClick={() => setYouTubeApiKeyInputOpen(true)}>
              Update API Key
            </Button>
          </>
        ) : (
          <Button variant="contained" size="small" color="primary" onClick={() => setYouTubeApiKeyInputOpen(true)}>
            Set API Key
          </Button>
        );
      }
      secondaryText = (
        <>
          You must provide an API key to fetch YouTube data (unless you override the credentials for logging in).
          {' '}
          Instructions to do so are
          {' '}
          <Link
            href={YOUTUBE_API_KEY_DOCUMENTATION}
            color="textPrimary"
            onClick={openYouTubeApiKeyDocumentation}
          >
            here
          </Link>
          . Note that your subscriptions cannot be populated using this key,
          {' '}
          so you will also need to log in with a YouTube account to populate subscriptions.
        </>
      );
      break;
    }
    case AccountType.KICK: {
      buttons = account ? (
        <Button variant="contained" size="small" color="primary" onClick={() => logout(accountType)}>
          Disable
        </Button>
      ) : (
        <Button variant="contained" size="small" color="primary" onClick={() => login(accountType)}>
          Enable
        </Button>
      );
      secondaryText = (
        <>
          Logging in will not be supported until the official Kick API is operational. In the meantime, individual Kick channels can be added.
        </>
      );
      break;
    }
    default: {
      break;
    }
  }

  if (loading) return <CardSkeleton title={title} />;

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {secondaryText}
        </Typography>
        {youtubeApiKeyInputOpen && (
          <CardInput
            inputs={[
              {
                label: 'API Key',
                name: 'apiKey',
                defaultValue: account && account.type === AccountType.YOUTUBE_API_KEY ? account.apiKey : '',
              },
            ]}
            onSubmit={getOnSubmitLoginProperty(AccountType.YOUTUBE_API_KEY)}
            onCancel={() => {
              setYouTubeApiKeyInputOpen(false);
            }}
          />
        )}
        {youtubeClientIdInputOpen && (
          <CardInput
            inputs={[
              {
                label: 'Client ID',
                name: 'clientId',
                defaultValue: oauthCredentials ? oauthCredentials.clientId : '',
              },
              {
                label: 'Client Secret',
                name: 'clientSecret',
                defaultValue: oauthCredentials ? oauthCredentials.clientSecret : '',
              },
            ]}
            onSubmit={getOnSubmitLoginProperty(AccountType.YOUTUBE_OAUTH_CREDENTIALS)}
            onCancel={() => {
              setYouTubeOAuthCredentialsInputOpen(false);
            }}
          />
        )}
      </CardContent>
      <CardActions sx={{
        gap: '6px',
        '& > :not(:first-child)': {
          marginLeft: 0,
        },
      }}
      >
        {buttons}
      </CardActions>
    </Card>
  );
}

export default function Accounts() {
  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Accounts</Typography>
      <Box display="flex" flexDirection="column" gap="10px">
        <AccountCard accountType={AccountType.TWITCH} />
        <AccountCard accountType={AccountType.YOUTUBE_API_KEY} />
        <AccountCard accountType={AccountType.YOUTUBE} />
        <AccountCard accountType={AccountType.KICK} />
      </Box>
    </BackWrapper>
  );
}
