import { setStorage } from 'src/chrome-utils';
import { AccountType, Login } from 'src/types';
import { getFullStorage } from 'src/storage';

const storage = getFullStorage();

export async function login() {
  const newLogin: Login = {
    type: AccountType.KICK,
  };
  await setStorage({
    logins: storage.logins.filter(login => login.type !== AccountType.KICK).concat(newLogin),
  });
}
