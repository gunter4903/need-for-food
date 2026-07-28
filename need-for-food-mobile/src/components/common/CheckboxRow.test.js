import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CheckboxRow from './CheckboxRow';

describe('CheckboxRow', () => {
    it('renders the label and an optional subtitle', async () => {
        const { getByText } = await render(
            <CheckboxRow label="200g de Farine" subtitle="Rayon céréales" checked={false} onToggle={jest.fn()} />
        );

        expect(getByText('200g de Farine')).toBeTruthy();
        expect(getByText('Rayon céréales')).toBeTruthy();
    });

    it('calls onToggle when the row is pressed', async () => {
        const onToggle = jest.fn();
        const { getByText } = await render(<CheckboxRow label="Sel" checked={false} onToggle={onToggle} />);

        fireEvent.press(getByText('Sel'));

        await waitFor(() => expect(onToggle).toHaveBeenCalledTimes(1));
    });

    it('shows a delete button and calls onDelete when provided, instead of the tag', async () => {
        const onDelete = jest.fn();
        const { queryByText, getByTestId } = await render(
            <CheckboxRow
                label="Basilic"
                tag="Frais"
                checked={false}
                onToggle={jest.fn()}
                onDelete={onDelete}
            />
        );

        // onDelete a priorité sur tag : le composant n'affiche jamais les deux.
        expect(queryByText('Frais')).toBeNull();

        fireEvent.press(getByTestId('checkbox-row-delete'));

        await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    });

    it('shows the tag text when no onDelete handler is provided', async () => {
        const { getByText } = await render(<CheckboxRow label="Basilic" tag="Frais" checked={false} onToggle={jest.fn()} />);

        expect(getByText('Frais')).toBeTruthy();
    });
});
