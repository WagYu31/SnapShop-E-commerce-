import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { TouchableOpacity } from 'react-native';
import AnimatedButton from '../components/AnimatedButton';
import FadeInView from '../components/FadeInView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Semua field harus diisi');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password baru minimal 6 karakter');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/user/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });
            const json = await res.json();
            if (res.ok) {
                Alert.alert('Berhasil! ✅', 'Password berhasil diubah', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('Gagal', json.error || 'Password lama salah');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ubah Password</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <FadeInView delay={0}>
                        <View style={styles.iconSection}>
                            <View style={styles.lockIcon}>
                                <Ionicons name="lock-closed" size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.subtitle}>
                                Masukkan password lama dan password baru
                            </Text>
                        </View>
                    </FadeInView>

                    <FadeInView delay={100}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Password Lama</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                    placeholder="Masukkan password lama"
                                    placeholderTextColor={Colors.gray}
                                    secureTextEntry={!showOld}
                                />
                                <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                                    <Ionicons
                                        name={showOld ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>

                    <FadeInView delay={200}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Password Baru</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Min. 6 karakter"
                                    placeholderTextColor={Colors.gray}
                                    secureTextEntry={!showNew}
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                    <Ionicons
                                        name={showNew ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>

                    <FadeInView delay={300}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Ulangi password baru"
                                    placeholderTextColor={Colors.gray}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    <Ionicons
                                        name={showConfirm ? 'eye-off' : 'eye'}
                                        size={20}
                                        color={Colors.gray}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                        <FadeInView delay={0}>
                            <View style={styles.strengthSection}>
                                <View style={styles.strengthBar}>
                                    <View
                                        style={[
                                            styles.strengthFill,
                                            {
                                                width: newPassword.length < 6 ? '30%' : newPassword.length < 10 ? '60%' : '100%',
                                                backgroundColor: newPassword.length < 6 ? Colors.red : newPassword.length < 10 ? '#f59e0b' : '#22c55e',
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.strengthText, {
                                    color: newPassword.length < 6 ? Colors.red : newPassword.length < 10 ? '#f59e0b' : '#22c55e'
                                }]}>
                                    {newPassword.length < 6 ? 'Terlalu pendek' : newPassword.length < 10 ? 'Cukup kuat' : 'Sangat kuat'}
                                </Text>
                            </View>
                        </FadeInView>
                    )}

                    <FadeInView delay={400}>
                        <AnimatedButton
                            onPress={handleSubmit}
                            title={loading ? 'Menyimpan...' : 'Simpan Password'}
                            style={loading ? { ...styles.saveButton, opacity: 0.6 } : styles.saveButton}
                            textStyle={styles.saveButtonText}
                        />
                    </FadeInView>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold', fontSize: FontSize.xl, color: Colors.primaryText,
    },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
    iconSection: { alignItems: 'center', marginVertical: Spacing.xxl },
    lockIcon: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    subtitle: {
        fontFamily: 'Inter_400Regular', fontSize: FontSize.sm,
        color: Colors.secondaryText, textAlign: 'center',
    },
    fieldGroup: { marginBottom: Spacing.xl },
    fieldLabel: {
        fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm,
        color: Colors.secondaryText, marginBottom: Spacing.sm,
    },
    passwordContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
    },
    passwordInput: {
        flex: 1, fontFamily: 'Inter_400Regular', fontSize: FontSize.md,
        color: Colors.primaryText, paddingVertical: Spacing.md,
    },
    strengthSection: { marginBottom: Spacing.xxl },
    strengthBar: {
        height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 6,
    },
    strengthFill: { height: '100%', borderRadius: 2 },
    strengthText: {
        fontFamily: 'Inter_500Medium', fontSize: FontSize.xs,
    },
    saveButton: {
        backgroundColor: Colors.primary, paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl, alignItems: 'center',
    },
    saveButtonText: {
        fontFamily: 'Inter_600SemiBold', fontSize: FontSize.lg, color: Colors.white,
    },
});
