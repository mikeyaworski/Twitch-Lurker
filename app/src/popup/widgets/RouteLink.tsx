import clsx from 'clsx';
import { Link as RouterLink } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import MuiLink from '@material-ui/core/Link';

const useStyles = makeStyles({
  link: {
    userDrag: 'none',
  },
});

interface Props {
  to: string;
  className?: string;
}

const RouteLink: React.FC<Props> = props => {
  const classes = useStyles();
  const { to, children, className: classNameProp } = props;
  const className = clsx(classes.link, classNameProp);
  return (
    <MuiLink component={RouterLink} to={to} className={className}>{children}</MuiLink>
  );
};

export default RouteLink;
