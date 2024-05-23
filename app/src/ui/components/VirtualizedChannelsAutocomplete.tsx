import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import {
  Typography,
  List,
  Tooltip,
  Box,
  TextField,
  Popper,
  Autocomplete,
  createFilterOptions,
  useTheme,
  useMediaQuery,
  styled,
} from '@mui/material';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import InfoIcon from '@mui/icons-material/Info';

import type { Channel } from 'src/types';
import { getId, sortByName } from 'src/utils';
import ChannelItem, { ChannelItemProps } from 'src/ui/components/ChannelItem';

const LISTBOX_PADDING = 8; // px

type RowProps = [
  React.HTMLAttributes<HTMLLIElement>,
  Channel,
  number,
];

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  const dataSet = data[index] as RowProps;
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };

  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {dataSet[1].displayName}
    </Typography>
  );
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
const ListboxComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>((props, ref) => {
  const { children, ...other } = props;
  const itemData: React.ReactElement[] = [];
  (children as React.ReactElement[]).forEach(
    (item: React.ReactElement & { children?: React.ReactElement[] }) => {
      itemData.push(item);
      itemData.push(...(item.children || []));
    },
  );

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true,
  });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child: React.ReactElement) => {
    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
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
          itemSize={index => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0,
    },
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
  const [value, setValue] = React.useState('');

  function onSubmit(newValue: string | null) {
    if (newValue) onAdd(newValue);
    setValue('');
  }

  const autocomplete = (
    <Autocomplete
      sx={{ width: '100%' }}
      freeSolo
      disableClearable={Boolean(endAdornment)}
      disabled={disabled}
      disableListWrap
      PopperComponent={StyledPopper}
      ListboxComponent={ListboxComponent}
      options={options}
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
      renderOption={(props, option, state) => [props, option, state.index] as React.ReactNode}
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
          <Box display="flex" gap={0.75} alignItems="center">
            {autocomplete}
            <Tooltip arrow title={tooltip} sx={{ cursor: 'pointer' }}>
              <InfoIcon />
            </Tooltip>
          </Box>
        ) : autocomplete}
      </form>
      <List
        sx={{
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
          margin: '16px auto',
        }}
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
