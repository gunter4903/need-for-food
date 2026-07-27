import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';
import PreferenceTag from './PreferenceTag';

export default function PreferenceTagList({ label, items, onAdd, onRemove, placeholder = 'Ajouter...' }) {
    const [showAdd, setShowAdd] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        const trimmed = draft.trim();
        if (!trimmed || items.includes(trimmed)) {
            setDraft('');
            setShowAdd(false);
            return;
        }
        setSaving(true);
        try {
            await onAdd(trimmed);
            setDraft('');
            setShowAdd(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.tagsRow}>
                {items.map((item) => (
                    <PreferenceTag key={item} label={item} onRemove={() => onRemove(item)} />
                ))}
                {showAdd ? (
                    <View style={styles.addInputRow}>
                        <TextInput
                            style={styles.addInput}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textSecondary}
                            value={draft}
                            onChangeText={setDraft}
                            autoFocus
                            onSubmitEditing={handleAdd}
                        />
                        <TouchableOpacity
                            style={styles.addConfirm}
                            activeOpacity={0.8}
                            onPress={handleAdd}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={colors.textOnDark} />
                            ) : (
                                <Icon name="check" size={14} color={colors.textOnDark} />
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addTag} activeOpacity={0.8} onPress={() => setShowAdd(true)}>
                        <Icon name="plus" size={13} color={colors.textPrimary} />
                        <Text style={styles.addTagLabel}>Ajouter</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    addTag: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    addTagLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 4,
    },
    addInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    addInput: {
        height: 36,
        minWidth: 120,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        fontSize: 13,
        color: colors.textPrimary,
        backgroundColor: colors.card,
        marginRight: spacing.xs,
    },
    addConfirm: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
    },
});
