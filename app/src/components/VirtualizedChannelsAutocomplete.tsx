import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { Typography, List, Tooltip } from '@material-ui/core';

import type { Channel } from 'types';
import { getFavoriteId, sortByName } from 'utils';
import ChannelItem, { ChannelItemProps } from 'components/ChannelItem';

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: (style.top as number) + LISTBOX_PADDING,
    },
  });
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: unknown) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef<HTMLDivElement>((props, ref) => {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 36;

  const getHeight = () => {
    const heightCount = Math.min(8, itemCount);
    return heightCount * itemSize;
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={_ => itemSize}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const useStyles = makeStyles({
  listbox: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0,
    },
  },
  scrollZone: {
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%',
    margin: '16px auto',
  },
});

interface Props {
  onAdd: (value: string) => void,
  onRemove: (channel: Channel) => void,
  options: Channel[],
  getOptionValue: (option: Channel) => string,
  channels: Channel[],
  disabled?: boolean,
  hint?: string,
  tooltip?: React.ReactNode,
  channelItemProps?: Partial<ChannelItemProps>,
}

export default function VirtualizedChannelsAutocomplete({
  onAdd,
  onRemove,
  options,
  getOptionValue,
  channels,
  disabled,
  hint = 'Username',
  channelItemProps,
  tooltip = null,
}: Props) {
  const classes = useStyles();
  const [value, setValue] = React.useState('');

  function onSubmit(newValue: string | null) {
    if (newValue) onAdd(newValue);
    setValue('');
  }

  const autocomplete = (
    <Autocomplete
      style={{ width: '100%' }}
      freeSolo
      disabled={disabled}
      disableListWrap
      classes={classes}
      ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
      options={options}
      filterOptions={(o, _) => createFilterOptions<Channel>()(o, {
        inputValue: value,
        getOptionLabel: channel => channel.displayName,
      })}
      renderInput={params => <TextField {...params} variant="outlined" size="small" label={hint} />}
      renderOption={option => <Typography noWrap>{option.displayName}</Typography>}
      onInputChange={(_, newValue, reason) => {
        if (reason === 'input' || reason === 'clear') setValue(newValue);
      }}
      onChange={(e, newValue) => {
        if (!newValue || typeof newValue === 'string') {
          onSubmit(newValue);
        } else {
          onSubmit(getOptionValue(newValue));
        }
      }}
      value={value}
      inputValue={value}
    />
  );

  return (
    <>
      <form onSubmit={e => {
        e.preventDefault();
        onSubmit(value);
      }}
      >
        {tooltip ? (
          <Tooltip arrow title={tooltip}>
            {autocomplete}
          </Tooltip>
        ) : autocomplete}
      </form>
      <List
        className={classes.scrollZone}
        dense
      >
        {channels.sort(sortByName).map(channel => (
          <ChannelItem
            key={getFavoriteId(channel)}
            channel={channel}
            onIconClick={() => onRemove(channel)}
            Icon={DeleteIcon}
            iconColor="error"
            linked
            {...channelItemProps}
          />
        ))}
      </List>
    </>
  );
}
