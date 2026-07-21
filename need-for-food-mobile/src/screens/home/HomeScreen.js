import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('populaire');

    return (
        <SafeAreaView>
            <ScrollView>
                <View>
                    <Text>Bon appétit !</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}