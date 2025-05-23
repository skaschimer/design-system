import { render as renderRTL } from '@test/utils';

import { Field } from '../Field';

import { Combobox, ComboboxOption, ComboboxProps } from './Combobox';

type ComponentProps = Omit<ComboboxProps, 'children'> & { options?: typeof defaultOptions };

const defaultOptions = [
  { value: 'hamburger', children: 'Hamburger' },
  { value: 'bagel', children: 'Bagel' },
  { value: 'tartuffo', children: 'Tartuffo' },
  { value: 'carbonara', children: 'Carbonara' },
];

const Component = ({ options = defaultOptions, ...restProps }: Partial<Omit<ComponentProps, 'aria-label'>>) => (
  <Combobox aria-label="Food" {...restProps}>
    {options.map((opt) => (
      <ComboboxOption key={opt.value} {...opt} />
    ))}
  </Combobox>
);

const render = (props?: Partial<ComponentProps>) => renderRTL(<Component {...props} />);

describe('Combobox', () => {
  it('should be accessible if I only pass an aria-label', () => {
    const { getByRole, queryByRole } = render({ 'aria-label': 'Food' });

    expect(queryByRole('label')).not.toBeInTheDocument();

    expect(getByRole('combobox', { name: 'Food' })).toBeInTheDocument();
  });

  it('if a default value is passed it should set that value on the primitive', () => {
    const { getByRole } = render({ value: 'hamburger' });

    expect(getByRole('combobox')).toHaveValue('Hamburger');
  });

  /**
   * @see https://github.com/strapi/design-system/issues/1074
   */
  it('should correctly change the text value and value of the combobox even if two items are very similarly named', async () => {
    const { getByRole, user } = render({
      options: [
        {
          value: 'strawberry1',
          children: 'Strawberry 1',
        },
        {
          value: 'strawberry2',
          children: 'Strawberry 2',
        },
      ],
    });

    getByRole('combobox').focus();

    await user.type(getByRole('combobox'), 'Straw');

    expect(getByRole('combobox')).toHaveValue('Strawberry 1');

    await user.click(getByRole('option', { name: 'Strawberry 2' }));

    expect(getByRole('combobox')).toHaveValue('Strawberry 2');
  });

  describe('callbacks', () => {
    it('should fire onChange only when the value is changed not when the input does', async () => {
      const onChange = jest.fn();
      const { getByRole, user } = render({ onChange });

      await user.click(getByRole('combobox'));

      expect(getByRole('listbox')).toBeInTheDocument();

      await user.click(getByRole('option', { name: 'Hamburger' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('hamburger');

      expect(getByRole('combobox')).toHaveValue('Hamburger');
    });

    it('should call onInputChange as the input changes', async () => {
      const onInputChange = jest.fn();
      const { getByRole, user } = render({ onInputChange });

      await user.click(getByRole('combobox'));

      const stringToType = 'hamburger';

      await user.type(getByRole('combobox'), stringToType);

      expect(onInputChange).toHaveBeenNthCalledWith(1, expect.any(Object));
    });
  });

  describe('props that make visual changes', () => {
    it('should handle the disabled prop correctly', () => {
      const { getByRole } = render({ disabled: true });

      expect(getByRole('combobox')).toBeDisabled();
    });

    it('should handle the error prop correctly', () => {
      const render = (props: Partial<ComponentProps> & Pick<Field.Props, 'error'> = {}) =>
        renderRTL(
          <Field.Root error={props.error}>
            <Component error={props.error} {...props} />
            <Field.Error />
          </Field.Root>,
        );
      const { getByRole, getByText } = render({ error: 'error' });

      expect(getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
      expect(getByText('error')).toBeInTheDocument();
    });

    it('should handle the hint prop correctly', () => {
      const render = (props: Partial<ComponentProps> & Pick<Field.Props, 'hint'> = {}) =>
        renderRTL(
          <Field.Root hint={props.hint}>
            <Component {...props} />
            <Field.Hint />
          </Field.Root>,
        );
      const { getByText } = render({ hint: 'hint' });

      expect(getByText('hint')).toBeInTheDocument();
    });

    it('should handle the loading prop correctly', async () => {
      const { getByRole, queryByText, getByText, user } = render({ loading: true });

      expect(queryByText('Loading content...')).not.toBeInTheDocument();

      await user.click(getByRole('combobox'));

      expect(getByText('Loading content...')).toBeInTheDocument();
    });

    it('should handle the required prop correctly', () => {
      const { getByRole } = render({ required: true });

      expect(getByRole('combobox')).toBeRequired();
    });

    it('should handle noOptionsMessage prop correctly when there are no options to display', async () => {
      const { getByRole, queryAllByRole, getByText, user } = render({
        options: [],
      });

      await user.click(getByRole('combobox'));

      expect(getByText('No results found')).toBeInTheDocument();
      expect(queryAllByRole('option')).toHaveLength(0);
    });

    it('should handle noOptionsMessage prop correctly', async () => {
      const { getByRole, queryAllByRole, getByText, user } = render({
        noOptionsMessage: (value) => `${value} is not an option`,
      });

      await user.click(getByRole('combobox'));

      await user.type(getByRole('combobox'), 'apple');

      expect(getByText('apple is not an option')).toBeInTheDocument();
      expect(queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('clear props', () => {
    it('should only show the clear button if the user has started typing an onClear is passed', async () => {
      const { getByRole, queryByRole, user } = render({
        onClear: jest.fn(),
      });

      await user.click(getByRole('combobox'));

      expect(queryByRole('button', { name: 'Clear', hidden: true })).not.toBeInTheDocument();

      await user.type(getByRole('combobox'), 'hamburger');

      expect(getByRole('button', { name: 'Clear', hidden: true })).toBeInTheDocument();
    });

    it('should handle a custom label being passed', async () => {
      const { getByRole, user } = render({
        onClear: jest.fn(),
        clearLabel: 'Clear the field',
      });

      await user.click(getByRole('combobox'));

      await user.type(getByRole('combobox'), 'hamburger');

      expect(getByRole('button', { name: 'Clear the field', hidden: true })).toBeInTheDocument();
    });

    it('should clear the field when the clear button is pressed', async () => {
      const onClear = jest.fn();
      const { getByRole, user } = render({
        onClear,
      });

      await user.click(getByRole('combobox'));

      await user.type(getByRole('combobox'), 'hamburger');

      await user.click(getByRole('button', { name: 'Clear', hidden: true }));

      expect(getByRole('combobox')).toHaveValue('');
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('createable props', () => {
    it('should show the creatable button only if the prop is true & when an option is typed that does not exist', async () => {
      const { getByRole, queryByRole, user } = render({
        creatable: true,
      });

      await user.click(getByRole('combobox'));

      expect(queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();

      await user.type(getByRole('combobox'), 'Hamb');

      expect(getByRole('option', { name: 'Create "Hamb"' })).toBeInTheDocument();

      await user.type(getByRole('combobox'), 'urger');

      expect(queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();
    });

    it('should show the creatable button even if there are no options to begin with when we have typed something', async () => {
      const { getByRole, queryByRole, user } = render({
        creatable: true,
        options: [],
      });

      await user.click(getByRole('combobox'));

      expect(queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();

      await user.type(getByRole('combobox'), 'Hamb');

      expect(getByRole('option', { name: 'Create "Hamb"' })).toBeInTheDocument();
    });

    it('should show the creatable button by default if creatable is set to visible and even if we type something', async () => {
      const { getByRole, getByText, user } = render({
        creatable: 'visible',
      });

      await user.click(getByRole('combobox'));

      expect(getByRole('option', { name: /Create/ })).toBeInTheDocument();

      await user.type(getByRole('combobox'), 'Hamburger');

      expect(getByRole('option', { name: 'Create "Hamburger"' })).toBeInTheDocument();

      await user.type(getByRole('combobox'), 'invalid value');

      expect(getByText('No results found')).toBeInTheDocument();
    });

    it("should by default show the 'Create {value}' label", async () => {
      const { getByRole, user } = render({
        creatable: true,
      });

      await user.click(getByRole('combobox'));

      await user.type(getByRole('combobox'), 'hamb');

      expect(getByRole('option', { name: 'Create "hamb"' })).toBeInTheDocument();
    });

    it('should handle a custom createMessage function passed', async () => {
      const { getByRole, user } = render({
        creatable: true,
        createMessage: (value) => `Create ${value} as an option`,
      });

      await user.click(getByRole('combobox'));

      await user.type(getByRole('combobox'), 'hamb');
      await user.keyboard('{Backspace}');

      expect(getByRole('option', { name: 'Create ham as an option' })).toBeInTheDocument();
    });
  });

  describe('creatable click interactions', () => {
    it('should call onCreateOption when clicking the creatable option', async () => {
      const onCreateOption = jest.fn();
      const { getByRole, user } = render({
        creatable: true,
        onCreateOption,
      });

      await user.click(getByRole('combobox'));
      await user.type(getByRole('combobox'), 'newValue');

      const createOption = getByRole('option', { name: 'Create "newValue"' });
      expect(createOption).toBeInTheDocument();

      await user.click(createOption);

      expect(onCreateOption).toHaveBeenCalledWith('newValue');
      expect(onCreateOption).toHaveBeenCalledTimes(1);
    });

    it('should handle clicking the visible creatable option without typing', async () => {
      const onCreateOption = jest.fn();
      const { getByRole, user } = render({
        creatable: 'visible',
        onCreateOption,
        createMessage: () => 'Create a food',
      });

      expect(onCreateOption).toHaveBeenCalledTimes(0);

      await user.click(getByRole('combobox'));
      const createOption = getByRole('option', { name: 'Create a food' });
      expect(createOption).toBeInTheDocument();
      await user.click(createOption);

      expect(onCreateOption).toHaveBeenCalledTimes(1);
    });
  });

  describe('creatable keyboard interactions', () => {
    it('should select creatable option using keyboard arrow and enter', async () => {
      const onCreateOption = jest.fn();
      const { getByRole, user } = render({
        creatable: true,
        onCreateOption,
        options: [], // Empty options so creatable is the only option
      });

      await user.click(getByRole('combobox'));
      await user.type(getByRole('combobox'), 'keyboardValue');

      // Press arrow down to highlight the creatable option
      await user.keyboard('{ArrowDown}');

      // The creatable option should now be highlighted
      expect(getByRole('option', { name: 'Create "keyboardValue"' })).toHaveAttribute('data-highlighted');

      // Press Enter to select it
      await user.keyboard('{Enter}');

      expect(onCreateOption).toHaveBeenCalledTimes(1);
      expect(onCreateOption).toHaveBeenCalledWith('keyboardValue');
    });

    it('should select creatable visible option using keyboard arrow and enter', async () => {
      const onCreateOption = jest.fn();
      const { getByRole, user } = render({
        creatable: 'visible',
        onCreateOption,
        createMessage: () => 'Create a food',
        options: [], // Empty options so creatable is the only option
      });

      await user.click(getByRole('combobox'));

      // Press arrow down to highlight the creatable option
      await user.keyboard('{ArrowDown}');

      // The creatable option should now be highlighted
      expect(getByRole('option', { name: 'Create a food' })).toHaveAttribute('data-highlighted');

      // Press Enter to select it
      await user.keyboard('{Enter}');

      expect(onCreateOption).toHaveBeenCalledTimes(1);
    });
  });
});
