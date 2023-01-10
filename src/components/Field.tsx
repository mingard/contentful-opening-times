import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Button,
  EditorToolbarButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Select,
  Option
} from '@contentful/forma-36-react-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { Checkbox } from '@contentful/f36-components';
import tokens from '@contentful/forma-36-tokens';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { v4 as uuid } from 'uuid';
import { timeStamp } from 'console';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const timeMap = () => {
  return Array.from(Array(96).keys())
    .map(i => {
      const inc = i * 15
      const hours = Math.floor(inc / 60)
      const minutes = inc % 60
      return (hours * 100) + minutes
    })
}

/** An Item which represents an list item of the repeater app */
interface Item {
  id: string;
  days: Array<string>;
  open?: number;
  close?: number;
  allDay: boolean;
}

/** A simple utility function to create a 'blank' item
 * @returns A blank `Item` with a uuid
*/
function createItem(): Item {
  return {
    id: uuid(),
    days: [],
    allDay: false
  };
}

/** The Field component is the Repeater App which shows up 
 * in the Contentful field.
 * 
 * The Field expects and uses a `Contentful JSON field`
 */
const Field = (props: FieldProps) => {
  const { valueName = 'Value' } = props.sdk.parameters.instance as any;
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    // This ensures our app has enough space to render
    props.sdk.window.startAutoResizer({ absoluteElements: true });

    // Every time we change the value on the field, we update internal state
    props.sdk.field.onValueChanged((value: Item[]) => {
      if (Array.isArray(value)) {
        setItems(value);
      }
    });
  });

  /** Adds another item to the list */
  const addNewItem = () => {
    props.sdk.field.setValue([...items, createItem()]);
  };

  /** Creates an `onChange` handler for an item based on its `property`
   * @returns A function which takes an `onChange` event 
  */
  const createOnChangeHandler = (item: Item, property: 'all' | 'days' | 'open' | 'close' | 'allDay') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const itemList = items.concat();
    const index = itemList.findIndex((i) => i.id === item.id);
    const { checked, value } = e.target;

    switch (property) {
      case 'all':
        const selected = checked ? days : []
        itemList.splice(index, 1, { ...item, days: selected });
        break;
      case 'allDay':
        itemList.splice(index, 1, { ...item, allDay: checked });
        break;
      case 'days':
        const val = checked ? item.days.concat([value]) : item.days.filter(d => d !== value)
        itemList.splice(index, 1, { ...item, [property]: val });
        break;
      default:
        itemList.splice(index, 1, { ...item, [property]: value });
    }

    props.sdk.field.setValue(itemList);
  };

  const createOnSelectChangeHandler = (item: Item, property: 'open' | 'close') => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const itemList = items.concat();
    const index = itemList.findIndex((i) => i.id === item.id);
    const { value } = e.target;

    itemList.splice(index, 1, { ...item, [property]: value });

    props.sdk.field.setValue(itemList);
  };

  /** Deletes an item from the list */
  const deleteItem = (item: Item) => {
    props.sdk.field.setValue(items.filter((i) => i.id !== item.id));
  };

  const timeConvert = (time: number) => {
    const hours = Math.floor(time / 100)
    const minutes = (time - (hours * 100)) % 60;
    return hours + ":" + minutes.toString().padEnd(2, '0')
  }

  return (
    <div>
      <Table>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Multiselect
                  currentSelection={item.days}
                  popoverProps={{ isFullWidth: true, listMaxHeight: 1000, isAutoalignmentEnabled: true }}
                >
                  <Multiselect.SelectAll
                    onSelectItem={createOnChangeHandler(item, 'all')}
                    isChecked={item.days.length === days.length}
                  />
                  {days.map((day) => {
                    const key = day.toLowerCase().replace(/\s/g, '-');
                    return (
                      <Multiselect.Option
                        key={`key-${key}}`}
                        itemId={`day-${key}}`}
                        value={day}
                        label={day}
                        onSelectItem={createOnChangeHandler(item, 'days')}
                        isChecked={item.days.includes(day)}
                      />
                    );
                  })}
                </Multiselect>
              </TableCell>
              <TableCell>
                <Select
                  id="open"
                  name="open"
                  value={item.open?.toString() || ''}
                  onChange={createOnSelectChangeHandler(item, 'open')}
                >
                  <Option value="">
                    Opening
                  </Option>
                  {timeMap().map((time: number) => {
                    const label = timeConvert(time)
                    return (
                      <Option value={time.toString()}>{label}</Option>
                    );
                  })}
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  id="close"
                  name="close"
                  value={item.close?.toString() || ''}
                  onChange={createOnSelectChangeHandler(item, 'close')}
                >
                  <Option value="">
                    Closes
                  </Option>
                  {timeMap().map((time: number) => {
                    const label = timeConvert(time)
                    return (
                      <Option value={time.toString()}>{label}</Option>
                    );
                  })}
                </Select>
              </TableCell>
              <TableCell align="right">
                <Checkbox
                  style={{ height: '40px' }}
                  id="allDay"
                  name="allDay"
                  isChecked={item.allDay}
                  onChange={createOnChangeHandler(item, 'allDay')}
                >
                  All Day
                </Checkbox>
              </TableCell>
              <TableCell align="right">
                <EditorToolbarButton
                  label="delete"
                  icon="Delete"
                  onClick={() => deleteItem(item)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        buttonType="naked"
        onClick={addNewItem}
        icon="PlusCircle"
        style={{ marginTop: tokens.spacingS }}
      >
        Add Time
      </Button>
    </div >
  );
};

export default Field;