import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Platform,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import CheckboxRow from '../../components/common/CheckboxRow';
import BottomNav from '../../components/common/BottomNav';

let nextId = 1;

export default function CreateShoppingListScreen({ navigation }) {
    const [listName, setListName] = useState('');
    const [itemDraft, setItemDraft] = useState('');
    const [items, setItems] = useState([
        { id: 'seed-1', label: 'Lait', checked: false },
        { id: 'seed-2', label: 'Œufs', checked: false },
    ]);

    const handleAddItem = () => {
        const trimmed = itemDraft.trim();
        if (!trimmed) return;
        setItems((prev) => [...prev, { id: `item-${nextId++}`, label: trimmed, checked: false }]);
        setItemDraft('');
    };

    const toggleItem = (id) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

    const handleCreate = () => {
        // TODO: enregistrer la liste (listName, items)
        navigation?.navigate('MesListesCourses');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Text style={typography.h1}>Créer une nouvelle liste</Text>
                    <Text style={styles.subtitle}>
                        Organisez vos prochaines courses en un clin d'œil.
                    </Text>

                    <FormInput
                        label="Nom de la liste"
                        placeholder="Ex: Dîner de samedi"
                        value={listName}
                        onChangeText={setListName}
                    />

                    <Text style={styles.sectionTitle}>Articles / Recettes</Text>
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            placeholder="Ex: Farine, Sucre..."
                            placeholderTextColor={colors.textSecondary}
                            value={itemDraft}
                            onChangeText={setItemDraft}
                            onSubmitEditing={handleAddItem}
                        />
                        <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddItem}>
                            <Icon name="plus" size={16} color={colors.textOnDark} />
                            <Text style={styles.addButtonLabel}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {items.map((item) => (
                        <CheckboxRow
                            key={item.id}
                            label={item.label}
                            checked={item.checked}
                            onToggle={() => toggleItem(item.id)}
                            onDelete={() => removeItem(item.id)}
                        />
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.createButton} activeOpacity={0.85} onPress={handleCreate}>
                        <Icon name="check-circle" size={18} color={colors.textOnDark} style={{ marginRight: 8 }} />
                        <Text style={typography.button}>Créer la liste</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    addRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    addInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.card,
        fontSize: 14,
        color: colors.textPrimary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
    },
    addButtonLabel: {
        color: colors.textOnDark,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 54,
    },
});