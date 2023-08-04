import React, { useContext, useState } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { Box, Button, Card, CardActions, CardContent, TextField, Typography, Link, makeStyles } from '@material-ui/core';

import StorageContext from 'contexts/Storage';
import { AccountType, MessageType, YOUTUBE_API_KEY_DOCUMENTATION } from 'types';
import { Skeleton } from '@material-ui/lab';
import { useHandleOpenLink } from 'hooks';
import BackWrapper from './Router/BackWrapper';

const useStyles = makeStyles({
  actionsSpacing: {
    '& > :not(:first-child)': {
      marginLeft: 6,
    },
  },
});

function logout(accountType: AccountType) {
  const messageTypeMap = {
    [AccountType.TWITCH]: MessageType.LOGOUT_TWITCH,
    [AccountType.YOUTUBE]: MessageType.LOGOUT_YOUTUBE,
  };
  // @ts-ignore
  browser.runtime.sendMessage({ type: messageTypeMap[accountType] });
}

function login(accountType: AccountType) {
  const messageTypeMap = {
    [AccountType.TWITCH]: MessageType.LOGIN_TWITCH,
    [AccountType.YOUTUBE]: MessageType.LOGIN_YOUTUBE,
  };
  // @ts-ignore
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

interface CardProps {
  accountType: AccountType,
}

function AccountCard({ accountType }: CardProps) {
  const classes = useStyles();
  const { loading, storage, setStorage } = useContext(StorageContext);
  const [youtubeApiKeyInputOpen, setYouTubeApiKeyInputOpen] = useState(false);
  const [youtubeApiKey, setYouTubeApiKey] = useState('');

  const openYouTubeApiKeyDocumentation = useHandleOpenLink(YOUTUBE_API_KEY_DOCUMENTATION, true);

  function removeYouTubeApiKey() {
    setStorage({
      logins: storage.logins.filter(login => login.type !== AccountType.YOUTUBE_API_KEY),
    }, true);
  }

  const title = (() => {
    switch (accountType) {
      case AccountType.TWITCH: {
        return 'Twitch';
      }
      case AccountType.YOUTUBE:
      case AccountType.YOUTUBE_API_KEY: {
        return 'YouTube';
      }
      default: {
        return '';
      }
    }
  })();

  if (loading) return <CardSkeleton title={title} />;

  const account = storage.logins.find(login => login.type === accountType);

  function openYouTubeApiKeyInput() {
    if (account && account.type === AccountType.YOUTUBE_API_KEY) {
      setYouTubeApiKey(account.apiKey);
    }
    setYouTubeApiKeyInputOpen(true);
  }

  const submitYouTubeApiKey: React.FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();
    if (youtubeApiKey) {
      const newLogins = Array.from(storage.logins);
      const existingApiKeyLoginIdx = storage.logins.findIndex(login => login.type === AccountType.YOUTUBE_API_KEY);
      if (existingApiKeyLoginIdx < 0) {
        newLogins.push({
          type: AccountType.YOUTUBE_API_KEY,
          apiKey: youtubeApiKey,
        });
      } else {
        newLogins.splice(existingApiKeyLoginIdx, 1, {
          type: AccountType.YOUTUBE_API_KEY,
          apiKey: youtubeApiKey,
        });
      }
      setStorage({
        logins: newLogins,
      });
    }
    setYouTubeApiKeyInputOpen(false);
    setYouTubeApiKey('');
  };

  let loginName: string | undefined;
  if (account && 'username' in account) loginName = `@${account.username}`;
  else if (account && 'name' in account) loginName = account.name;

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
    case AccountType.YOUTUBE_API_KEY: {
      if (!youtubeApiKeyInputOpen) {
        buttons = account ? (
          <>
            <Button variant="contained" size="small" color="primary" onClick={removeYouTubeApiKey}>
              Remove API Key
            </Button>
            <Button variant="contained" size="small" color="primary" onClick={openYouTubeApiKeyInput}>
              Update API Key
            </Button>
          </>
        ) : (
          <Button variant="contained" size="small" color="primary" onClick={openYouTubeApiKeyInput}>
            Set API Key
          </Button>
        );
      }
      secondaryText = (
        <>
          Because of limitations with the YouTube API, you must provide your own API key.
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
          .
        </>
      );
      break;
    }
    default: {
      break;
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom={youtubeApiKeyInputOpen}>
          {secondaryText}
        </Typography>
        {youtubeApiKeyInputOpen && (
          <form onSubmit={submitYouTubeApiKey}>
            <TextField
              value={youtubeApiKey}
              onChange={e => setYouTubeApiKey(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
            <Box display="flex" gridGap={6} mt={1}>
              <Button type="submit" variant="contained" color="primary" size="small">
                Save
              </Button>
              <Button
                variant="contained"
                color="default"
                size="small"
                onClick={() => {
                  setYouTubeApiKeyInputOpen(false);
                  setYouTubeApiKey('');
                }}
              >
                Cancel
              </Button>
            </Box>
          </form>
        )}
      </CardContent>
      <CardActions classes={{ spacing: classes.actionsSpacing }}>
        {buttons}
      </CardActions>
    </Card>
  );
}

export default function Accounts() {
  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Accounts</Typography>
      <Box display="flex" flexDirection="column" gridGap="10px">
        <AccountCard accountType={AccountType.TWITCH} />
        <AccountCard accountType={AccountType.YOUTUBE_API_KEY} />
      </Box>
    </BackWrapper>
  );
}
