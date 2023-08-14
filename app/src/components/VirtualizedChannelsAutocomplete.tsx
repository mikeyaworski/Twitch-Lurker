import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { Typography, List, Tooltip, Box } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

import type { Channel } from 'types';
import { getId, sortByName } from 'utils';
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
  endAdornment?: React.ReactNode,
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
  endAdornment,
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
      disableClearable={Boolean(endAdornment)}
      disabled={disabled}
      disableListWrap
      classes={{
        listbox: classes.listbox,
      }}
      ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
      options={options}
      // This getOptionLabel shouldn't be necessary, but it gets called for some reason and causes console errors if not implemented like this.
      getOptionLabel={channelOrInput => {
        if (typeof channelOrInput === 'string') return channelOrInput;
        return channelOrInput.displayName;
      }}
      filterOptions={(o, _) => createFilterOptions<Channel>()(o, {
        inputValue: value,
        getOptionLabel: channel => channel.displayName,
      })}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          size="small"
          label={hint}
          InputProps={{
            ...params.InputProps,
            endAdornment: endAdornment || params.InputProps.endAdornment,
          }}
        />
      )}
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
          <Box display="flex" gridGap={6} alignItems="center">
            {autocomplete}
            <Tooltip arrow title={tooltip} style={{ cursor: 'pointer' }}>
              <InfoIcon />
            </Tooltip>
          </Box>
        ) : autocomplete}
      </form>
      <List
        className={classes.scrollZone}
        dense
      >
        {channels.sort(sortByName).map(channel => (
          <ChannelItem
            key={getId(channel)}
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
