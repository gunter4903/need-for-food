import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MultiPhotoPicker from './MultiPhotoPicker';

describe('MultiPhotoPicker', () => {
    it('renders one tile per image and calls onAdd when the add tile is pressed', async () => {
        const onAdd = jest.fn();
        const images = [{ key: 'a', uri: 'file://a.jpg' }, { key: 'b', uri: 'file://b.jpg' }];

        const { getByText } = await render(
            <MultiPhotoPicker images={images} onAdd={onAdd} onRemove={jest.fn()} maxCount={5} />
        );

        fireEvent.press(getByText('Ajouter'));

        await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    });

    it('calls onRemove with the image key when its remove badge is pressed', async () => {
        const onRemove = jest.fn();
        const images = [{ key: 'a', uri: 'file://a.jpg' }];

        const { getByTestId } = await render(
            <MultiPhotoPicker images={images} onAdd={jest.fn()} onRemove={onRemove} maxCount={5} />
        );

        fireEvent.press(getByTestId('multi-photo-picker-remove-a'));

        await waitFor(() => expect(onRemove).toHaveBeenCalledWith('a'));
    });

    it('hides the add tile once maxCount is reached', async () => {
        const images = [
            { key: 'a', uri: 'file://a.jpg' },
            { key: 'b', uri: 'file://b.jpg' },
        ];

        const { queryByText } = await render(
            <MultiPhotoPicker images={images} onAdd={jest.fn()} onRemove={jest.fn()} maxCount={2} />
        );

        expect(queryByText('Ajouter')).toBeNull();
    });
});
