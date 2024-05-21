import { setStorage } from 'chrome-utils';
import { AccountType, Login } from 'types';
import { getFullStorage } from 'storage';

const storage = getFullStorage();

export async function login() {
  const newLogin: Login = {
    type: AccountType.KICK,
  };
  await setStorage({
    logins: storage.logins.filter(login => login.type !== AccountType.KICK).concat(newLogin),
  });
}
