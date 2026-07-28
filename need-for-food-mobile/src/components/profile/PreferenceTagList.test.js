import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PreferenceTagList from './PreferenceTagList';

describe('PreferenceTagList', () => {
    it('renders the label and existing items as tags', async () => {
        const { getByText } = await render(
            <PreferenceTagList label="Allergies" items={['Arachide', 'Gluten']} onAdd={jest.fn()} onRemove={jest.fn()} />
        );

        expect(getByText('Allergies')).toBeTruthy();
        expect(getByText('Arachide')).toBeTruthy();
        expect(getByText('Gluten')).toBeTruthy();
    });

    it('reveals a text input when "Ajouter" is pressed, and hides the button', async () => {
        const { getByText, getByPlaceholderText, queryByText } = await render(
            <PreferenceTagList label="Allergies" items={[]} onAdd={jest.fn()} onRemove={jest.fn()} />
        );

        fireEvent.press(getByText('Ajouter'));

        await waitFor(() => expect(getByPlaceholderText('Ajouter...')).toBeTruthy());
        expect(queryByText('Ajouter')).toBeNull();
    });

    it('calls onAdd with the trimmed value and resets back to the "Ajouter" button', async () => {
        const onAdd = jest.fn().mockResolvedValue(undefined);
        const { getByText, getByPlaceholderText, queryByPlaceholderText } = await render(
            <PreferenceTagList label="Allergies" items={[]} onAdd={onAdd} onRemove={jest.fn()} />
        );

        fireEvent.press(getByText('Ajouter'));
        await waitFor(() => expect(getByPlaceholderText('Ajouter...')).toBeTruthy());

        fireEvent.changeText(getByPlaceholderText('Ajouter...'), '  Arachide  ');
        await waitFor(() => expect(getByPlaceholderText('Ajouter...').props.value).toBe('  Arachide  '));

        fireEvent(getByPlaceholderText('Ajouter...'), 'submitEditing');

        await waitFor(() => expect(onAdd).toHaveBeenCalledWith('Arachide'));
        await waitFor(() => expect(getByText('Ajouter')).toBeTruthy());
        expect(queryByPlaceholderText('Ajouter...')).toBeNull();
    });

    it('does not call onAdd when the input is submitted empty', async () => {
        const onAdd = jest.fn();
        const { getByText, getByPlaceholderText } = await render(
            <PreferenceTagList label="Allergies" items={[]} onAdd={onAdd} onRemove={jest.fn()} />
        );

        fireEvent.press(getByText('Ajouter'));
        await waitFor(() => expect(getByPlaceholderText('Ajouter...')).toBeTruthy());
        fireEvent(getByPlaceholderText('Ajouter...'), 'submitEditing');

        await waitFor(() => expect(getByText('Ajouter')).toBeTruthy());
        expect(onAdd).not.toHaveBeenCalled();
    });

    it('does not call onAdd for a value that already exists in items', async () => {
        const onAdd = jest.fn();
        const { getByText, getByPlaceholderText } = await render(
            <PreferenceTagList label="Allergies" items={['Arachide']} onAdd={onAdd} onRemove={jest.fn()} />
        );

        fireEvent.press(getByText('Ajouter'));
        await waitFor(() => expect(getByPlaceholderText('Ajouter...')).toBeTruthy());

        fireEvent.changeText(getByPlaceholderText('Ajouter...'), 'Arachide');
        await waitFor(() => expect(getByPlaceholderText('Ajouter...').props.value).toBe('Arachide'));

        fireEvent(getByPlaceholderText('Ajouter...'), 'submitEditing');

        await waitFor(() => expect(getByText('Ajouter')).toBeTruthy());
        expect(onAdd).not.toHaveBeenCalled();
    });

    it('calls onRemove with the corresponding item when its tag is removed', async () => {
        const onRemove = jest.fn();
        const { getAllByTestId } = await render(
            <PreferenceTagList label="Allergies" items={['Arachide', 'Gluten']} onAdd={jest.fn()} onRemove={onRemove} />
        );

        const [, removeGluten] = getAllByTestId('preference-tag-remove');
        fireEvent.press(removeGluten);

        await waitFor(() => expect(onRemove).toHaveBeenCalledWith('Gluten'));
    });
});
