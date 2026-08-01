import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Modal,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import HeartIcon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import StatBox from '../../components/recipe/StatBox';
import CheckboxRow from '../../components/common/CheckboxRow';
import StepTimelineItem from '../../components/recipe/StepTimelineItem';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';
import * as shoppingListApi from '../../api/shoppingListApi';
import { printRecipe } from '../../utils/recipePrint';
import { showAlert } from '../../utils/appAlert';

export default function RecipeDetailScreen({ route, navigation }) {
    const { user, token } = useAuth();
    const recipeId = route?.params?.id;
    const { width: windowWidth } = useWindowDimensions();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checked, setChecked] = useState({});
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [addingToList, setAddingToList] = useState(false);
    const [listError, setListError] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [myLists, setMyLists] = useState([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [favorite, setFavorite] = useState(false);
    const [printing, setPrinting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const data = await recipeApi.getById(token, recipeId);
                    if (!cancelled) {
                        setRecipe(data);
                        setFavorite(!!data.favorite);
                    }
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger la recette.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [recipeId, token])
    );

    const handlePrint = async () => {
        if (printing) return;
        setPrinting(true);
        try {
            await printRecipe(recipe);
        } catch (err) {
            showAlert('Impression impossible', err.message || "Une erreur est survenue pendant la préparation de l'impression.");
        } finally {
            setPrinting(false);
        }
    };

    const toggleIngredient = (id) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleFavorite = async () => {
        const nextFavorite = !favorite;
        setFavorite(nextFavorite);
        try {
            if (nextFavorite) {
                await recipeApi.addFavorite(token, recipeId);
            } else {
                await recipeApi.removeFavorite(token, recipeId);
            }
        } catch {
            setFavorite(!nextFavorite);
        }
    };

    const handleOpenListPicker = async () => {
        setListError('');
        setPickerVisible(true);
        setLoadingLists(true);
        try {
            const lists = await shoppingListApi.getMine(token);
            setMyLists(lists);
        } catch (err) {
            setListError(err.message || 'Impossible de charger vos listes.');
        } finally {
            setLoadingLists(false);
        }
    };

    const closeListPicker = () => {
        if (addingToList) return;
        setPickerVisible(false);
        setNewListName('');
    };

    const handleSelectExistingList = async (list) => {
        setListError('');
        setAddingToList(true);
        try {
            for (const ingredient of recipe.ingredients) {
                await shoppingListApi.addItem(token, list.id, {
                    ingredientName: ingredient.name,
                    unit: ingredient.unit,
                    quantity: ingredient.quantity,
                });
            }
            setPickerVisible(false);
            navigation?.navigate('ListeCourses', { id: list.id });
        } catch (err) {
            setListError(err.message || "Impossible d'ajouter à cette liste.");
        } finally {
            setAddingToList(false);
        }
    };

    const handleCreateNewList = async () => {
        if (!newListName.trim()) {
            setListError('Donnez un nom à la nouvelle liste.');
            return;
        }
        setListError('');
        setAddingToList(true);
        try {
            const list = await shoppingListApi.generate(token, newListName.trim(), [recipe.id]);
            setPickerVisible(false);
            setNewListName('');
            navigation?.navigate('ListeCourses', { id: list.id });
        } catch (err) {
            setListError(err.message || 'Impossible de créer la liste.');
        } finally {
            setAddingToList(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !recipe) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error || 'Recette introuvable.'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const tag = recipe.diet || recipe.type;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero */}
                <View style={styles.hero}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
                            setActiveImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {(recipe.images.length ? recipe.images : [{ id: 'placeholder', url: null }]).map((img) => (
                            <Image
                                key={img.id}
                                source={img.url ? { uri: img.url } : images.imagePlaceholder}
                                style={{ width: windowWidth, height: 260 }}
                            />
                        ))}
                    </ScrollView>

                    <View style={styles.heroHeader} pointerEvents="box-none">
                        <TouchableOpacity
                            style={styles.heroIconButton}
                            onPress={() => navigation?.goBack()}
                        >
                            <Icon name="arrow-left" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.heroTitle}>Need for Food</Text>
                        <TouchableOpacity
                            style={styles.heroAvatarButton}
                            onPress={() => navigation?.navigate('Profil')}
                        >
                            <Image
                                source={user?.avatarUrl ? { uri: user.avatarUrl } : images.avatar}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>

                    {recipe.images.length > 1 ? (
                        <View style={styles.dotsRow} pointerEvents="none">
                            {recipe.images.map((img, idx) => (
                                <View
                                    key={img.id}
                                    style={[styles.dot, idx === activeImageIndex && styles.dotActive]}
                                />
                            ))}
                        </View>
                    ) : null}
                </View>

                <View style={styles.contentBlock}>
                    {tag ? (
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagBadgeText}>{tag}</Text>
                        </View>
                    ) : null}
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, styles.titleText]}>{recipe.title}</Text>
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            activeOpacity={0.7}
                            onPress={handlePrint}
                            disabled={printing}
                        >
                            {printing ? (
                                <ActivityIndicator size="small" color={colors.textSecondary} />
                            ) : (
                                <Icon name="printer" size={22} color={colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            activeOpacity={0.7}
                            onPress={toggleFavorite}
                        >
                            <HeartIcon
                                name={favorite ? 'favorite' : 'favorite-border'}
                                size={26}
                                color={favorite ? colors.danger : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {recipe.username ? (
                        <View style={styles.creatorRow}>
                            <Image
                                source={recipe.userAvatarUrl ? { uri: recipe.userAvatarUrl } : images.avatar}
                                style={styles.creatorAvatar}
                            />
                            <Text style={styles.creatorText}>
                                Créé par {recipe.userId === user?.id ? 'vous' : recipe.username}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.statsCard}>
                        <StatBox
                            icon="clock"
                            label="TEMPS"
                            value={recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—'}
                        />
                        <StatBox icon="bar-chart-2" label="DIFFICULTÉ" value={recipe.difficulty || '—'} />
                        <StatBox
                            icon="list"
                            label="INGRÉDIENTS"
                            value={String(recipe.ingredients.length)}
                            isLast={recipe.servings == null}
                        />
                        {recipe.servings != null ? (
                            <StatBox icon="users" label="PERSONNES" value={String(recipe.servings)} isLast />
                        ) : null}
                    </View>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={typography.h2}>Ingrédients</Text>
                    </View>
                    {recipe.ingredients.map((ingredient) => (
                        <CheckboxRow
                            key={ingredient.ingredientId}
                            label={`${ingredient.quantity}${ingredient.unit} de ${ingredient.name}`}
                            checked={!!checked[ingredient.ingredientId]}
                            onToggle={() => toggleIngredient(ingredient.ingredientId)}
                        />
                    ))}

                    <TouchableOpacity
                        style={styles.addToListButton}
                        activeOpacity={0.85}
                        onPress={handleOpenListPicker}
                    >
                        <Icon name="shopping-cart" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                        <Text style={typography.button}>Ajouter à la liste de courses</Text>
                    </TouchableOpacity>

                    <Text style={[typography.h2, styles.stepsTitle]}>Étapes de préparation</Text>
                    {recipe.steps.map((step, index) => (
                        <StepTimelineItem
                            key={index}
                            number={index + 1}
                            content={step}
                            isLast={index === recipe.steps.length - 1}
                        />
                    ))}

                    {recipe.userId === user?.id ? (
                        <TouchableOpacity
                            style={styles.editButton}
                            activeOpacity={0.85}
                            onPress={() => navigation?.navigate('ModifierRecette', { id: recipe.id })}
                        >
                            <Icon name="edit-2" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                            <Text style={typography.button}>Modifier cette recette</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </ScrollView>

            <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={closeListPicker}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeListPicker}>
                    <TouchableOpacity activeOpacity={1} style={styles.pickerCard} onPress={() => {}}>
                        <Text style={styles.pickerTitle}>Ajouter à une liste</Text>

                        {loadingLists ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
                        ) : myLists.length > 0 ? (
                            <ScrollView style={styles.pickerListScroll}>
                                {myLists.map((list) => (
                                    <TouchableOpacity
                                        key={list.id}
                                        style={styles.pickerListRow}
                                        activeOpacity={0.7}
                                        onPress={() => handleSelectExistingList(list)}
                                        disabled={addingToList}
                                    >
                                        <Icon name="shopping-cart" size={16} color={colors.primary} />
                                        <Text style={styles.pickerListName} numberOfLines={1}>{list.name}</Text>
                                        <Text style={styles.pickerListCount}>{list.items.length} art.</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.pickerEmptyText}>Vous n'avez pas encore de liste.</Text>
                        )}

                        <View style={styles.pickerDivider} />

                        <Text style={styles.pickerSubtitle}>Ou créer une nouvelle liste</Text>
                        <View style={styles.pickerNewRow}>
                            <TextInput
                                style={styles.pickerInput}
                                placeholder="Nom de la liste"
                                placeholderTextColor={colors.textSecondary}
                                value={newListName}
                                onChangeText={setNewListName}
                            />
                            <TouchableOpacity
                                style={styles.pickerCreateButton}
                                activeOpacity={0.85}
                                onPress={handleCreateNewList}
                                disabled={addingToList}
                            >
                                <Icon name="plus" size={16} color={colors.textOnDark} />
                            </TouchableOpacity>
                        </View>

                        {!!listError && <Text style={styles.pickerError}>{listError}</Text>}
                        {addingToList ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} /> : null}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: colors.danger,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    hero: {
        width: '100%',
        height: 260,
        position: 'relative',
    },
    heroHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    dotsRow: {
        position: 'absolute',
        bottom: spacing.sm,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginHorizontal: 3,
    },
    dotActive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textOnDark,
    },
    heroIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroAvatarButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.primarySoft,
    },
    heroTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryDark,
        backgroundColor: 'rgba(255,255,255,0.85)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    contentBlock: {
        paddingHorizontal: spacing.lg,
        marginTop: -spacing.lg,
    },
    tagBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
        marginBottom: spacing.xs,
    },
    tagBadgeText: {
        color: colors.textOnDark,
        fontSize: 12,
        fontWeight: '700',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        ...typography.h1,
        fontSize: 26,
        marginBottom: spacing.xs,
    },
    titleText: {
        flex: 1,
        marginRight: spacing.sm,
    },
    favoriteButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    creatorAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: spacing.xs,
    },
    creatorText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    addToListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    pickerCard: {
        width: '100%',
        maxWidth: 360,
        maxHeight: '80%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    pickerTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
    },
    pickerListScroll: {
        maxHeight: 200,
    },
    pickerListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    pickerListName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    pickerListCount: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    pickerEmptyText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    pickerDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    pickerSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    pickerNewRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    pickerInput: {
        flex: 1,
        height: 46,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        fontSize: 14,
        color: colors.textPrimary,
    },
    pickerCreateButton: {
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
    },
    pickerError: {
        color: colors.danger,
        fontSize: 13,
        marginTop: spacing.sm,
    },
    stepsTitle: {
        marginBottom: spacing.md,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
});
