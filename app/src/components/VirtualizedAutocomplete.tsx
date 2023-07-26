import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { Typography, List } from '@material-ui/core';

import type { Channel } from 'types';
import ChannelItem from 'components/ChannelItem';

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
  onRemove: (value: string) => void,
  options: string[],
  channels: Channel[],
  disabled?: boolean,
}

export default function VirtualizedTagsInput({
  onAdd,
  onRemove,
  options,
  channels,
  disabled,
}: Props) {
  const classes = useStyles();
  const [value, setValue] = React.useState('');

  function onSubmit(newValue: string | null) {
    if (newValue) onAdd(newValue);
    setValue('');
  }

  return (
    <>
      <form onSubmit={e => {
        e.preventDefault();
        onSubmit(value);
      }}
      >
        <Autocomplete
          style={{ width: '100%' }}
          freeSolo
          disabled={disabled}
          disableListWrap
          classes={classes}
          ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          options={options}
          filterOptions={(o, _) => createFilterOptions<string>()(o, {
            inputValue: value,
            getOptionLabel: option => option,
          })}
          renderInput={params => <TextField {...params} variant="outlined" size="small" label="Username" />}
          renderOption={option => <Typography noWrap>{option}</Typography>}
          onInputChange={(_, newValue, reason) => {
            if (reason === 'input' || reason === 'clear') setValue(newValue);
          }}
          onChange={(e, newValue) => {
            onSubmit(newValue);
          }}
          value={value}
          inputValue={value}
        />
      </form>
      <List
        className={classes.scrollZone}
        dense
      >
        {channels.map(channel => (
          <ChannelItem
            key={channel.username}
            channel={channel}
            handleIconClick={e => {
              if (e.currentTarget.dataset.username) onRemove(e.currentTarget.dataset.username);
            }}
            Icon={DeleteIcon}
            iconColor="error"
            linked
          />
        ))}
      </List>
    </>
  );
}
