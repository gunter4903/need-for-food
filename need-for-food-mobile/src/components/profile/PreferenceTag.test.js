import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PreferenceTag from './PreferenceTag';

describe('PreferenceTag', () => {
    it('renders the label and optional icon', async () => {
        const { getByText } = await render(<PreferenceTag label="Végétarien" icon="🌱" />);

        expect(getByText('Végétarien')).toBeTruthy();
        expect(getByText('🌱')).toBeTruthy();
    });

    it('does not render a remove button when onRemove is not provided', async () => {
        const { queryByTestId } = await render(<PreferenceTag label="Végétarien" />);

        expect(queryByTestId('preference-tag-remove')).toBeNull();
    });

    it('calls onRemove when the remove button is pressed', async () => {
        const onRemove = jest.fn();
        const { getByTestId } = await render(<PreferenceTag label="Arachide" onRemove={onRemove} />);

        fireEvent.press(getByTestId('preference-tag-remove'));

        await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
    });
});
