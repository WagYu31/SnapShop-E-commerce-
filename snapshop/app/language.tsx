import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../contexts/ThemeContext';

const languages = [
    { id: '1', name: 'Bahasa Indonesia', code: 'id', flag: '🇮🇩' },
    { id: '2', name: 'English', code: 'en', flag: '🇺🇸' },
    { id: '3', name: 'Bahasa Melayu', code: 'ms', flag: '🇲🇾' },
    { id: '4', name: '日本語', code: 'ja', flag: '🇯🇵' },
    { id: '5', name: '한국어', code: 'ko', flag: '🇰🇷' },
    { id: '6', name: '中文', code: 'zh', flag: '🇨🇳' },
    { id: '7', name: 'العربية', code: 'ar', flag: '🇸🇦' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const [selectedLang, setSelectedLang] = useState('id');
    const { isDark, toggleTheme, colors } = useTheme();

    return (
        <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
            <View style={[styles.header, isDark && { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? colors.primaryText : Colors.primaryText} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: colors.primaryText }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Dark Mode Toggle */}
                <FadeInView delay={0}>
                    <Text style={[styles.sectionLabel, isDark && { color: colors.secondaryText }]}>Appearance</Text>
                    <View style={[styles.darkModeRow, isDark && { backgroundColor: colors.cardElevated }]}>
                        <View style={styles.darkModeLeft}>
                            <View style={[styles.darkModeIcon, isDark && { backgroundColor: colors.surface }]}>
                                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#A78BFA' : '#FF9500'} />
                            </View>
                            <View>
                                <Text style={[styles.darkModeTitle, isDark && { color: colors.primaryText }]}>Dark Mode</Text>
                                <Text style={[styles.darkModeDesc, isDark && { color: colors.secondaryText }]}>{isDark ? 'On' : 'Off'}</Text>
                            </View>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: Colors.border, true: '#A78BFA' }}
                            thumbColor={Colors.white}
                        />
                    </View>
                </FadeInView>

                <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl }, isDark && { color: colors.secondaryText }]}>Select Language</Text>
                {languages.map((lang, index) => (
                    <FadeInView key={lang.id} delay={100 + index * 60}>
                        <TouchableOpacity
                            style={[styles.langItem, isDark && { backgroundColor: colors.cardElevated, borderColor: 'transparent' }, selectedLang === lang.code && styles.langSelected, selectedLang === lang.code && isDark && { borderColor: colors.accent, backgroundColor: colors.surface }]}
                            onPress={() => setSelectedLang(lang.code)}
                        >
                            <Text style={styles.langFlag}>{lang.flag}</Text>
                            <Text style={[styles.langName, isDark && { color: colors.primaryText }, selectedLang === lang.code && styles.langNameSelected]}>
                                {lang.name}
                            </Text>
                            {selectedLang === lang.code && (
                                <Ionicons name="checkmark-circle" size={22} color={isDark ? colors.accent : Colors.primary} />
                            )}
                        </TouchableOpacity>
                    </FadeInView>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg,
    },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: FontSize.xl, color: Colors.primaryText },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
    sectionLabel: {
        fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm, color: Colors.secondaryText,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.lg,
    },
    langItem: {
        flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent',
    },
    langSelected: { borderColor: Colors.primary, backgroundColor: '#F8F8FF' },
    langFlag: { fontSize: 28, marginRight: Spacing.lg },
    langName: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.primaryText },
    langNameSelected: { fontFamily: 'Inter_700Bold' },
    darkModeRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.sm,
    },
    darkModeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    darkModeIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white,
        justifyContent: 'center', alignItems: 'center',
    },
    darkModeTitle: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.md, color: Colors.primaryText },
    darkModeDesc: { fontFamily: 'Inter_400Regular', fontSize: FontSize.sm, color: Colors.secondaryText },
});
