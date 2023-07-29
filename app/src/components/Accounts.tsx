import React, { useContext } from 'react';
import { browser } from 'webextension-polyfill-ts';
import { Box, Button, Card, CardActions, CardContent, Typography } from '@material-ui/core';

import StorageContext from 'contexts/Storage';
import { AccountType, MessageType, Login, TwitchLogin, YouTubeLogin } from 'types';
import { Skeleton } from '@material-ui/lab';
import BackWrapper from './Router/BackWrapper';

function logout(accountType: AccountType) {
  const messageTypeMap = {
    [AccountType.TWITCH]: MessageType.LOGOUT_TWITCH,
    [AccountType.YOUTUBE]: MessageType.LOGOUT_YOUTUBE,
  };
  browser.runtime.sendMessage({ type: messageTypeMap[accountType] });
}

function login(accountType: AccountType) {
  const messageTypeMap = {
    [AccountType.TWITCH]: MessageType.LOGIN_TWITCH,
    [AccountType.YOUTUBE]: MessageType.LOGIN_YOUTUBE,
  };
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

function LoginCard({ accountType }: CardProps) {
  const { loading, storage } = useContext(StorageContext);

  const title = (() => {
    switch (accountType) {
      case AccountType.TWITCH: {
        return 'Twitch';
      }
      case AccountType.YOUTUBE: {
        return 'YouTube';
      }
      default: {
        return '';
      }
    }
  })();

  if (loading) return <CardSkeleton title={title} />;

  const account = storage.logins.find(login => login.type === accountType);
  if (!account) {
    return (
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5">
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Not logged in
          </Typography>
        </CardContent>
        <CardActions>
          <Button variant="contained" size="small" color="primary" onClick={() => login(accountType)}>
            Log In
          </Button>
        </CardActions>
      </Card>
    );
  }

  let loginName: string | undefined;
  if ('username' in account) loginName = `@${account.username}`;
  else if ('name' in account) loginName = account.name;

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {loginName ? `Logged in as ${loginName}` : 'Logged in'}
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="contained" size="small" color="primary" onClick={() => logout(accountType)}>
          Log Out
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Accounts() {
  return (
    <BackWrapper>
      <Typography variant="h5" align="center" gutterBottom>Accounts</Typography>
      <Box display="flex" flexDirection="column" gridGap="10px">
        <LoginCard accountType={AccountType.TWITCH} />
        <LoginCard accountType={AccountType.YOUTUBE} />
      </Box>
    </BackWrapper>
  );
}
